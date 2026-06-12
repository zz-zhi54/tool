<script setup lang="ts">
import type { JsonValidationResult, TextStats } from "../../tools/json/jsonTypes";

defineProps<{
  stats: TextStats;
  validation: JsonValidationResult;
  outputLength: number;
}>();
</script>

<template>
  <v-card border="sm" flat>
    <v-card-title
      class="d-flex align-center text-body-2 font-weight-medium px-2 py-1"
    >
      <v-icon class="mr-1" icon="$info" size="small" />
      检查
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-2">
      <v-alert
        v-if="validation.empty"
        density="compact"
        type="info"
        variant="tonal"
      >
        粘贴 JSON 后自动检查。
      </v-alert>

      <v-alert
        v-else-if="validation.valid"
        density="compact"
        type="success"
        variant="tonal"
      >
        JSON 合法。
      </v-alert>

      <v-alert v-else density="compact" type="error" variant="tonal">
        {{ validation.errorMessage }}
      </v-alert>

      <v-list class="mt-2" density="compact" lines="one" slim>
        <v-list-item title="字节">
          <template #append>
            <v-chip color="primary" size="x-small" variant="tonal">
              {{ stats.bytes }} B
            </v-chip>
          </template>
        </v-list-item>

        <v-list-item title="字符">
          <template #append>
            <v-chip color="secondary" size="x-small" variant="tonal">
              {{ stats.characters }}
            </v-chip>
          </template>
        </v-list-item>

        <v-list-item title="行数">
          <template #append>
            <v-chip color="secondary" size="x-small" variant="tonal">
              {{ stats.lines }}
            </v-chip>
          </template>
        </v-list-item>

        <v-list-item title="当前文本">
          <template #append>
            <v-chip color="success" size="x-small" variant="tonal">
              {{ outputLength }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>
