<script setup lang="ts">
import { computed } from "vue";
import {
  BgColorsOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined,
  SettingOutlined,
} from "@ant-design/icons-vue";

import { toolCategories, tools } from "../tools/registry";
import type {
  ToolCategory,
  ToolCategoryId,
  ToolDefinition,
} from "../types/tool";
import { type ThemeName, useAppTheme } from "../composables/useAppTheme";
import { getIconByName } from "../utils/icons";
import UpdateEntryButton from "./UpdateEntryButton.vue";

defineProps<{
  currentToolId: string;
  /** 是否折叠（由 AppShell 统一下发，与 a-layout-sider 同步） */
  collapsed: boolean;
}>();

const emit = defineEmits<{
  selectTool: [toolId: string];
  toggleCollapsed: [];
}>();

const themeStore = useAppTheme();

// ── 主题切换 ─────────────────────────────────────────────

/** 主品牌色，accent 缺失时兜底。 */
const FALLBACK_ACCENT = "#1677ff";

const categoryAccents: Record<ToolCategoryId, string> = Object.fromEntries(
  toolCategories.map((c) => [c.id, c.accent ?? FALLBACK_ACCENT]),
) as Record<ToolCategoryId, string>;

function getToolAccent(tool: ToolDefinition): string {
  return tool.accent ?? categoryAccents[tool.category] ?? FALLBACK_ACCENT;
}

interface CategoryView extends ToolCategory {
  tools: ToolDefinition[];
  accent: string;
}

const groupedTools = computed<CategoryView[]>(() =>
  toolCategories.map((category) => ({
    ...category,
    accent: categoryAccents[category.id],
    tools: tools.filter((tool) => tool.category === category.id),
  })),
);

function selectTool(tool: ToolDefinition) {
  if (tool.status === "planned") return;
  emit("selectTool", tool.id);
}

function onToggleCollapsed() {
  emit("toggleCollapsed");
}

const themeOptions: Array<{
  title: string;
  value: ThemeName;
  icon: typeof CheckCircleOutlined;
}> = [
  { title: "跟随系统", value: "system", icon: InfoCircleOutlined },
  { title: "浅色", value: "light", icon: CheckCircleOutlined },
  { title: "深色", value: "dark", icon: ClockCircleOutlined },
];

const currentThemeName = computed<ThemeName>(() => themeStore.name.value);
const selectedThemeKeys = computed<string[]>(() => [currentThemeName.value]);
const currentThemeLabel = computed<string>(
  () =>
    themeOptions.find((o) => o.value === currentThemeName.value)?.title ?? "",
);

function handleThemeClick(info: { key: string | number }) {
  themeStore.change(String(info.key) as ThemeName);
}

// ── 样式（仅背景/边框/文字颜色；宽度由外层 a-layout-sider 决定） ──

const sidebarStyle = computed(() => ({
  backgroundColor: themeStore.tokens.value.surface,
  color: themeStore.tokens.value.text,
  borderRight: `1px solid ${themeStore.tokens.value.border}`,
  width: "100%",
  height: "100%",
}));

const noDragStyle = {
  WebkitAppRegion: "no-drag",
};
</script>

<template>
  <aside
    :style="sidebarStyle"
    class="app-sidebar"
    :class="{ 'is-collapsed': collapsed }"
  >
    <!-- 顶部品牌区 + 折叠按钮 -->
    <div class="app-sidebar-header">
      <div v-if="!collapsed" class="app-sidebar-titles">
        <div class="app-sidebar-title">工具工作台</div>
        <div class="app-sidebar-subtitle">共 {{ tools.length }} 个工具</div>
      </div>
      <a-button
        class="app-sidebar-toggle"
        size="small"
        type="text"
        :style="noDragStyle"
        data-tauri-no-drag
        :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
        @click="onToggleCollapsed"
      >
        <template #icon>
          <LeftOutlined v-if="!collapsed" />
          <RightOutlined v-else />
        </template>
      </a-button>
    </div>

    <!-- 工具列表：按分类分组展示 -->
    <nav class="app-sidebar-nav">
      <div v-for="group in groupedTools" :key="group.id" class="sidebar-group">
        <!-- 分组标题（折叠时显示为细分隔线） -->
        <div
          v-if="!collapsed"
          class="sidebar-group-title"
          :style="{ color: group.accent }"
        >
          {{ group.title }}
        </div>
        <div
          v-else
          class="sidebar-group-divider"
          :style="{ backgroundColor: group.accent }"
          :title="group.title"
        />

        <button
          v-for="tool in group.tools"
          :key="tool.id"
          class="sidebar-item"
          :class="{ 'sidebar-item-active': currentToolId === tool.id }"
          :style="{ '--accent': getToolAccent(tool) }"
          :disabled="tool.status === 'planned'"
          :title="collapsed ? tool.title : ''"
          @click="selectTool(tool)"
        >
          <component
            :is="getIconByName(tool.icon)"
            class="sidebar-item-icon"
            :style="{ color: getToolAccent(tool) }"
          />
          <span v-if="!collapsed" class="sidebar-item-label">{{
            tool.title
          }}</span>
        </button>
      </div>
    </nav>

    <!-- 底部：主题 + 设置 -->
    <div class="app-sidebar-footer">
      <a-dropdown placement="topRight" :trigger="['click']">
        <a-button
          block
          size="small"
          type="text"
          :style="noDragStyle"
          data-tauri-no-drag
          :title="collapsed ? `主题 · ${currentThemeLabel}` : ''"
        >
          <template #icon>
            <BgColorsOutlined />
          </template>
          <span v-if="!collapsed" class="sidebar-footer-label">
            主题 ·
            <span class="sidebar-footer-value">{{ currentThemeLabel }}</span>
          </span>
          <DownOutlined v-if="!collapsed" class="sidebar-chevron" />
        </a-button>
        <template #overlay>
          <a-menu :selected-keys="selectedThemeKeys" @click="handleThemeClick">
            <a-menu-item v-for="option in themeOptions" :key="option.value">
              <template #icon>
                <component :is="option.icon" />
              </template>
              {{ option.title }}
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>

      <UpdateEntryButton variant="sidebar" :collapsed="collapsed" />

      <a-button
        block
        size="small"
        type="text"
        :style="noDragStyle"
        data-tauri-no-drag
        :title="collapsed ? '设置' : ''"
        @click="emit('selectTool', '__settings')"
      >
        <template #icon>
          <SettingOutlined />
        </template>
        <span v-if="!collapsed">设置</span>
      </a-button>
    </div>
  </aside>
