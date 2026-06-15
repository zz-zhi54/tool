<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

import { getStorage, setStorage } from "../utils/storage";
import type { StorageItem } from "../utils/storage";

/**
 * 左右分栏容器组件。
 *
 * 支持两种模式：
 * - 可拖拽调节比例（传入 storageItem，比例持久化到 localStorage）
 * - 固定 50/50 分栏（不传 storageItem）
 *
 * 拖拽比例默认限制在 15% - 85% 之间，避免任意一侧被压到不可用。
 */
const props = withDefaults(
  defineProps<{
    /** 分栏比例存储项；不传则固定 50/50 不可拖拽 */
    storageItem?: StorageItem<number> | null;
    /** 无存储项时的左侧面板百分比，默认 50 */
    defaultPercent?: number;
  }>(),
  {
    storageItem: null,
    defaultPercent: 50,
  },
);

/** 是否启用可拖拽调节 */
const resizable = computed(() => props.storageItem !== null);

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
 * 从集中存储读取已保存的面板比例。
 * 无存储项时返回 defaultPercent。
 */
function readPercent(): number {
  if (!props.storageItem) {
    return props.defaultPercent;
  }

  return clampPercent(getStorage(props.storageItem));
}

/**
 * 将当前面板比例写入集中存储。
 */
function savePercent(): void {
  if (props.storageItem) {
    setStorage(props.storageItem, leftPercent.value);
  }
}

/**
 * 读取当前存储项允许的比例范围。
 */
function getPercentRange(): { min: number; max: number } {
  const control = props.storageItem?.control;

  if (control?.type === "slider") {
    return { min: control.min, max: control.max };
  }

  return { min: 15, max: 85 };
}

/**
 * 限制左右面板比例范围。
 */
function clampPercent(value: number): number {
  const { min, max } = getPercentRange();
  return Math.min(max, Math.max(min, value));
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
