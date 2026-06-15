<script setup lang="ts">
import { computed, ref } from "vue";

import InputPanel from "./InputPanel.vue";
import JsonTreePanel from "./JsonTreePanel.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import type { JsonValue } from "../../tools/json/jsonTypes";
import {
  formatJson,
  getTextStats,
  minifyJson,
  validateJson,
} from "../../tools/json/jsonFormatter";
import { PANEL_KEYS } from "../../utils/storage";

const input = ref("");
const snackbar = ref(false);
const snackbarText = ref("");

/**
 * 当前输入的实时校验结果。
 *
 * 只要用户粘贴或编辑 JSON，就会立即更新校验状态和结构视图，
 * 不再要求先点击"格式化"才能看到 JSON 层级。
 */
const validation = computed(() => validateJson(input.value));

/**
 * 当前输入的文本统计。
 *
 * 紧凑桌面布局中，统计信息展示在顶部状态条，避免右侧再出现重复检查面板。
 */
const stats = computed(() => getTextStats(input.value));

/**
 * 当前输入对应的 JSON 结构。
 *
 * 结构视图直接消费这个值：输入合法时展示树，输入为空或非法时展示提示。
 */
const parsedValue = computed<JsonValue | undefined>(() => {
  if (!validation.value.valid) {
    return undefined;
  }

  return JSON.parse(input.value.trim()) as JsonValue;
});

const hasInput = computed(() => input.value.trim().length > 0);

/**
 * 在输入框内格式化当前 JSON。
 *
 * 点击"格式化"后不再写入单独的输出文本区域，而是直接把输入框内容
 * 替换为缩进后的 JSON，右侧结构视图会跟随输入内容自动刷新。
 */
function handleFormat() {
  const result = formatJson(input.value);

  if (result.success) {
    input.value = result.output;
    showMessage("已在输入框内格式化 JSON");
    return;
  }

  showMessage("JSON 格式错误，请先修正输入");
}

/**
 * 在输入框内压缩当前 JSON。
 *
 * 压缩和格式化一样直接更新输入框，保证页面只有一个 JSON 文本来源。
 */
function handleMinify() {
  const result = minifyJson(input.value);

  if (result.success) {
    input.value = result.output;
    showMessage("已在输入框内压缩 JSON");
    return;
  }

  showMessage("JSON 格式错误，请先修正输入");
}

/**
 * 复制当前输入框中的 JSON。
 *
 * 因为格式化/压缩都会直接回写输入框，所以复制操作只需要复制当前输入。
 */
async function handleCopy() {
  if (!hasInput.value) {
    return;
  }

  await navigator.clipboard.writeText(input.value);
  showMessage("JSON 已复制");
}

/**
 * 清空输入。
 *
 * 清空后校验结果会回到 empty 状态，结构视图也会自动回到提示状态。
 */
function handleClear() {
  input.value = "";
  showMessage("已清空输入");
}

/**
 * 展示短提示。
 *
 * 操作结果统一通过 snackbar 反馈，避免在页面中堆叠临时状态文本。
 */
function showMessage(message: string) {
  snackbarText.value = message;
  snackbar.value = true;
}
</script>

<template>
  <!--
    使用 Vuetify class + inline style 控制布局。
    d-flex flex-column 纵向排列；
    ga-2 子元素间距；h-100 满高；
    min-height:0 overflow:hidden 防止 flex 子元素撑破导致外部滚动。
  -->
  <div
    class="d-flex flex-column ga-2 h-100"
    style="min-height: 0; overflow: hidden"
  >
    <v-toolbar border density="compact" flat rounded style="flex: 0 0 auto">
      <v-toolbar-title class="text-body-2 font-weight-medium">
        JSON 格式化
      </v-toolbar-title>

      <v-chip
        :color="
          validation.valid ? 'success' : validation.empty ? 'info' : 'error'
        "
        class="mr-1"
        label
        size="x-small"
        variant="tonal"
      >
        {{ validation.valid ? "合法" : validation.empty ? "等待输入" : "错误" }}
      </v-chip>

      <v-chip
        class="mr-1"
        color="secondary"
        label
        size="x-small"
        variant="tonal"
      >
        {{ stats.bytes }} B
      </v-chip>

      <v-chip
        class="mr-2"
        color="secondary"
        label
        size="x-small"
        variant="tonal"
      >
        {{ stats.lines }} 行
      </v-chip>

      <!-- 操作按钮：格式化、压缩、复制、清空 -->
      <div class="d-flex align-center ga-1">
        <v-btn
          color="primary"
          density="compact"
          prepend-icon="$success"
          :disabled="!hasInput"
          size="small"
          text="格式化"
          variant="tonal"
          @click="handleFormat"
        />

        <v-btn
          color="secondary"
          density="compact"
          prepend-icon="$collapse"
          :disabled="!hasInput"
          size="small"
          text="压缩"
          variant="tonal"
          @click="handleMinify"
        />

        <v-btn
          color="success"
          density="compact"
          prepend-icon="$file"
          :disabled="!hasInput"
          size="small"
          text="复制"
          variant="tonal"
          @click="handleCopy"
        />

        <v-btn
          color="warning"
          density="compact"
          prepend-icon="$clear"
          :disabled="!hasInput"
          size="small"
          text="清空"
          variant="text"
          @click="handleClear"
        />
      </div>
    </v-toolbar>

    <!--
      工作区：左右面板可拖拽调节大小。
      storageItem 传入后 SplitPanel 自动持久化比例到 localStorage。
    -->
    <SplitPanel :panel-key="PANEL_KEYS.jsonFormatter">
      <template #left>
        <InputPanel v-model="input" />
      </template>

      <template #right>
        <JsonTreePanel :value="parsedValue" />
      </template>
    </SplitPanel>

    <v-snackbar v-model="snackbar" timeout="2000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>
