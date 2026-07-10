<script setup lang="ts">
import { getIconByName } from "../utils/icons";

/**
 * 输出面板卡片壳：标题栏 + 滚动内容区。
 *
 * 与 `PanelCard` 的区别仅在内容区 overflow 语义：
 * - `PanelCard` 默认 `overflow: hidden`，适合放 a-textarea 这种自身有滚动条的元素；
 * - `OutputPanel` 默认 `overflow: auto`，适合放 a-tree / 自定义列表 / 自定义渲染，
 *   这些组件高度随内容增长，由本面板统一管理纵向滚动。
 *
 * 内部 layout 用 flex column，让子树元素可以用 `flex: 1; min-height: 0` 占满剩余空间。
 */
withDefaults(
  defineProps<{
    /** 标题栏文字 */
    title: string;
    /** 标题栏左侧图标，默认 FileTextOutlined */
    icon?: string;
    /** 内容区 overflow 行为，默认 auto */
    overflow?: "hidden" | "auto";
  }>(),
  {
    icon: "FileTextOutlined",
    overflow: "auto",
  },
);
</script>

<template>
  <a-card
    size="small"
    :body-style="{
      padding: '8px',
      flex: '1 1 auto',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow,
    }"
    style="height: 100%; display: flex; flex-direction: column; min-height: 0"
  >
    <template #title>
      <a-flex align="center" :gap="4" style="flex: 1 1 auto; min-width: 0">
        <component :is="getIconByName(icon)" v-if="icon" />
        <span>{{ title }}</span>
      </a-flex>
    </template>
    <template #extra>
      <slot name="actions" />
    </template>

    <a-flex vertical :gap="8" style="flex: 1 1 auto; min-height: 0">
      <slot />
    </a-flex>
  </a-card>
</template>