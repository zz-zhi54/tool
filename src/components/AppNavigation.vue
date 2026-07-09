<script setup lang="ts">
import { computed } from "vue";
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  DownOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SearchOutlined,
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

defineProps<{
  currentToolId: string;
}>();

const emit = defineEmits<{
  selectTool: [toolId: string];
}>();

const themeStore = useAppTheme();

const categoryIcons: Record<ToolCategoryId, typeof CodeOutlined> = {
  "data-format": CodeOutlined,
  encoding: FileTextOutlined,
  time: ClockCircleOutlined,
  text: SearchOutlined,
};

/** 主品牌色，accent 缺失时兜底。 */
const FALLBACK_ACCENT = "#1677ff";

const categoryAccents: Record<ToolCategoryId, string> = Object.fromEntries(
  toolCategories.map((c) => [c.id, c.accent ?? FALLBACK_ACCENT]),
) as Record<ToolCategoryId, string>;

function getToolAccent(tool: ToolDefinition): string {
  return tool.accent ?? categoryAccents[tool.category] ?? FALLBACK_ACCENT;
}

interface GroupView extends ToolCategory {
  tools: ToolDefinition[];
  accent: string;
}

const groupedTools = computed<GroupView[]>(() =>
  toolCategories.map((category) => ({
    ...category,
    accent: categoryAccents[category.id],
    tools: tools.filter((tool) => tool.category === category.id),
  })),
);

function selectTool(tool: ToolDefinition) {
  if (tool.status === "planned") {
    return;
  }

  emit("selectTool", tool.id);
}

// ── 主题切换（从 ToolStatusBar 搬过来，与「设置」同一行） ──

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

function handleThemeClick(info: { key: string | number }) {
  themeStore.change(String(info.key) as ThemeName);
}

// ── 样式 ─────────────────────────────────────────────────

const headerStyle = computed(() => ({
  backgroundColor: themeStore.tokens.value.surface,
  color: themeStore.tokens.value.text,
  borderBottom: `1px solid ${themeStore.tokens.value.border}`,
}));

const dividerStyle = {
  width: "1px",
  height: "18px",
  alignSelf: "center",
  backgroundColor: "var(--app-border)",
  margin: "0 6px",
};

const noDragStyle = {
  WebkitAppRegion: "no-drag",
};
</script>

<template>
  <header :style="headerStyle" class="titlebar-nav">
    <AppstoreOutlined style="font-size: 16px; color: var(--app-text-muted)" />
    <span class="text-body-2 font-weight-medium">Tool Workbench</span>

    <div :style="dividerStyle" />

    <a-dropdown
      v-for="group in groupedTools"
      :key="group.id"
      placement="bottomLeft"
    >
      <a-button
        size="small"
        type="text"
        :style="noDragStyle"
        data-tauri-no-drag
      >
        <template #icon>
          <component
            :is="categoryIcons[group.id]"
            :style="{ color: group.accent }"
          />
        </template>
        {{ group.title }}
      </a-button>
      <template #overlay>
        <a-menu>
          <a-menu-item
            v-for="tool in group.tools"
            :key="tool.id"
            :disabled="tool.status === 'planned'"
            @click="selectTool(tool)"
          >
            <template #icon>
              <span
                class="tool-accent-bar"
                :style="{ backgroundColor: getToolAccent(tool) }"
              />
            </template>
            <component
              :is="getIconByName(tool.icon)"
              :style="{ color: getToolAccent(tool), marginRight: '6px' }"
            />
            {{ tool.title }}
            <span
              v-if="tool.status === 'planned'"
              style="color: var(--app-text-muted); margin-left: 6px"
            >
              规划中
            </span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>

    <span style="flex: 1 1 auto" />

    <!--
      主题切换：跟随系统 / 浅色 / 深色
      与「设置」用 1px divider 视觉分隔。
    -->
    <a-dropdown placement="bottomRight">
      <a-button
        size="small"
        type="text"
        :style="noDragStyle"
        data-tauri-no-drag
      >
        <template #icon>
          <SettingOutlined style="color: var(--app-text-muted)" />
        </template>
        主题
        <DownOutlined style="font-size: 10px; margin-left: 2px" />
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

    <div :style="dividerStyle" />

    <a-button
      size="small"
      type="text"
      :style="noDragStyle"
      data-tauri-no-drag
      @click="emit('selectTool', '__settings')"
    >
      <template #icon>
        <SettingOutlined style="color: var(--app-text-muted)" />
      </template>
      设置
    </a-button>
  </header>
</template>

<style scoped>
.titlebar-nav {
  flex: 0 0 auto;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: default;
}

/* 菜单项前置色条：用图标槽位渲染一条彩色短线，
   进一步强化"每个工具有自己的颜色"的视觉信号。 */
:deep(.tool-accent-bar) {
  display: inline-block;
  width: 4px;
  height: 14px;
  border-radius: 2px;
}
</style>
