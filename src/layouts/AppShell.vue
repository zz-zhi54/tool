<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref } from "vue";
import type { Component } from "vue";

import AppSidebar from "../components/AppSidebar.vue";
import ToolStatusBar from "../components/ToolStatusBar.vue";
import UpdateModal from "../components/UpdateModal.vue";
import EncodingHubView from "../pages/encoding-hub/index.vue";
import HtmlEntityCodecView from "../pages/html-entity-codec/index.vue";
import JsonFormatterView from "../pages/json-formatter/index.vue";
import RegexTesterView from "../pages/regex-tester/index.vue";
import SettingsView from "../pages/settings/index.vue";
import SqlGeneratorView from "../pages/sql-generator/index.vue";
import TextDiffView from "../pages/text-diff/index.vue";
import TextHubView from "../pages/text-hub/index.vue";
import TimeHubView from "../pages/time-hub/index.vue";
import TomlFormatterView from "../pages/toml-formatter/index.vue";
import XmlFormatterView from "../pages/xml-formatter/index.vue";
import YamlFormatterView from "../pages/yaml-formatter/index.vue";
import QrcodeToolView from "../pages/qrcode-tool/index.vue";
import { defaultToolId } from "../tools/registry";
import { useAutoUpdater } from "../composables/useAutoUpdater";
import { useAppTheme } from "../composables/useAppTheme";
import { OPEN_UPDATE_MODAL_KEY } from "../composables/useUpdateModal";
import { load, save } from "../utils/storage";

type UpdateModalInstance = InstanceType<typeof UpdateModal>;

const { checkSilently } = useAutoUpdater();
const themeStore = useAppTheme();

const currentToolId = ref(defaultToolId);

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
  "text-diff": TextDiffView,
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
  void checkSilently();

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
</script>

<template>
  <!--
    布局：
      1) ToolStatusBar  顶部（28px drag bar + 工具标题）
      2) 下方水平分两栏：
         - AppSidebar  左侧平铺所有工具 + 底部主题/更新/设置入口
         - <a-layout-content>  主内容区，承载当前工具
      3) 共享的 UpdateModal 挂在最外层，由 provide/inject 触发打开

    根容器与 body/content 的尺寸约束通过 inline style 设置，
    是 antdv 框架本身要求的"根布局占满视口"必要配置，
    不属于业务 UI 样式。
  -->
  <a-layout style="height: 100vh; width: 100vw">
    <ToolStatusBar />

    <a-layout style="min-height: 0">
      <a-layout-sider
        :width="168"
        :collapsed-width="48"
        :trigger="null"
        :theme="themeStore.resolved.value"
        collapsible
        :collapsed="sidebarCollapsed"
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
        <KeepAlive>
          <component :is="currentView" />
        </KeepAlive>
      </a-layout-content>
    </a-layout>

    <!-- 全局共享的更新 Modal，只挂一份 -->
    <UpdateModal ref="updateModalRef" />
  </a-layout>
</template>
