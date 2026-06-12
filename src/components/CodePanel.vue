<script setup lang="ts">
import { ref, useTemplateRef } from "vue";

import SearchBar from "./SearchBar.vue";

defineProps<{
  title: string;
  icon: string;
  modelValue: string;
  placeholder: string;
  readonly?: boolean;
  error?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const searchQuery = ref("");
const searchBarRef = useTemplateRef<typeof SearchBar>("searchBarRef");
const textareaEl = useTemplateRef<HTMLTextAreaElement>("textareaEl");

/**
 * 同步文本框内容到父组件。
 */
function updateValue(value: string) {
  emit("update:modelValue", value);
}

/**
 * 在 textarea 中定位并选中下一个匹配项。
 */
function findNext() {
  const el = getTextarea();
  if (!el) return;

  const keyword = searchQuery.value.trim();
  if (!keyword) return;

  const text = el.value;
  const from = el.selectionEnd;

  let index = text.indexOf(keyword, from);
  if (index === -1) {
    index = text.indexOf(keyword, 0);
  }

  if (index !== -1) {
    el.focus();
    el.setSelectionRange(index, index + keyword.length);
  }
}

/**
 * 在 textarea 中定位并选中上一个匹配项。
 */
function findPrevious() {
  const el = getTextarea();
  if (!el) return;

  const keyword = searchQuery.value.trim();
  if (!keyword) return;

  const text = el.value;
  const from = el.selectionStart;

  const searchText = text.slice(0, Math.max(from - 1, 0));
  let index = searchText.lastIndexOf(keyword);
  if (index === -1) {
    index = text.lastIndexOf(keyword);
  }

  if (index !== -1) {
    el.focus();
    el.setSelectionRange(index, index + keyword.length);
  }
}

/**
 * 获取 textarea 原生元素。
 */
function getTextarea(): HTMLTextAreaElement | null {
  if (textareaEl.value) {
    return textareaEl.value;
  }
  return null;
}
</script>

<template>
  <v-card
    border="sm"
    class="d-flex flex-column"
    flat
    height="100%"
    style="min-height: 0; overflow: hidden"
  >
    <v-card-title
      class="d-flex align-center text-body-2 font-weight-medium px-2 py-1"
    >
      <v-icon :icon="icon" class="mr-1" size="small" />
      {{ title }}
      <v-spacer />
      <v-btn
        density="compact"
        icon="$search"
        size="x-small"
        variant="text"
        @click.stop="searchBarRef?.toggle()"
      />
    </v-card-title>

    <v-divider />

    <SearchBar ref="searchBarRef" v-model="searchQuery" placeholder="搜索文本">
      <template #actions>
        <v-btn
          density="compact"
          icon="$prev"
          size="x-small"
          variant="text"
          @click.stop="findPrevious"
        />
        <v-btn
          density="compact"
          icon="$next"
          size="x-small"
          variant="text"
          @click.stop="findNext"
        />
      </template>
    </SearchBar>

    <v-divider v-if="searchBarRef?.visible" />

    <v-card-text class="pa-2" style="flex: 1; min-height: 0; overflow: hidden">
      <textarea
        ref="textareaEl"
        :placeholder="placeholder"
        :readonly="readonly"
        :value="modelValue"
        style="
          width: 100%;
          height: 100%;
          resize: none;
          border: none;
          outline: none;
          background: transparent;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
          color: inherit;
        "
        @input="updateValue(($event.target as HTMLTextAreaElement).value)"
      />
    </v-card-text>
  </v-card>
</template>
