<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

import PanelCard from "../../components/PanelCard.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import {
  showInfo,
  showSuccess,
  showWarning,
} from "../../composables/useMessage";
import { generateSqlIn } from "../../tools/sql-in/sqlInGenerator";
import { debounce } from "../../utils/debounce";
import { load, save, SQL_QUOTE_KEY } from "../../utils/storage";
import type { SqlQuoteStyle } from "../../utils/storage";

const input = ref("");
const output = ref("");
const quote = ref<SqlQuoteStyle>(load(SQL_QUOTE_KEY, '"'));

const hasInput = computed(() => input.value.trim().length > 0);

/**
 * 把当前输入渲染为 SQL IN 片段并写入 output。
 * 无有效数据时仅清空 output，不弹提示（用于自动静默生成）。
 */
function generateNow() {
  if (!hasInput.value) {
    output.value = "";
    return;
  }

  const result = generateSqlIn(input.value, quote.value);
  output.value = result.sql;
}

/**
 * 防抖触发生成：连续输入时只取最后一次。
 */
const autoGenerate = debounce(() => {
  generateNow();
}, 250);

watch(input, () => {
  // 空输入立刻清空 output，避免清空后残留旧结果。
  if (!hasInput.value) {
    autoGenerate.cancel();
    output.value = "";
    return;
  }
  autoGenerate();
});

watch(quote, (value) => {
  save(SQL_QUOTE_KEY, value);

  if (hasInput.value) {
    autoGenerate.cancel();
    generateNow();
  }
});

/**
 * 统计输入的有效行数（非空行）。
 */
const lineCount = computed(() => {
  return input.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;
});

/**
 * 手动点击「生成」按钮：与自动生成逻辑相同，但无有效行时给出提示。
 */
function handleGenerate() {
  const result = generateSqlIn(input.value, quote.value);

  if (result.count === 0) {
    showWarning("未检测到有效数据行");
    return;
  }

  output.value = result.sql;
  showSuccess(`已生成 IN 语句，包含 ${result.count} 个值`);
}

/**
 * 复制输出结果。
 */
async function handleCopyOutput() {
  await navigator.clipboard.writeText(output.value);
  showSuccess("输出已复制");
}

/**
 * 清空输入和输出。
 */
function handleClear() {
  autoGenerate.cancel();
  input.value = "";
  output.value = "";
  showInfo("已清空");
}

onBeforeUnmount(() => {
  autoGenerate.cancel();
});
</script>

<template>
  <a-flex
    vertical
    gap="small"
    style="height: 100%; padding: 8px; box-sizing: border-box"
  >
    <a-card size="small" :body-style="{ padding: '4px 12px' }">
      <a-flex align="center" gap="small" wrap>
        <span class="ant-typography">SQL IN 生成器</span>

        <a-tag :color="lineCount > 0 ? 'green' : 'blue'" size="small">
          {{ lineCount > 0 ? `${lineCount} 行数据` : "等待输入" }}
        </a-tag>

        <a-radio-group
          v-model:value="quote"
          size="small"
          option-type="button"
          button-style="outline"
        >
          <a-radio-button value='"'>""</a-radio-button>
          <a-radio-button value="'">''</a-radio-button>
        </a-radio-group>

        <div style="flex: 1 1 auto" />

        <a-button
          size="small"
          type="primary"
          @click="handleGenerate"
        >
          生成
        </a-button>

        <a-button
          size="small"
          type="primary"
          @click="handleCopyOutput"
        >
          复制输出
        </a-button>

        <a-button
          size="small"
          @click="handleClear"
        >
          清空
        </a-button>
      </a-flex>
    </a-card>

    <SplitPanel style="flex: 1 1 auto">
      <template #top>
        <PanelCard icon="FileTextOutlined" title="输入数据（每行一个值）">
          <textarea
            v-model="input"
            class="app-textarea"
            placeholder="粘贴数据，每行一个值，例如：&#10;OGZJAL25110009&#10;OCDS25110025&#10;OWSD25080005"
          />
        </PanelCard>
      </template>

      <template #bottom>
        <PanelCard icon="RightOutlined" title="SQL IN 语句">
          <textarea
            :value="output"
            class="app-textarea"
            readonly
            placeholder="生成的 IN 语句将显示在这里"
          />
        </PanelCard>
      </template>
    </SplitPanel>
  </a-flex>
</template>
