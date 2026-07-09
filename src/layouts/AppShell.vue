<script setup lang="ts">
import { computed, ref } from "vue";

import AppSidebar from "../components/AppSidebar.vue";
import ToolStatusBar from "../components/ToolStatusBar.vue";
import Base64CodecView from "../pages/base64-codec/index.vue";
import CaseConverterView from "../pages/case-converter/index.vue";
import DateCalculatorView from "../pages/date-calculator/index.vue";
import EscapeToolView from "../pages/escape-tool/index.vue";
import HexCodecView from "../pages/hex-codec/index.vue";
import HtmlEntityCodecView from "../pages/html-entity-codec/index.vue";
import JsonFormatterView from "../pages/json-formatter/index.vue";
import RegexTesterView from "../pages/regex-tester/index.vue";
import SettingsView from "../pages/settings/index.vue";
import SqlGeneratorView from "../pages/sql-generator/index.vue";
import TextDiffView from "../pages/text-diff/index.vue";
import TimestampConverterView from "../pages/timestamp-converter/index.vue";
import TimezoneConverterView from "../pages/timezone-converter/index.vue";
import TomlFormatterView from "../pages/toml-formatter/index.vue";
import UnicodeEscapeView from "../pages/unicode-escape/index.vue";
import UrlCodecView from "../pages/url-codec/index.vue";
import UuidGeneratorView from "../pages/uuid-generator/index.vue";
import XmlFormatterView from "../pages/xml-formatter/index.vue";
import YamlFormatterView from "../pages/yaml-formatter/index.vue";
import LineOpsView from "../pages/line-ops/index.vue";
import { defaultToolId, findToolById } from "../tools/registry";
import { useAppTheme } from "../composables/useAppTheme";

const themeStore = useAppTheme();

const currentToolId = ref(defaultToolId);

const currentTool = computed(() => {
  if (currentToolId.value === "__settings") {
    return {
      id: "__settings",
      title: "设置",
      description: "应用偏好设置",
      category: "data-format" as const,
      icon: "SettingOutlined",
      status: "available" as const,
    };
  }

  return findToolById(currentToolId.value) ?? findToolById(defaultToolId)!;
});

function selectTool(toolId: string) {
  currentToolId.value = toolId;
}

/**
 * 根容器样式：跟随主题 tokens。
 */
const shellStyle = computed(() => ({
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column" as const,
  backgroundColor: themeStore.tokens.value.surface,
  color: themeStore.tokens.value.text,
}));
</script>

<template>
  <!--
    布局：
      1) ToolStatusBar  顶部（28px drag bar + 工具标题）
      2) 下方水平分两栏：
         - AppSidebar  左侧 200px，工具全部平铺
         - <main>       主内容区，承载当前工具
  -->
  <div :style="shellStyle">
    <ToolStatusBar :current-tool="currentTool" />

    <div class="app-shell-body">
      <AppSidebar :current-tool-id="currentToolId" @select-tool="selectTool" />

      <main class="app-shell-main">
        <div class="app-shell-content">
          <JsonFormatterView v-if="currentToolId === 'json-formatter'" />
          <YamlFormatterView v-if="currentToolId === 'yaml-formatter'" />
          <XmlFormatterView v-if="currentToolId === 'xml-formatter'" />
          <TomlFormatterView v-if="currentToolId === 'toml-formatter'" />
          <Base64CodecView v-if="currentToolId === 'base64-codec'" />
          <UrlCodecView v-if="currentToolId === 'url-codec'" />
          <HexCodecView v-if="currentToolId === 'hex-codec'" />
          <HtmlEntityCodecView v-if="currentToolId === 'html-entity-codec'" />
          <UnicodeEscapeView v-if="currentToolId === 'unicode-escape'" />
          <TimestampConverterView
            v-if="currentToolId === 'timestamp-converter'"
          />
          <TimezoneConverterView
            v-if="currentToolId === 'timezone-converter'"
          />
          <DateCalculatorView v-if="currentToolId === 'date-calculator'" />
          <RegexTesterView v-if="currentToolId === 'regex-tester'" />
          <SqlGeneratorView v-if="currentToolId === 'sql-generator'" />
          <EscapeToolView v-if="currentToolId === 'escape-tool'" />
          <UuidGeneratorView v-if="currentToolId === 'uuid-generator'" />
          <TextDiffView v-if="currentToolId === 'text-diff'" />
          <CaseConverterView v-if="currentToolId === 'case-converter'" />
          <LineOpsView v-if="currentToolId === 'line-ops'" />
          <SettingsView v-if="currentToolId === '__settings'" />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell-body {
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.app-shell-main {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.app-shell-content {
  height: 100%;
  padding: 8px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  gap: 8px;
}

.app-shell {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
}
</style>
