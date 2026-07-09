<script setup lang="ts">
import { getIconByName } from "../utils/icons";

/**
 * 面板卡片壳组件。
 *
 * 统一工具页面中左右面板的卡片结构：
 * 标题栏（图标 + 文字 + 可选操作区）+ 分隔线 + 内容区。
 *
 * 用于 base64-codec、sql-generator、regex-tester 等使用固定分栏的工具页面。
 * JSON/YAML 格式化的子组件（InputPanel、JsonTreePanel 等）自带卡片壳，不需要此组件。
 */
withDefaults(
  defineProps<{
    /** 标题栏文字 */
    title: string;
    /** 标题栏左侧图标，默认 FileTextOutlined */
    icon?: string;
    /** 内容区 overflow 行为，默认 hidden */
    overflow?: "hidden" | "auto";
  }>(),
  {
    icon: "FileTextOutlined",
    overflow: "hidden",
  },
);
</script>

<template>
  <section
    class="d-flex flex-column"
    style="
      height: 100%;
      min-height: 0;
      overflow: hidden;
      border: 1px solid var(--app-border);
      border-radius: 4px;
      background-color: var(--app-surface);
    "
  >
    <header
      class="d-flex align-center text-body-2 font-weight-medium px-2 py-1"
      style="
        flex: 0 0 auto;
        gap: 4px;
        border-bottom: 1px solid var(--app-border);
      "
    >
      <component
        :is="getIconByName(icon)"
        v-if="icon"
        style="font-size: 14px; color: var(--app-text-muted)"
      />
      {{ title }}
      <!-- 占位替代 v-spacer -->
      <span style="flex: 1 1 auto" />
      <!-- 标题栏右侧操作区（搜索按钮等） -->
      <slot name="actions" />
    </header>

    <div class="pa-2" :style="{ flex: 1, minHeight: 0, overflow }">
      <slot />
    </div>
  </section>
</template>
