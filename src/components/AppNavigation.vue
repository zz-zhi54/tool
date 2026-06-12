<script setup lang="ts">
import { computed } from "vue";

import { toolCategories, tools } from "../tools/registry";
import type { ToolDefinition } from "../types/tool";

const props = defineProps<{
  currentToolId: string;
}>();

const emit = defineEmits<{
  selectTool: [toolId: string];
}>();

/**
 * 按分类组织后的工具列表。
 *
 * 导航只负责展示和选择工具，不直接关心工具页面如何实现，
 * 这样后续新增 YAML、Base64 等工具时只需要维护注册表。
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
  <v-list density="compact" nav slim>
    <v-list-item
      prepend-icon="$file"
      subtitle="本地开发者小工具"
      title="Tool Workbench"
    />
  </v-list>

  <v-divider />

  <v-list density="compact" nav slim>
    <template v-for="group in groupedTools" :key="group.id">
      <v-list-subheader class="text-caption" :title="group.title" />

      <v-list-item
        v-for="tool in group.tools"
        :key="tool.id"
        :active="props.currentToolId === tool.id"
        :disabled="tool.status === 'planned'"
        :prepend-icon="tool.icon"
        :subtitle="tool.status === 'planned' ? '规划中' : undefined"
        :title="tool.title"
        @click="selectTool(tool)"
      >
        <template v-if="tool.status === 'planned'" #append>
          <v-chip color="secondary" size="x-small" variant="tonal">
            soon
          </v-chip>
        </template>
      </v-list-item>
    </template>
  </v-list>
</template>
