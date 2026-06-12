<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from "vue";

/**
 * YAML 输入面板：标题栏 + 搜索 + 文本框。
 *
 * 通过 v-model 双向绑定文本内容，搜索通过 setSelectionRange 定位匹配项。
 */
const model = defineModel<string>({ default: "" });

const searchQuery = ref("");
const searchVisible = ref(false);
const searchFieldRef = useTemplateRef<HTMLInputElement>("searchField");
const textareaRef = useTemplateRef<HTMLTextAreaElement>("textarea");

/**
 * 切换搜索框可见性。
 *
 * 展开时自动聚焦输入框；收起时清空搜索关键字。
 */
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

/**
 * 在 textarea 中定位并选中下一个匹配项，并滚动到可见区域。
 */
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

/**
 * 在 textarea 中定位并选中上一个匹配项，并滚动到可见区域。
 */
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

/**
 * 选中指定范围并滚动到可视区域。
 */
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
      <v-icon class="mr-1" icon="$file" size="small" />
      输入 YAML
      <v-spacer />
      <v-btn
        density="compact"
        icon="$search"
        size="x-small"
        variant="text"
        @click.stop="toggleSearch"
      />
    </v-card-title>

    <!-- 搜索栏 -->
    <div v-if="searchVisible" class="px-2 py-1">
      <v-row align="center" class="ga-1 ma-0" no-gutters>
        <v-col>
          <v-text-field
            ref="searchField"
            v-model="searchQuery"
            clearable
            density="compact"
            hide-details
            placeholder="搜索文本"
            single-line
            variant="outlined"
            @keydown.enter.prevent="findNext"
          />
        </v-col>
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
      </v-row>
    </div>

    <v-divider />

    <v-card-text class="pa-2" style="flex: 1; min-height: 0; overflow: hidden">
      <textarea
        ref="textarea"
        v-model="model"
        placeholder="粘贴需要处理的 YAML，例如：&#10;name: tool&#10;version: 1.0"
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
      />
    </v-card-text>
  </v-card>
</template>
