<script setup lang="ts">
import ThemeMenu from "./ThemeMenu.vue";
import type { ToolDefinition } from "../types/tool";

defineProps<{
  currentTool: ToolDefinition;
}>();

const emit = defineEmits<{
  toggleNavigation: [];
}>();
</script>

<template>
  <v-app-bar border="b" density="compact" flat>
    <template #prepend>
      <v-app-bar-nav-icon
        density="compact"
        size="small"
        @click="emit('toggleNavigation')"
      />
    </template>

    <v-app-bar-title class="text-body-1 font-weight-medium">
      {{ currentTool.title }}
    </v-app-bar-title>

    <v-chip class="mr-1" color="primary" label size="x-small" variant="tonal">
      {{ currentTool.status === "available" ? "可用" : "规划中" }}
    </v-chip>

    <v-chip class="mr-1" color="secondary" label size="x-small" variant="tonal">
      本地处理
    </v-chip>

    <ThemeMenu />
  </v-app-bar>
</template>
