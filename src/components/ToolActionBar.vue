<script setup lang="ts">
defineProps<{
  disabled?: boolean;
  hasOutput?: boolean;
}>();

const emit = defineEmits<{
  format: [];
  minify: [];
  copy: [];
  clear: [];
}>();
</script>

<template>
  <div class="d-flex align-center ga-1">
    <v-btn
      color="primary"
      density="compact"
      prepend-icon="$success"
      :disabled="disabled"
      size="small"
      text="格式化"
      variant="tonal"
      @click="emit('format')"
    />

    <v-btn
      color="secondary"
      density="compact"
      prepend-icon="$collapse"
      :disabled="disabled"
      size="small"
      text="压缩"
      variant="tonal"
      @click="emit('minify')"
    />

    <v-btn
      color="success"
      density="compact"
      prepend-icon="$file"
      :disabled="!hasOutput"
      size="small"
      text="复制"
      variant="tonal"
      @click="emit('copy')"
    />

    <v-btn
      color="warning"
      density="compact"
      prepend-icon="$clear"
      :disabled="disabled"
      size="small"
      text="清空"
      variant="text"
      @click="emit('clear')"
    />
  </div>
</template>
