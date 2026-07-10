<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

import type { ToolDefinition } from "../types/tool";
import { bindWindowDrag } from "../composables/useWindowDrag";

/**
 * 工具窗口顶部双层结构：
 * 1) 28px drag bar —— 让位给 macOS 红绿灯 + 整窗口拖动
 * 2) 内容 header —— 显示当前工具标题
 *
 * 两个块级 <header> 自然上下排列；必要的高度 / 内边距 / 底分隔线
 * 通过 inline style 设置（antdv 组件没有 prop 直接表达这些结构性视觉）。
 */
defineProps<{
  currentTool: ToolDefinition;
}>();

const dragBarEl = ref<HTMLElement | null>(null);
const contentHeaderEl = ref<HTMLElement | null>(null);
let unbindA: (() => void) | null = null;
let unbindB: (() => void) | null = null;

onMounted(() => {
  if (dragBarEl.value) unbindA = bindWindowDrag(dragBarEl.value);
  if (contentHeaderEl.value) unbindB = bindWindowDrag(contentHeaderEl.value);
});

onBeforeUnmount(() => {
  unbindA?.();
  unbindB?.();
});
</script>

<template>
  <header ref="dragBarEl" data-tauri-drag-region style="height: 28px" />

  <header
    ref="contentHeaderEl"
    data-tauri-drag-region
    style="
      display: flex;
      align-items: center;
      padding: 4px 12px;
      font-size: 14px;
      font-weight: 500;
      border-bottom: 1px solid var(--app-border);
    "
  >
    <a-flex align="center" :gap="8">
      <strong>{{ currentTool.title }}</strong>
    </a-flex>
  </header>
</template>
