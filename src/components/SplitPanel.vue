<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

/**
 * 左右分栏容器组件。
 *
 * 支持两种模式：
 * - 可拖拽调节比例（传入 storageKey，比例持久化到 localStorage）
 * - 固定 50/50 分栏（不传 storageKey）
 *
 * 拖拽比例限制在 15% - 85% 之间，避免任意一侧被压到不可用。
 */
const props = withDefaults(
  defineProps<{
    /** localStorage 键名；不传则固定 50/50 不可拖拽 */
    storageKey?: string | null;
    /** 初始左侧面板百分比，默认 50 */
    defaultPercent?: number;
  }>(),
  {
    storageKey: null,
    defaultPercent: 50,
  },
);

/** 是否启用可拖拽调节 */
const resizable = computed(() => props.storageKey !== null);

/** 左侧面板宽度百分比 */
const leftPercent = ref(readPercent());

/** 拖拽进行中标记，用于禁用文本选中 */
const isResizing = ref(false);

/** 工作区容器 ref，用于计算拖拽时的相对位置 */
const workspaceRef = ref<HTMLElement | null>(null);

/** 工作区容器样式 */
const workspaceStyle = computed(() => ({
  flex: "1 1 auto",
  minHeight: 0,
  overflow: "hidden",
  userSelect: isResizing.value ? ("none" as const) : undefined,
}));

/** 左侧面板宽度样式 */
const leftStyle = computed(() =>
  resizable.value ? { flexBasis: `${leftPercent.value}%` } : { flex: 1 },
);

/** 右侧面板宽度样式 */
const rightStyle = computed(() =>
  resizable.value ? { flexBasis: `${100 - leftPercent.value}%` } : { flex: 1 },
);

/**
 * 从 localStorage 读取已保存的面板比例。
 * 未设置或解析失败时返回 defaultPercent。
 */
function readPercent(): number {
  if (!props.storageKey) {
    return props.defaultPercent;
  }

  const raw = localStorage.getItem(props.storageKey);

  if (raw === null) {
    return props.defaultPercent;
  }

  try {
    return JSON.parse(raw) as number;
  } catch {
    return props.defaultPercent;
  }
}

/**
 * 将当前面板比例写入 localStorage。
 */
function savePercent(): void {
  if (props.storageKey) {
    localStorage.setItem(props.storageKey, JSON.stringify(leftPercent.value));
  }
}

/**
 * 限制左右面板比例范围在 15% - 85%。
 */
function clampPercent(value: number): number {
  return Math.min(85, Math.max(15, value));
}

/**
 * 开始拖拽：监听全局 pointermove / pointerup。
 */
function startResize(event: PointerEvent) {
  isResizing.value = true;
  window.addEventListener("pointermove", handleResize);
  window.addEventListener("pointerup", stopResize);
  handleResize(event);
}

/**
 * 拖拽中：根据指针位置计算左侧面板占比。
 */
function handleResize(event: PointerEvent) {
  const bounds = workspaceRef.value?.getBoundingClientRect();

  if (!bounds) {
    return;
  }

  const nextPercent = ((event.clientX - bounds.left) / bounds.width) * 100;
  leftPercent.value = clampPercent(nextPercent);
}

/**
 * 结束拖拽：保存比例并清理全局事件。
 */
function stopResize() {
  isResizing.value = false;
  savePercent();
  window.removeEventListener("pointermove", handleResize);
  window.removeEventListener("pointerup", stopResize);
}

/**
 * 键盘微调分割条位置（方向键 ±5%）。
 */
function resizeBy(delta: number) {
  leftPercent.value = clampPercent(leftPercent.value + delta);
  savePercent();
}

onBeforeUnmount(stopResize);
</script>

<template>
  <!--
    工作区容器：左右面板水平排列。
    ga-2 子元素间距；overflow:hidden 防止滚动溢出到外部。
  -->
  <div ref="workspaceRef" class="d-flex ga-2" :style="workspaceStyle">
    <!-- 左侧面板 -->
    <section style="min-width: 0; min-height: 0" :style="leftStyle">
      <slot name="left" />
    </section>

    <!-- 拖拽分割条：仅可拖拽模式下渲染 -->
    <v-sheet
      v-if="resizable"
      aria-label="调整左右面板宽度"
      role="separator"
      style="width: 8px; cursor: col-resize; flex: 0 0 8px"
      tabindex="0"
      @keydown.left.prevent="resizeBy(-5)"
      @keydown.right.prevent="resizeBy(5)"
      @pointerdown.prevent="startResize"
    />

    <!-- 右侧面板 -->
    <section style="min-width: 0; min-height: 0" :style="rightStyle">
      <slot name="right" />
    </section>
  </div>
</template>
