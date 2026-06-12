<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from "vue";

/**
 * 搜索关键字双向绑定。
 *
 * 父组件通过 v-model 同步搜索文本，搜索栏只负责 UI 展示/隐藏与聚焦。
 */
const model = defineModel<string>({ default: "" });

withDefaults(
  defineProps<{
    /** 输入框占位文本，例如"搜索文本"或"搜索字段或值"。 */
    placeholder?: string;
  }>(),
  {
    placeholder: "搜索...",
  },
);

/** 搜索输入框是否可见。 */
const visible = ref(false);

/** 搜索输入框 DOM 引用，用于展开时自动聚焦。 */
const searchFieldRef = useTemplateRef<HTMLElement>("searchField");

/**
 * 切换搜索框可见性。
 *
 * 展开时自动聚焦输入框；收起时清空搜索关键字，
 * 让父组件回到未过滤的完整视图。
 */
async function toggle() {
  if (visible.value) {
    model.value = "";
    visible.value = false;
    return;
  }

  visible.value = true;
  await nextTick();
  searchFieldRef.value?.focus();
}

/** 供父组件通过 template ref 调用 toggle()。 */
defineExpose({ toggle, visible });
</script>

<template>
  <div v-if="visible" class="px-2 py-1">
    <v-row align="center" class="ga-1 ma-0" no-gutters>
      <v-col>
        <v-text-field
          ref="searchField"
          v-model="model"
          clearable
          density="compact"
          hide-details
          :placeholder="placeholder"
          single-line
          variant="outlined"
        />
      </v-col>

      <!--
        右侧操作区插槽：
        CodePanel 传入上一个/下一个导航按钮；
        JsonTreePanel 不传，保留空。
      -->
      <slot name="actions" />
    </v-row>
  </div>
</template>
