<script setup lang="ts">
import { computed, ref } from "vue";

import AppNavigation from "../components/AppNavigation.vue";
import ToolStatusBar from "../components/ToolStatusBar.vue";
import Base64CodecView from "../pages/base64-codec/index.vue";
import JsonFormatterView from "../pages/json-formatter/index.vue";
import RegexTesterView from "../pages/regex-tester/index.vue";
import SettingsView from "../pages/settings/index.vue";
import SqlGeneratorView from "../pages/sql-generator/index.vue";
import TimestampConverterView from "../pages/timestamp-converter/index.vue";
import YamlFormatterView from "../pages/yaml-formatter/index.vue";
import { defaultToolId, findToolById } from "../tools/registry";

/**
 * 左侧导航抽屉开关状态。
 *
 * 桌面端默认展开；导航宽度保持紧凑，避免挤压开发工具的主工作区。
 */
const drawer = ref(true);

/**
 * 当前选中的工具 ID。
 *
 * 第一阶段默认进入 JSON 格式化器；后续可改为首页或最近一次使用的工具。
 */
const currentToolId = ref(defaultToolId);

/**
 * 当前工具定义。
 *
 * 设置页面使用 __settings 哨兵 ID，需单独构造虚拟定义用于状态栏展示。
 * 其他 ID 从注册表查找，保留兜底逻辑避免空对象导致渲染失败。
 */
const currentTool = computed(() => {
  if (currentToolId.value === "__settings") {
    return {
      id: "__settings",
      title: "设置",
      description: "应用偏好设置",
      category: "data-format" as const,
      icon: "$settings",
      status: "available" as const,
    };
  }

  return findToolById(currentToolId.value) ?? findToolById(defaultToolId)!;
});

/**
 * 切换当前工具。
 *
 * 导航组件已经过滤了规划中的工具，这里只负责更新当前工具状态。
 */
function selectTool(toolId: string) {
  currentToolId.value = toolId;
}
</script>

<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" border="r" rounded="lg" width="248">
      <AppNavigation
        :current-tool-id="currentToolId"
        @select-tool="selectTool"
      />
    </v-navigation-drawer>

    <ToolStatusBar
      :current-tool="currentTool"
      @toggle-navigation="drawer = !drawer"
    />

    <v-main style="overflow: hidden">
      <v-container class="pa-2" fluid style="height: 100%; overflow: hidden">
        <JsonFormatterView v-if="currentToolId === 'json-formatter'" />
        <YamlFormatterView v-if="currentToolId === 'yaml-formatter'" />
        <Base64CodecView v-if="currentToolId === 'base64-codec'" />
        <TimestampConverterView
          v-if="currentToolId === 'timestamp-converter'"
        />
        <RegexTesterView v-if="currentToolId === 'regex-tester'" />
        <SqlGeneratorView v-if="currentToolId === 'sql-generator'" />
        <SettingsView v-if="currentToolId === '__settings'" />
      </v-container>
    </v-main>
  </v-app>
</template>
