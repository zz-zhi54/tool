<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

/**
 * 上下分栏容器组件。
 *
 * 输入在上、输出在下，中间是 8px 可拖拽分隔条，鼠标拖动或键盘 ↑/↓ 调整比例。
 * 不持久化占比，每次打开固定 50/50（避免给用户「我上次调好了怎么没了」的错觉，
 * 桌面工具窗口一般也不需要记忆每个工具的尺寸）。
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

const workspaceStyle = computed(() => ({
  height: "100%",
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  minHeight: 0,
  overflow: "hidden",
  userSelect: isResizing.value ? ("none" as const) : undefined,
}));

const topStyle = computed(() => ({
  flex: `0 0 ${topPercent.value}%`,
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
}));

const bottomStyle = computed(() => ({
  flex: `1 1 ${MAX_PERCENT - topPercent.value}%`,
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
}));

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
  <div ref="workspaceRef" :style="workspaceStyle">
    <section :style="topStyle">
      <slot name="top" />
    </section>

    <div
      aria-label="调整上下面板高度"
      aria-orientation="horizontal"
      role="separator"
      tabindex="0"
      class="split-handle"
      @keydown.up.prevent="resizeBy(STEP_PERCENT)"
      @keydown.down.prevent="resizeBy(-STEP_PERCENT)"
      @pointerdown.prevent="startResize"
    />

    <section :style="bottomStyle">
      <slot name="bottom" />
    </section>
  </div>
</template>

<style scoped>
.split-handle {
  flex: 0 0 8px;
  height: 8px;
  align-self: stretch;
  cursor: row-resize;
  border-radius: 4px;
  background-color: transparent;
  transition: background-color 120ms ease;
}
.split-handle:hover,
.split-handle:focus-visible {
  background-color: var(--app-border);
  outline: none;
}
</style>
