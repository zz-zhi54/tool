<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

import { bindWindowDrag } from "../composables/useWindowDrag";
import { showDragBar } from "../utils/platform";

/**
 * 工具窗口顶部 drag bar。
 *
 * 仅 macOS 渲染（Tauri titleBarStyle: Overlay 让 web 内容延伸到原生标题栏下方，
 * 红绿灯浮在 web 内容上，需要让位区）。Windows / Linux 由 OS 原生标题栏负责
 * 拖动 + 关闭按钮，浏览器没有红绿灯——都不需要这块占位。
 *
 * 工具标题不在这里显示——侧边栏已展示当前工具的 icon + name，顶部重复一次
 * 没有信息量（参考 cc-switch 的极简顶部）。
 *
 * 视觉（28px 高度 + 主题背景色 + flex-shrink: 0 防止被 flex 父级压缩）
 * 由 inline style 表达：属于 antdv 没有 prop 的尺寸约束，是必要例外。
 */
const dragBarEl = ref<HTMLElement | null>(null);
let unbind: (() => void) | null = null;

onMounted(() => {
  if (dragBarEl.value) unbind = bindWindowDrag(dragBarEl.value);
});

onBeforeUnmount(() => {
  unbind?.();
});
</script>

<template>
  <header
    v-if="showDragBar()"
    ref="dragBarEl"
    data-tauri-drag-region
    style="height: 28px; flex-shrink: 0; background: var(--app-surface)"
  />
</template>