</template>

<style scoped>
/*
 * 侧边栏整体：宽度由外层 a-layout-sider 决定（168 / 48）。
 * 这里只负责内部布局。
 */
.app-sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  user-select: none;
  transition: width 200ms ease;
}

/* 顶部品牌区：标题在左，折叠按钮在右 */
.app-sidebar-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 6px 6px 10px;
  border-bottom: 1px solid var(--app-border);
  min-height: 44px;
}

.app-sidebar-titles {
  flex: 1 1 auto;
  min-width: 0;
  padding-left: 4px;
}

.app-sidebar-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-sidebar-subtitle {
  margin-top: 2px;
  font-size: 11px;
  color: var(--app-text-muted);
}

.app-sidebar-toggle {
  flex: 0 0 auto;
  /* 折叠态下让按钮占满整个 header 的中间区域，便于点击 */
}

.is-collapsed .app-sidebar-toggle {
  width: 100%;
  padding: 0;
  display: flex;
  justify-content: center;
}

/* 工具列表 */
.app-sidebar-nav {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 0;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.app-sidebar-nav:hover {
  scrollbar-color: var(--app-border) transparent;
}

.app-sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.app-sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.app-sidebar-nav::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
  transition: background-color 150ms ease;
}

.app-sidebar-nav:hover::-webkit-scrollbar-thumb,
.app-sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: var(--app-border);
}

.sidebar-group {
  margin-bottom: 4px;
}

.sidebar-group:last-child {
  margin-bottom: 0;
}

.sidebar-group-title {
  padding: 8px 12px 4px 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 折叠态：分组标题替换为细分隔线（带 tooltip 显示组名） */
.sidebar-group-divider {
  height: 1px;
  margin: 8px 8px 4px;
  opacity: 0.4;
  border-radius: 1px;
}

/* 工具项：扁平按钮，左侧 2px 强调色条表示激活态 */
.sidebar-item {
  --accent: #1677ff;

  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px 6px 10px;
  border: none;
  background: transparent;
  color: var(--app-text);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  border-left: 2px solid transparent;
  min-width: 0;
  transition: background-color 100ms ease;
}

.sidebar-item:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.04);
}

.sidebar-item:disabled {
  color: var(--app-text-muted);
  cursor: not-allowed;
}

.sidebar-item-active {
  background-color: rgba(22, 119, 255, 0.08);
  border-left-color: var(--accent);
  color: var(--accent);
  font-weight: 500;
}

/* 折叠态：图标居中，无左边距（避免 2px 色条偏移） */
.is-collapsed .sidebar-item {
  justify-content: center;
  padding: 6px 0;
  border-left: none;
  border-radius: 4px;
  margin: 0 4px;
}

.is-collapsed .sidebar-item-active {
  background-color: var(--accent);
  color: white;
  border-left: none;
}

.is-collapsed .sidebar-item-active .sidebar-item-icon {
  color: white !important;
}

.sidebar-item-icon {
  font-size: 14px;
  flex: 0 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.sidebar-item-label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 底部 */
.app-sidebar-footer {
  flex: 0 0 auto;
  padding: 6px 8px;
  border-top: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-sidebar-footer :deep(.ant-btn) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 6px 10px;
  height: 30px;
}

.app-sidebar-footer :deep(.ant-btn .ant-btn-icon) {
  width: 14px;
  height: 14px;
  margin-inline-end: 8px;
  flex: 0 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.app-sidebar-footer :deep(.sidebar-chevron) {
  margin-left: auto;
  font-size: 10px;
  opacity: 0.6;
}

.sidebar-footer-label {
  font-size: 13px;
  color: var(--app-text);
}

.sidebar-footer-value {
  font-weight: 600;
  color: var(--app-text);
}

/* 折叠态：底部按钮内容居中 */
.is-collapsed .app-sidebar-footer :deep(.ant-btn) {
  justify-content: center;
  padding: 6px 0;
}

/* 深色主题 */
:global([data-theme="dark"]) .sidebar-item:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.06);
}
</style>
