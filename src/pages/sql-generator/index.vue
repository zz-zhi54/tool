<script setup lang="ts">
import { computed, ref, watch } from "vue";

import PanelCard from "../../components/PanelCard.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import {
  showInfo,
  showSuccess,
  showWarning,
} from "../../composables/useMessage";
import { generateSqlIn } from "../../tools/sql-in/sqlInGenerator";
import { load, save, SQL_QUOTE_KEY, PANEL_KEYS } from "../../utils/storage";
import type { SqlQuoteStyle } from "../../utils/storage";

const input = ref("");
const output = ref("");
const quote = ref<SqlQuoteStyle>(load(SQL_QUOTE_KEY, '"'));

const hasInput = computed(() => input.value.trim().length > 0);
const hasOutput = computed(() => output.value.length > 0);

watch(quote, (value) => {
  save(SQL_QUOTE_KEY, value);

  if (hasInput.value && hasOutput.value) {
    output.value = generateSqlIn(input.value, value).sql;
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
 * 将多行数据生成 SQL IN 语句。
 */
function handleGenerate() {
  if (!hasInput.value) {
    return;
  }

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
  if (!hasOutput.value) {
    return;
  }

  await navigator.clipboard.writeText(output.value);
  showSuccess("输出已复制");
}

/**
 * 清空输入和输出。
 */
function handleClear() {
  input.value = "";
  output.value = "";
  showInfo("已清空");
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
      <span class="text-body-2 font-weight-medium">SQL IN 生成器</span>

      <a-tag :color="lineCount > 0 ? 'green' : 'default'" size="small">
        {{ lineCount > 0 ? `${lineCount} 行数据` : "等待输入" }}
      </a-tag>

      <!-- 引号风格切换 -->
      <a-radio-group
        v-model:value="quote"
        size="small"
        option-type="button"
        button-style="outline"
      >
        <a-radio-button value='"'>""</a-radio-button>
        <a-radio-button value="'">''</a-radio-button>
      </a-radio-group>

      <span style="flex: 1 1 auto" />

      <a-button
        :disabled="!hasInput"
        size="small"
        type="primary"
        ghost
        @click="handleGenerate"
      >
        生成
      </a-button>

      <a-button
        :disabled="!hasOutput"
        size="small"
        type="primary"
        ghost
        @click="handleCopyOutput"
      >
        复制输出
      </a-button>

      <a-button
        :disabled="!hasInput && !hasOutput"
        size="small"
        type="default"
        ghost
        @click="handleClear"
      >
        清空
      </a-button>
    </header>

    <!-- 工作区：左右面板比例持久化到 localStorage -->
    <SplitPanel :panel-key="PANEL_KEYS.sqlGenerator">
      <template #left>
        <PanelCard icon="FileTextOutlined" title="输入数据（每行一个值）">
          <textarea
            v-model="input"
            class="app-textarea"
            placeholder="粘贴数据，每行一个值，例如：&#10;OGZJAL25110009&#10;OCDS25110025&#10;OWSD25080005"
          />
        </PanelCard>
      </template>

      <template #right>
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
  </div>
</template>
