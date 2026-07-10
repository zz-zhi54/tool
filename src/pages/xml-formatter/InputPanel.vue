<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from "vue";

import {
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons-vue";

import PanelCard from "../../components/PanelCard.vue";

/**
 * XML 输入面板：标题栏 + 搜索 + 文本框。
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
  <PanelCard icon="FileTextOutlined" title="输入 XML">
    <template #actions>
      <a-button size="small" type="text" @click.stop="toggleSearch">
        <template #icon>
          <SearchOutlined />
        </template>
      </a-button>
    </template>

    <a-flex
      v-if="searchVisible"
      align="center"
      :gap="4"
      style="margin-bottom: 8px"
    >
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

    <textarea
      ref="textarea"
      v-model="model"
      class="app-textarea"
      placeholder="粘贴需要处理的 XML，例如：&#10;<root><item>1</item></root>"
      style="height: 100%"
    />
  </PanelCard>
</template>
