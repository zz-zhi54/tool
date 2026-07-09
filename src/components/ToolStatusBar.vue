<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

import type { ToolDefinition } from "../types/tool";
import { useAppTheme } from "../composables/useAppTheme";
import { bindWindowDrag } from "../composables/useWindowDrag";

const props = defineProps<{
  currentTool: ToolDefinition;
}>();

// ── 主题 store（仍需要，但 UI 已搬到 AppNavigation） ─────

const themeStore = useAppTheme();

// ── 窗口 drag 绑定 ───────────────────────────────────────

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

// ── 样式 ─────────────────────────────────────────────────

const DRAG_BAR_HEIGHT = 28;

const dragBarStyle = () => ({
  height: DRAG_BAR_HEIGHT + "px",
  backgroundColor: themeStore.tokens.value.surface,
});

const headerStyle = () => ({
  backgroundColor: themeStore.tokens.value.surface,
  color: themeStore.tokens.value.text,
  borderBottom: "1px solid " + themeStore.tokens.value.border,
  padding: "4px 12px",
});
</script>

<template>
  <!--
    顶层 28px drag bar：
    - macOS：让位红绿灯（traffic lights 浮在 drag bar 区域上）
    - 其他：也保留为拖动区
  -->
  <header
    ref="dragBarEl"
    :style="dragBarStyle()"
    data-tauri-drag-region
    class="titlebar-drag-bar"
  />

  <!--
    主 header：只显示当前工具标题。
    「本地处理」tag 已移除（桌面端 Tauri 应用一切都是本地处理，纯冗余）。
    「主题」按钮已搬到 AppNavigation，与「设置」按钮同一行。
  -->
  <header
    ref="contentHeaderEl"
    :style="headerStyle()"
    data-tauri-drag-region
    class="titlebar-header"
  >
    <span class="font-weight-medium">{{ props.currentTool.title }}</span>
  </header>
</template>

<style scoped>
.titlebar-drag-bar {
  flex: 0 0 auto;
  width: 100%;
}

.titlebar-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  cursor: default;
}
</style>
