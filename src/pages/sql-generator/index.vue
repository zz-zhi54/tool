<script setup lang="ts">
import { computed, ref, watch } from "vue";

import PanelCard from "../../components/PanelCard.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import { generateSqlIn } from "../../tools/sql-in/sqlInGenerator";
import { load, save, SQL_QUOTE_KEY, PANEL_KEYS } from "../../utils/storage";
import type { SqlQuoteStyle } from "../../utils/storage";

const input = ref("");
const output = ref("");
const snackbar = ref(false);
const snackbarText = ref("");
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
    showMessage("未检测到有效数据行");
    return;
  }

  output.value = result.sql;
  showMessage(`已生成 IN 语句，包含 ${result.count} 个值`);
}

/**
 * 复制输出结果。
 */
async function handleCopyOutput() {
  if (!hasOutput.value) {
    return;
  }

  await navigator.clipboard.writeText(output.value);
  showMessage("输出已复制");
}

/**
 * 清空输入和输出。
 */
function handleClear() {
  input.value = "";
  output.value = "";
  showMessage("已清空");
}

function showMessage(message: string) {
  snackbarText.value = message;
  snackbar.value = true;
}
</script>

<template>
  <div
    class="d-flex flex-column ga-2 h-100"
    style="min-height: 0; overflow: hidden"
  >
    <v-toolbar border density="compact" flat rounded style="flex: 0 0 auto">
      <v-toolbar-title class="text-body-2 font-weight-medium">
        SQL IN 生成器
      </v-toolbar-title>

      <v-chip
        :color="lineCount > 0 ? 'success' : 'info'"
        class="mr-1"
        label
        size="x-small"
        variant="tonal"
      >
        {{ lineCount > 0 ? `${lineCount} 行数据` : "等待输入" }}
      </v-chip>

      <!-- 引号风格切换 -->
      <v-btn-toggle
        v-model="quote"
        class="mr-1"
        density="compact"
        mandatory
        variant="outlined"
      >
        <v-btn size="small" text='""' value='"' />
        <v-btn size="small" text="''" value="'" />
      </v-btn-toggle>

      <!-- 操作按钮 -->
      <div class="d-flex align-center ga-1">
        <v-btn
          color="primary"
          density="compact"
          prepend-icon="$next"
          :disabled="!hasInput"
          size="small"
          text="生成"
          variant="tonal"
          @click="handleGenerate"
        />

        <v-btn
          color="success"
          density="compact"
          prepend-icon="$file"
          :disabled="!hasOutput"
          size="small"
          text="复制输出"
          variant="tonal"
          @click="handleCopyOutput"
        />

        <v-btn
          color="warning"
          density="compact"
          prepend-icon="$clear"
          :disabled="!hasInput && !hasOutput"
          size="small"
          text="清空"
          variant="text"
          @click="handleClear"
        />
      </div>
    </v-toolbar>

    <!-- 工作区：左右面板比例持久化到 localStorage -->
    <SplitPanel :panel-key="PANEL_KEYS.sqlGenerator">
      <template #left>
        <PanelCard icon="$file" title="输入数据（每行一个值）">
          <textarea
            v-model="input"
            placeholder="粘贴数据，每行一个值，例如：&#10;OGZJAL25110009&#10;OCDS25110025&#10;OWSD25080005"
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
        </PanelCard>
      </template>

      <template #right>
        <PanelCard icon="$next" title="SQL IN 语句">
          <textarea
            :value="output"
            readonly
            placeholder="生成的 IN 语句将显示在这里"
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
        </PanelCard>
      </template>
    </SplitPanel>

    <v-snackbar v-model="snackbar" timeout="2000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>
