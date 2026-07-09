<script setup lang="ts">
import { computed, ref } from "vue";

import {
  CheckCircleOutlined,
  CompressOutlined,
  CopyOutlined,
  DeleteOutlined,
} from "@ant-design/icons-vue";

import InputPanel from "./InputPanel.vue";
import JsonTreePanel from "./JsonTreePanel.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import { showInfo, showWarning } from "../../composables/useMessage";
import type { JsonValue } from "../../tools/json/jsonTypes";
import {
  formatJson,
  getTextStats,
  minifyJson,
  validateJson,
} from "../../tools/json/jsonFormatter";
import { PANEL_KEYS } from "../../utils/storage";

const input = ref("");

/**
 * 当前输入的实时校验结果。
 */
const validation = computed(() => validateJson(input.value));

/**
 * 当前输入的文本统计。
 */
const stats = computed(() => getTextStats(input.value));

/**
 * 当前输入对应的 JSON 结构。
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
 */
function handleFormat() {
  const result = formatJson(input.value);

  if (result.success) {
    input.value = result.output;
    showInfo("已在输入框内格式化 JSON");
    return;
  }

  showWarning("JSON 格式错误，请先修正输入");
}

/**
 * 在输入框内压缩当前 JSON。
 */
function handleMinify() {
  const result = minifyJson(input.value);

  if (result.success) {
    input.value = result.output;
    showInfo("已在输入框内压缩 JSON");
    return;
  }

  showWarning("JSON 格式错误，请先修正输入");
}

/**
 * 复制当前输入框中的 JSON。
 */
async function handleCopy() {
  if (!hasInput.value) {
    return;
  }

  await navigator.clipboard.writeText(input.value);
  showInfo("JSON 已复制");
}

/**
 * 清空输入。
 */
function handleClear() {
  input.value = "";
  showInfo("已清空输入");
}
</script>

<template>
  <div
    class="d-flex flex-column ga-2 h-100"
    style="min-height: 0; overflow: hidden"
  >
    <header
      class="d-flex align-center ga-1 px-2 py-1"
      style="
        flex: 0 0 auto;
        gap: 4px;
        border: 1px solid var(--app-border);
        border-radius: 4px;
        background-color: var(--app-surface);
      "
    >
      <span class="text-body-2 font-weight-medium">JSON 格式化</span>

      <a-tag
        :color="
          validation.valid ? 'green' : validation.empty ? 'default' : 'red'
        "
        size="small"
      >
        {{ validation.valid ? "合法" : validation.empty ? "等待输入" : "错误" }}
      </a-tag>

      <a-tag color="cyan" size="small">{{ stats.bytes }} B</a-tag>

      <a-tag color="cyan" size="small">{{ stats.lines }} 行</a-tag>

      <span style="flex: 1 1 auto" />

      <!-- 操作按钮：格式化、压缩、复制、清空 -->
      <a-button
        :disabled="!hasInput"
        size="small"
        type="primary"
        ghost
        @click="handleFormat"
      >
        <template #icon>
          <CheckCircleOutlined />
        </template>
        格式化
      </a-button>

      <a-button
        :disabled="!hasInput"
        size="small"
        type="default"
        ghost
        @click="handleMinify"
      >
        <template #icon>
          <CompressOutlined />
        </template>
        压缩
      </a-button>

      <a-button
        :disabled="!hasInput"
        size="small"
        type="primary"
        ghost
        @click="handleCopy"
      >
        <template #icon>
          <CopyOutlined />
        </template>
        复制
      </a-button>

      <a-button
        :disabled="!hasInput"
        size="small"
        type="default"
        ghost
        @click="handleClear"
      >
        <template #icon>
          <DeleteOutlined />
        </template>
        清空
      </a-button>
    </header>

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
  </div>
</template>
