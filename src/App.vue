<script setup lang="ts">
import { computed } from "vue";
import { ConfigProvider, theme as antdTheme } from "ant-design-vue";
import zhCN from "ant-design-vue/es/locale/zh_CN";

import AppShell from "./layouts/AppShell.vue";
import { bindSystemTheme, themeStore } from "./composables/useAppTheme";

bindSystemTheme();

/**
 * antd 主题配置。
 *
 * 根据 resolved 主题切换 defaultAlgorithm（浅色）和 darkAlgorithm（深色）。
 * 同时通过 locale 设置组件级中文文案。
 */
const themeConfig = computed(() => ({
  algorithm:
    themeStore.resolved.value === "dark"
      ? antdTheme.darkAlgorithm
      : antdTheme.defaultAlgorithm,
}));
</script>

<template>
  <ConfigProvider :theme="themeConfig" :locale="zhCN">
    <AppShell />
  </ConfigProvider>
</template>
