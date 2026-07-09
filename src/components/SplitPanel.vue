<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

import { load, save } from "../utils/storage";

/**
 * 左右分栏容器组件。
 *
 * 传入 panelKey 启用可拖拽并持久化到 localStorage；不传则固定 50/50。
 */
const props = withDefaults(
  defineProps<{
    /** localStorage 键名；不传则固定 50/50 不可拖拽 */
    panelKey?: string | null;
    /** 无存储键时的左侧面板百分比，默认 50 */
    defaultPercent?: number;
  }>(),
  { panelKey: null, defaultPercent: 50 },
);

const resizable = computed(() => props.panelKey !== null);
const leftPercent = ref(readPercent());
const isResizing = ref(false);
const workspaceRef = ref<HTMLElement | null>(null);

const workspaceStyle = computed(() => ({
  flex: "1 1 auto",
  minHeight: 0,
  overflow: "hidden",
  userSelect: isResizing.value ? ("none" as const) : undefined,
}));

const leftStyle = computed(() =>
  resizable.value ? { flexBasis: `${leftPercent.value}%` } : { flex: 1 },
);

const rightStyle = computed(() =>
  resizable.value ? { flexBasis: `${100 - leftPercent.value}%` } : { flex: 1 },
);

function readPercent(): number {
  if (!props.panelKey) return props.defaultPercent;
  return clampPercent(load(props.panelKey, props.defaultPercent));
}

function savePercent(): void {
  if (props.panelKey) save(props.panelKey, leftPercent.value);
}

function clampPercent(value: number): number {
  return Math.min(85, Math.max(15, value));
}

function startResize(event: PointerEvent) {
  isResizing.value = true;
  window.addEventListener("pointermove", handleResize);
  window.addEventListener("pointerup", stopResize);
  handleResize(event);
}

function handleResize(event: PointerEvent) {
  const bounds = workspaceRef.value?.getBoundingClientRect();
  if (!bounds) return;
  leftPercent.value = clampPercent(
    ((event.clientX - bounds.left) / bounds.width) * 100,
  );
}

function stopResize() {
  isResizing.value = false;
  savePercent();
  window.removeEventListener("pointermove", handleResize);
  window.removeEventListener("pointerup", stopResize);
}

function resizeBy(delta: number) {
  leftPercent.value = clampPercent(leftPercent.value + delta);
  savePercent();
}

onBeforeUnmount(stopResize);
</script>

<template>
  <div ref="workspaceRef" class="d-flex ga-2" :style="workspaceStyle">
    <section style="min-width: 0; min-height: 0" :style="leftStyle">
      <slot name="left" />
    </section>

    <!-- 分隔条：仅在 resizable 时渲染 -->
    <div
      v-if="resizable"
      aria-label="调整左右面板宽度"
      role="separator"
      tabindex="0"
      class="split-handle"
      @keydown.left.prevent="resizeBy(-5)"
      @keydown.right.prevent="resizeBy(5)"
      @pointerdown.prevent="startResize"
    />

    <section style="min-width: 0; min-height: 0" :style="rightStyle">
      <slot name="right" />
    </section>
  </div>
</template>

<style scoped>
.split-handle {
  width: 8px;
  flex: 0 0 8px;
  cursor: col-resize;
  border-radius: 4px;
  align-self: stretch;
  background-color: transparent;
  transition: background-color 120ms ease;
}
.split-handle:hover,
.split-handle:focus {
  background-color: var(--app-border);
  outline: none;
}
</style>
