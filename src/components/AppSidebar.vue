<script setup lang="ts">
import { computed } from "vue";
import {
  BgColorsOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
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

/**
 * 把 popup 容器限定在 trigger 父元素内，避免父级 overflow:hidden / transform
 * 影响浮层定位（rc-dropdown 默认挂到 body，body 上的 popup 在某些布局里可能被裁掉）。
 */
function getPopupContainer(trigger: HTMLElement): HTMLElement {
  return trigger.parentElement ?? document.body;
}
</script>

<template>
  <!--
    侧边栏容器：高度撑满父级、纵向 flex 布局是 antdv <a-layout-sider>
    不直接表达的容器行为，需要 inline style。
  -->
  <a-flex vertical :gap="0" style="height: 100%; min-height: 0; width: 100%">
    <!-- 顶部品牌区 + 折叠按钮 -->
    <a-flex
      align="center"
      :gap="4"
      style="flex: 0 0 auto; padding: 6px 6px 6px 10px; min-height: 44px"
    >
      <a-flex
        v-if="!collapsed"
        vertical
        :gap="2"
        style="flex: 1 1 auto; min-width: 0; padding-left: 4px"
      >
        <strong>工具工作台</strong>
        <a-typography-text type="secondary" style="font-size: 11px">
          共 {{ tools.length }} 个工具
        </a-typography-text>
      </a-flex>
      <a-button
        size="small"
        type="text"
        :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
        data-tauri-no-drag
        @click="onToggleCollapsed"
      >
        <template #icon>
          <LeftOutlined v-if="!collapsed" />
          <RightOutlined v-else />
        </template>
      </a-button>
    </a-flex>

    <a-divider style="margin: 0" />

    <!-- 工具列表 -->
    <nav
      style="flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 4px 0"
    >
      <a-flex
        v-for="group in groupedTools"
        :key="group.id"
        vertical
        :gap="0"
        style="margin-bottom: 4px"
      >
        <!-- 分组标题（折叠时仅显示一行） -->
        <a-typography-text
          v-if="!collapsed"
          strong
          style="padding: 8px 12px 4px 10px; font-size: 11px"
        >
          {{ group.title }}
        </a-typography-text>

        <a-button
          v-for="tool in group.tools"
          :key="tool.id"
          :type="currentToolId === tool.id ? 'primary' : 'text'"
          block
          :title="collapsed ? tool.title : ''"
          :disabled="tool.status === 'planned'"
          style="
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: 8px;
            padding: 6px 10px;
            height: auto;
            min-height: 32px;
            font-size: 13px;
            font-weight: normal;
          "
          @click="selectTool(tool)"
        >
          <component :is="getIconByName(tool.icon)" />
          <span v-if="!collapsed">{{ tool.title }}</span>
        </a-button>
      </a-flex>
    </nav>

    <a-divider style="margin: 0" />

    <!-- 底部：主题 + 设置 -->
    <a-flex vertical :gap="4" style="flex: 0 0 auto; padding: 6px 8px">
      <a-dropdown
        placement="topRight"
        :trigger="['click']"
        :get-popup-container="getPopupContainer"
      >
        <a-button
          block
          size="small"
          type="text"
          :title="collapsed ? `主题 · ${currentThemeLabel}` : ''"
          data-tauri-no-drag
        >
          <template #icon>
            <BgColorsOutlined />
          </template>
          <span v-if="!collapsed">
            主题 · {{ currentThemeLabel }}
          </span>
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
        :title="collapsed ? '设置' : ''"
        data-tauri-no-drag
        @click="emit('selectTool', '__settings')"
      >
        <template #icon>
          <SettingOutlined />
        </template>
        <span v-if="!collapsed">设置</span>
      </a-button>
    </a-flex>
  </a-flex>
</template>
