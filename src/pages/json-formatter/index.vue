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
  <a-flex
    vertical
    gap="small"
    style="height: 100%; padding: 8px; box-sizing: border-box"
  >
    <a-card size="small" :body-style="{ padding: '4px 12px' }">
      <a-flex align="center" gap="small" wrap>
        <span class="ant-typography">JSON 格式化</span>

        <a-tag
          :color="
            validation.valid ? 'green' : validation.empty ? 'default' : 'red'
          "
          size="small"
        >
          {{
            validation.valid ? "合法" : validation.empty ? "等待输入" : "错误"
          }}
        </a-tag>

        <a-tag color="cyan" size="small">{{ stats.bytes }} B</a-tag>

        <a-tag color="cyan" size="small">{{ stats.lines }} 行</a-tag>

        <div style="flex: 1 1 auto" />

        <a-flex align="center" gap="small" wrap style="flex-shrink: 0">
          <a-button
            size="small"
            type="primary"
            @click="handleFormat"
          >
            <template #icon>
              <CheckCircleOutlined />
            </template>
            格式化
          </a-button>

          <a-button
            size="small"
            type="default"
            @click="handleMinify"
          >
            <template #icon>
              <CompressOutlined />
            </template>
            压缩
          </a-button>

          <a-button
            size="small"
            type="primary"
            @click="handleCopy"
          >
            <template #icon>
              <CopyOutlined />
            </template>
            复制
          </a-button>

          <a-button
            size="small"
            type="default"
            @click="handleClear"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            清空
          </a-button>
        </a-flex>
      </a-flex>
    </a-card>

    <SplitPanel style="flex: 1 1 auto">
      <template #top>
        <InputPanel v-model="input" />
      </template>

      <template #bottom>
        <JsonTreePanel :value="parsedValue" />
      </template>
    </SplitPanel>
  </a-flex>
</template>
