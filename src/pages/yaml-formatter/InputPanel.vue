<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from "vue";

import {
  FileTextOutlined,
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons-vue";

/**
 * YAML 输入面板：标题栏 + 搜索 + 文本框。
 */
const model = defineModel<string>({ default: "" });

const searchQuery = ref("");
const searchVisible = ref(false);
const searchFieldRef = useTemplateRef<HTMLInputElement>("searchField");
const textareaRef = useTemplateRef<HTMLTextAreaElement>("textarea");

async function toggleSearch() {
  if (searchVisible.value) {
    searchQuery.value = "";
    searchVisible.value = false;
    return;
  }

  searchVisible.value = true;
  await nextTick();
  searchFieldRef.value?.focus();
}

function findNext() {
  const el = textareaRef.value;
  const keyword = searchQuery.value.trim();
  if (!el || !keyword) return;

  const text = el.value;
  const from = el.selectionEnd;
  let index = text.indexOf(keyword, from);
  if (index === -1) {
    index = text.indexOf(keyword, 0);
  }

  selectAndScroll(el, index, keyword.length);
}

function findPrevious() {
  const el = textareaRef.value;
  const keyword = searchQuery.value.trim();
  if (!el || !keyword) return;

  const text = el.value;
  const from = el.selectionStart;
  const searchText = text.slice(0, Math.max(from - 1, 0));
  let index = searchText.lastIndexOf(keyword);
  if (index === -1) {
    index = text.lastIndexOf(keyword);
  }

  selectAndScroll(el, index, keyword.length);
}

function selectAndScroll(
  el: HTMLTextAreaElement,
  start: number,
  length: number,
) {
  if (start === -1) return;

  el.focus();
  el.setSelectionRange(start, start + length);

  const textBefore = el.value.substring(0, start);
  const lineNumber = (textBefore.match(/\n/g) || []).length;

  const cs = getComputedStyle(el);
  const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;

  const targetTop = lineNumber * lineHeight;
  el.scrollTop = Math.max(0, targetTop - el.clientHeight / 2);
}
</script>

<template>
  <section
    class="d-flex flex-column"
    style="
      height: 100%;
      min-height: 0;
      overflow: hidden;
      border: 1px solid var(--app-border);
      border-radius: 4px;
      background-color: var(--app-surface);
    "
  >
    <header
      class="d-flex align-center text-body-2 font-weight-medium px-2 py-1"
      style="
        flex: 0 0 auto;
        gap: 4px;
        border-bottom: 1px solid var(--app-border);
      "
    >
      <FileTextOutlined style="font-size: 14px; color: var(--app-text-muted)" />
      输入 YAML
      <span style="flex: 1 1 auto" />
      <a-button size="small" type="text" @click.stop="toggleSearch">
        <template #icon>
          <SearchOutlined />
        </template>
      </a-button>
    </header>

    <div
      v-if="searchVisible"
      class="px-2 py-1"
      style="flex: 0 0 auto; border-bottom: 1px solid var(--app-border)"
    >
      <div class="d-flex align-center ga-1" style="margin: 0">
        <a-input
          ref="searchField"
          v-model:value="searchQuery"
          allow-clear
          placeholder="搜索文本"
          size="small"
          @keydown.enter.prevent="findNext"
        />
        <a-button size="small" type="text" @click.stop="findPrevious">
          <template #icon>
            <LeftOutlined />
          </template>
        </a-button>
        <a-button size="small" type="text" @click.stop="findNext">
          <template #icon>
            <RightOutlined />
          </template>
        </a-button>
      </div>
    </div>

    <div class="pa-2" style="flex: 1; min-height: 0; overflow: hidden">
      <textarea
        ref="textarea"
        v-model="model"
        class="app-textarea"
        placeholder="粘贴需要处理的 YAML，例如：&#10;name: tool&#10;version: 1.0"
      />
    </div>
  </section>
</template>
