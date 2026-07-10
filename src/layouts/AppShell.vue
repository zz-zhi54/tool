<script setup lang="ts">
import { computed, onMounted, provide, ref } from "vue";
import type { InjectionKey } from "vue";

import AppSidebar from "../components/AppSidebar.vue";
import ToolStatusBar from "../components/ToolStatusBar.vue";
import UpdateModal from "../components/UpdateModal.vue";
import EncodingHubView from "../pages/encoding-hub/index.vue";
import HtmlEntityCodecView from "../pages/html-entity-codec/index.vue";
import JsonFormatterView from "../pages/json-formatter/index.vue";
import RegexTesterView from "../pages/regex-tester/index.vue";
import SettingsView from "../pages/settings/index.vue";
import SqlGeneratorView from "../pages/sql-generator/index.vue";
import TextHubView from "../pages/text-hub/index.vue";
import TimeHubView from "../pages/time-hub/index.vue";
import TomlFormatterView from "../pages/toml-formatter/index.vue";
import XmlFormatterView from "../pages/xml-formatter/index.vue";
import YamlFormatterView from "../pages/yaml-formatter/index.vue";
import QrcodeToolView from "../pages/qrcode-tool/index.vue";
import { defaultToolId, findToolById } from "../tools/registry";
import { useAppTheme } from "../composables/useAppTheme";
import { useAutoUpdater } from "../composables/useAutoUpdater";

/**
 * 暴露给挂在 chrome（侧边栏 / 顶部导航）上的 UpdateEntryButton 用的「打开 Modal」函数。
 *
 * 由 AppShell 持有 UpdateModal 的 ref，provide 给所有子组件消费，
 * 避免 props / emit 穿透到子树的多个层级。
 */
const OPEN_UPDATE_MODAL_KEY: InjectionKey<() => void> =
  Symbol("open-update-modal");

type UpdateModalInstance = InstanceType<typeof UpdateModal>;

const themeStore = useAppTheme();
const { checkOnly } = useAutoUpdater();

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

// ── 更新 Modal：单例挂载 + provide 打开入口 ───────────────────

const updateModalRef = ref<UpdateModalInstance | null>(null);
provide(OPEN_UPDATE_MODAL_KEY, () => updateModalRef.value?.open?.());

// 启动时静默跑一次轻量 check（不下、不弹窗）。
// 有新版本时 chrome 上的「更新」按钮自动变红；失败静默，不打扰用户。
onMounted(() => {
  void checkOnly();
});

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
         - AppSidebar  左侧平铺所有工具 + 底部主题/更新/设置入口
         - <main>       主内容区，承载当前工具
      3) 共享的 UpdateModal 挂在最外层，由 provide/inject 触发打开
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
          <EncodingHubView v-if="currentToolId === 'encoding-hub'" />
          <HtmlEntityCodecView v-if="currentToolId === 'html-entity-codec'" />
          <TimeHubView v-if="currentToolId === 'time-hub'" />
          <TextHubView v-if="currentToolId === 'text-hub'" />
          <RegexTesterView v-if="currentToolId === 'regex-tester'" />
          <SqlGeneratorView v-if="currentToolId === 'sql-generator'" />
          <QrcodeToolView v-if="currentToolId === 'qrcode-tool'" />
          <SettingsView v-if="currentToolId === '__settings'" />
        </div>
      </main>
    </div>

    <!-- 全局共享的更新 Modal，只挂一份 -->
    <UpdateModal ref="updateModalRef" />
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
