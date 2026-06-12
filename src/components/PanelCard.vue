<script setup lang="ts">
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
    /** 标题栏左侧图标，默认 $file */
    icon?: string;
    /** 内容区 overflow 行为，默认 hidden */
    overflow?: "hidden" | "auto";
  }>(),
  {
    icon: "$file",
    overflow: "hidden",
  },
);
</script>

<template>
  <v-card
    border="sm"
    class="d-flex flex-column"
    flat
    height="100%"
    style="min-height: 0; overflow: hidden"
  >
    <v-card-title
      class="d-flex align-center text-body-2 font-weight-medium px-2 py-1"
    >
      <v-icon class="mr-1" :icon="icon" size="small" />
      {{ title }}
      <v-spacer />
      <!-- 标题栏右侧操作区（搜索按钮等） -->
      <slot name="actions" />
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-2" :style="{ flex: 1, minHeight: 0, overflow }">
      <slot />
    </v-card-text>
  </v-card>
</template>
