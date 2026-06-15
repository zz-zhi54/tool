<script setup lang="ts">
import { computed } from "vue";
import { useDisplay } from "vuetify";

import { toolCategories, tools } from "../tools/registry";
import type { ToolCategoryId, ToolDefinition } from "../types/tool";

const props = defineProps<{
  currentToolId: string;
}>();

const emit = defineEmits<{
  selectTool: [toolId: string];
}>();

const { mdAndUp } = useDisplay();

const categoryIcons: Record<ToolCategoryId, string> = {
  "data-format": "$json",
  encoding: "$codeBraces",
  time: "$codeTags",
  text: "$regex",
};

/**
 * 按分类组织后的工具列表。
 *
 * 导航只负责展示和选择工具，不直接关心工具页面如何实现，
 * 这样后续新增工具时只需要维护注册表。
 */
const groupedTools = computed(() =>
  toolCategories.map((category) => ({
    ...category,
    tools: tools.filter((tool) => tool.category === category.id),
  })),
);

/**
 * 选择可用工具。
 *
 * 规划中的工具会在界面中展示，但不会触发切换，避免用户进入未实现页面。
 */
function selectTool(tool: ToolDefinition) {
  if (tool.status === "planned") {
    return;
  }

  emit("selectTool", tool.id);
}
</script>

<template>
  <v-app-bar border="b" density="compact" flat location="top">
    <v-icon class="ml-3 mr-2" icon="$dashboard" size="small" />
    <span v-if="mdAndUp" class="text-body-2 font-weight-medium">
      Tool Workbench
    </span>

    <v-divider class="mx-2" vertical />

    <v-menu
      v-for="group in groupedTools"
      :key="group.id"
      location="bottom start"
    >
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          :append-icon="mdAndUp ? '$expand' : undefined"
          density="compact"
          :icon="mdAndUp ? undefined : categoryIcons[group.id]"
          :prepend-icon="mdAndUp ? categoryIcons[group.id] : undefined"
          size="small"
          :text="mdAndUp ? group.title : undefined"
          variant="text"
        />
      </template>

      <v-list density="compact" min-width="180" nav>
        <v-list-item
          v-for="tool in group.tools"
          :key="tool.id"
          :active="props.currentToolId === tool.id"
          :disabled="tool.status === 'planned'"
          :prepend-icon="tool.icon"
          :subtitle="tool.status === 'planned' ? '规划中' : undefined"
          :title="tool.title"
          @click="selectTool(tool)"
        />
      </v-list>
    </v-menu>

    <v-spacer />

    <v-divider class="mx-2" vertical />

    <v-btn
      density="compact"
      :icon="mdAndUp ? undefined : '$settings'"
      :prepend-icon="mdAndUp ? '$settings' : undefined"
      size="small"
      :text="mdAndUp ? '设置' : undefined"
      variant="text"
      @click="emit('selectTool', '__settings')"
    />
  </v-app-bar>
</template>
