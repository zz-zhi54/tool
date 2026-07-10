<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

/**
 * 上下分栏容器组件。
 *
 * 输入在上、输出在下，中间是 8px 可拖拽分隔条，鼠标拖动或键盘 ↑/↓ 调整比例。
 * 不持久化占比，每次打开固定 50/50（避免给用户「我上次调好了怎么没了」的错觉，
 * 桌面工具窗口一般也不需要记忆每个工具的尺寸）。
 *
 * antdv 没有可拖拽分隔条组件，因此分隔条本身保留必要的 inline style
 * （cursor / pointer-events / height），属于 antdv 框架本身的 API 缺口。
 */
const FALLBACK_PERCENT = 50;
const MIN_PERCENT = 15;
const MAX_PERCENT = 85;
const STEP_PERCENT = 5;

const props = withDefaults(
  defineProps<{
    /** 初始上方面板占比（15-85），默认 50 */
    defaultPercent?: number;
  }>(),
  { defaultPercent: FALLBACK_PERCENT },
);

const topPercent = ref(clampPercent(props.defaultPercent));
const isResizing = ref(false);
const workspaceRef = ref<HTMLElement | null>(null);

function clampPercent(value: number): number {
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, value));
}

function startResize(event: PointerEvent) {
  isResizing.value = true;
  window.addEventListener("pointermove", handleResize);
  window.addEventListener("pointerup", stopResize);
  handleResize(event);
}

function handleResize(event: PointerEvent) {
  const bounds = workspaceRef.value?.getBoundingClientRect();
  if (!bounds || bounds.height === 0) return;
  topPercent.value = clampPercent(
    ((event.clientY - bounds.top) / bounds.height) * 100,
  );
}

function stopResize() {
  isResizing.value = false;
  window.removeEventListener("pointermove", handleResize);
  window.removeEventListener("pointerup", stopResize);
}

function resizeBy(delta: number) {
  topPercent.value = clampPercent(topPercent.value + delta);
}

onBeforeUnmount(stopResize);
</script>

<template>
  <!--
    workspace 是 flex 纵向容器，inline style 用于：
    - flex 容器高度（占满父级）
    - 拖拽时禁止文本选中（userSelect）
    这些是 antdv 没有 prop 直接表达的 flex 容器行为。
  -->
  <div
    ref="workspaceRef"
    style="
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 0;
      overflow: hidden;
    "
    :style="isResizing ? { userSelect: 'none' } : undefined"
  >
    <!--
      上方面板：flex-basis 是运行时计算值（拖拽时改变），
      属于动态值，必须保留 inline style。
    -->
    <section
      :style="{
        flex: `0 0 ${topPercent}%`,
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
      }"
    >
      <slot name="top" />
    </section>

    <!--
      可拖拽分隔条：antdv 没有对应组件，
      cursor / pointer-events / height 是必需样式。
    -->
    <div
      aria-label="调整上下面板高度"
      aria-orientation="horizontal"
      role="separator"
      tabindex="0"
      style="
        flex: 0 0 8px;
        height: 8px;
        align-self: stretch;
        cursor: row-resize;
        border-radius: 4px;
        background-color: transparent;
        transition: background-color 120ms ease;
      "
      @keydown.up.prevent="resizeBy(STEP_PERCENT)"
      @keydown.down.prevent="resizeBy(-STEP_PERCENT)"
      @pointerdown.prevent="startResize"
    />

    <!-- 下方面板：flex 同样动态计算 -->
    <section
      :style="{
        flex: `1 1 ${MAX_PERCENT - topPercent}%`,
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
      }"
    >
      <slot name="bottom" />
    </section>
  </div>
</template>
