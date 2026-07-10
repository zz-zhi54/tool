<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref } from "vue";
import type { Component, InjectionKey } from "vue";

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
import { load, save } from "../utils/storage";

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

// ── 路由表：toolId → 视图组件 ────────────────────────

const VIEWS: Record<string, Component> = {
  "json-formatter": JsonFormatterView,
  "yaml-formatter": YamlFormatterView,
  "xml-formatter": XmlFormatterView,
  "toml-formatter": TomlFormatterView,
  "encoding-hub": EncodingHubView,
  "html-entity-codec": HtmlEntityCodecView,
  "time-hub": TimeHubView,
  "text-hub": TextHubView,
  "regex-tester": RegexTesterView,
  "sql-generator": SqlGeneratorView,
  "qrcode-tool": QrcodeToolView,
  __settings: SettingsView,
};

const currentView = computed<Component>(() => {
  return VIEWS[currentToolId.value] ?? VIEWS[defaultToolId];
});

// ── 侧边栏折叠 ─────────────────────
//
// 桌面窗口宽度 < BREAKPOINT_PX 时自动折叠；
// 用户也可以通过 AppSidebar 顶部的折叠按钮手动覆盖。
// 用户手动状态会持久化，但仅在「当前窗口宽度允许展开」时生效。
// 这样做保证：拉大窗口时自动恢复成 168px 宽（而非依赖 antdv 内部 resize-observer）。

const SIDEBAR_COLLAPSED_KEY = "sidebar:collapsed";
const BREAKPOINT_PX = 900;

/** 用户偏好（持久化）。如果窗口宽度低于断点，无条件折叠。 */
const userCollapsed = ref<boolean>(load(SIDEBAR_COLLAPSED_KEY, false));

/** 窗口宽度状态：是否「窄」(< BREAKPOINT_PX) */
const isNarrow = ref(false);
let mql: MediaQueryList | null = null;
let mqlHandler: ((e: MediaQueryListEvent) => void) | null = null;

function syncNarrow() {
  isNarrow.value = window.innerWidth < BREAKPOINT_PX;
}

/** 最终展示状态：窄屏始终折叠，否则用用户偏好。 */
const sidebarCollapsed = computed(() => isNarrow.value || userCollapsed.value);

function onUserToggle(value: boolean) {
  userCollapsed.value = value;
  save(SIDEBAR_COLLAPSED_KEY, value);
}

// ── 更新 Modal：单例挂载 + provide 打开入口 ───────────────────

const updateModalRef = ref<UpdateModalInstance | null>(null);
provide(OPEN_UPDATE_MODAL_KEY, () => updateModalRef.value?.open?.());

onMounted(() => {
  void checkOnly();

  // 初次同步
  syncNarrow();

  // 用 matchMedia 监听窗口宽度变化（窗口 resize 时触发）
  mql = window.matchMedia(`(max-width: ${BREAKPOINT_PX - 1}px)`);
  mqlHandler = (e) => {
    isNarrow.value = e.matches;
  };
  mql.addEventListener("change", mqlHandler);
  // 兜底：部分环境（特别是 Tauri webview）matchMedia change 不触发，再加个 resize
  window.addEventListener("resize", syncNarrow);
});

onBeforeUnmount(() => {
  if (mql && mqlHandler) mql.removeEventListener("change", mqlHandler);
  window.removeEventListener("resize", syncNarrow);
});

/**
 * 根容器样式：跟随主题 tokens。
 */
const shellStyle = computed(() => ({
  height: "100vh",
  width: "100vw",
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
         - <a-layout-content>  主内容区，承载当前工具
      3) 共享的 UpdateModal 挂在最外层，由 provide/inject 触发打开
  -->
  <a-layout :style="shellStyle">
    <ToolStatusBar :current-tool="currentTool" />

    <a-layout style="min-height: 0">
      <a-layout-sider
        :width="168"
        :collapsed-width="48"
        :trigger="null"
        collapsible
        :collapsed="sidebarCollapsed"
        :style="{
          backgroundColor: themeStore.tokens.value.surface,
          borderRight: `1px solid ${themeStore.tokens.value.border}`,
        }"
        @update:collapsed="onUserToggle"
      >
        <AppSidebar
          :current-tool-id="currentToolId"
          :collapsed="sidebarCollapsed"
          @select-tool="selectTool"
          @toggle-collapsed="onUserToggle(!sidebarCollapsed)"
        />
      </a-layout-sider>

      <a-layout-content style="padding: 8px; min-width: 0">
        <component :is="currentView" />
      </a-layout-content>
    </a-layout>

    <!-- 全局共享的更新 Modal，只挂一份 -->
    <UpdateModal ref="updateModalRef" />
  </a-layout>
</template>
