<script setup lang="ts">
import { getIconByName } from "../utils/icons";

/**
 * 面板卡片壳组件。
 *
 * 统一工具页面中左右面板的卡片结构：
 * 标题栏（图标 + 文字 + 可选操作区）+ 分隔线 + 内容区。
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
     * 默认 false（沿用 height: 100%）。
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
  <section
    :style="
      compact
        ? 'overflow: hidden; border: 1px solid var(--app-border); border-radius: 4px; background-color: var(--app-surface); display: flex; flex-direction: column;'
        : 'height: 100%; min-height: 0; overflow: hidden; border: 1px solid var(--app-border); border-radius: 4px; background-color: var(--app-surface); display: flex; flex-direction: column;'
    "
  >
    <header
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flex: '0 0 auto',
        padding: '4px 8px',
        fontSize: '14px',
        fontWeight: 500,
        borderBottom: '1px solid var(--app-border)',
      }"
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

    <div
      :style="{
        padding: '8px',
        ...(compact
          ? { display: 'flex', flexDirection: 'column', overflow }
          : {
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
            }),
      }"
    >
      <slot />
    </div>
  </section>
</template>
