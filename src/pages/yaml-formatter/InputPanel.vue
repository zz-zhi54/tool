<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from "vue";

import {
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons-vue";

import PanelCard from "../../components/PanelCard.vue";

/**
 * YAML 输入面板：标题栏 + 搜索 + 文本框。
 */
const model = defineModel<string>({ default: "" });

const searchQuery = ref("");
const searchVisible = ref(false);
const searchFieldRef = useTemplateRef<HTMLInputElement>("searchField");
const textareaRef = useTemplateRef("textarea");

/**
 * 从 antdv `<a-textarea>` 实例拿到底层 DOM 元素。
 *
 * antdv 的 ATextarea 外层有 affix wrapper / ResizableTextArea / BaseInput 三层，
 * 内部 ref 类型不便直接引用，最稳的做法是从 expose 的 resizableTextArea.textArea 一路 unwrap。
 */
function getNativeTextarea(): HTMLTextAreaElement | null {
  const wrapper = (
    textareaRef.value as unknown as {
      resizableTextArea?: { textArea?: { value?: HTMLTextAreaElement } };
    } | null
  )?.resizableTextArea;
  return wrapper?.textArea?.value ?? null;
}

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
  const el = getNativeTextarea();
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
  const el = getNativeTextarea();
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
  <PanelCard icon="FileTextOutlined" title="输入 YAML">
    <template #actions>
      <a-button size="small" type="text" @click.stop="toggleSearch">
        <template #icon>
          <SearchOutlined />
        </template>
      </a-button>
    </template>

    <a-flex v-if="searchVisible" align="center" :gap="4">
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
    </a-flex>

    <a-textarea
      ref="textarea"
      v-model:value="model"
      :allow-clear="false"
      placeholder="粘贴需要处理的 YAML，例如：&#10;name: tool&#10;version: 1.0"
      style="flex: 1 1 auto; min-height: 0"
    />
  </PanelCard>
</template>
