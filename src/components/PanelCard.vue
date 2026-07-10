<script setup lang="ts">
import { getIconByName } from "../utils/icons";

/**
 * 面板卡片壳组件。
 *
 * 统一工具页面中左右面板的卡片结构：
 * 标题栏（图标 + 文字 + 可选操作区）+ 分隔线 + 内容区。
 *
 * 基于 antdv `<a-card>` 实现：边框/背景/圆角/header/body 全部由框架处理。
 * - `compact: false`：占满父级高度（默认），内容区垂直 flex 布局
 * - `compact: true`：高度由内容驱动，适用于"输入框只需要几行"的场景
 *
 * 用于 sql-generator、regex-tester、time-hub 等使用固定分栏的工具页面。
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
    /**
     * 紧凑模式：根容器不再铺满父级高度，改由内容驱动，
     * 适用于"输入框只需要几行"的场景（如正则/转义/大小写）。
     * 默认 false（占满父级高度）。
     */
    compact?: boolean;
  }>(),
  {
    icon: "FileTextOutlined",
    overflow: "hidden",
    compact: false,
  },
);
</script>

<template>
  <!--
    compact 控制根节点高度：false 时撑满父级，true 时由内容驱动。
    这是 antdv 组件不直接支持的根容器高度语义，只能用 inline style 表达。
  -->
  <a-card
    size="small"
    :body-style="
      compact
        ? { padding: '8px', display: 'flex', flexDirection: 'column', overflow }
        : {
            padding: '8px',
            flex: '1 1 auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow,
          }
    "
    :style="
      compact
        ? undefined
        : {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }
    "
  >
    <!--
      header 模板：用 #title 插槽自定义标题栏内容，
      图标 + 标题 + 占位 + actions 由 antdv 框架统一渲染（自动处理底部 border）。
    -->
    <template #title>
      <a-flex align="center" :gap="4" style="flex: 1 1 auto; min-width: 0">
        <component :is="getIconByName(icon)" v-if="icon" />
        <span>{{ title }}</span>
      </a-flex>
    </template>
    <template #extra>
      <slot name="actions" />
    </template>

    <a-flex vertical :gap="8" style="height: 100%; min-height: 0">
      <slot />
    </a-flex>
  </a-card>
</template>
