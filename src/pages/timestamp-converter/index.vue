<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import {
  type CurrentTime,
  getCurrentTime,
  parseTimestamp,
} from "../../tools/timestamp/timestampConverter";

const input = ref("");
const currentTime = ref<CurrentTime>(getCurrentTime());
const result = ref<ReturnType<typeof parseTimestamp>>(null);
const snackbar = ref(false);
const snackbarText = ref("");
let timerId: ReturnType<typeof setInterval> | null = null;

const hasInput = computed(() => input.value.trim().length > 0);

/**
 * 每秒刷新当前时间显示。
 */
onMounted(() => {
  timerId = setInterval(() => {
    currentTime.value = getCurrentTime();
  }, 1000);
});

onBeforeUnmount(() => {
  if (timerId !== null) {
    clearInterval(timerId);
  }
});

/**
 * 执行转换。
 *
 * 自动检测输入是时间戳还是日期字符串，输出多种格式。
 */
function handleConvert() {
  if (!hasInput.value) {
    return;
  }

  const parsed = parseTimestamp(input.value);

  if (!parsed) {
    showMessage("无法解析输入，请检查格式");
    result.value = null;
    return;
  }

  result.value = parsed;
  showMessage("转换完成");
}

/**
 * 将当前时间戳填入输入框。
 */
function handleFillCurrent() {
  input.value = String(currentTime.value.timestampSeconds);
  handleConvert();
}

/**
 * 复制指定字段的值到剪贴板。
 */
async function handleCopyField(value: string) {
  await navigator.clipboard.writeText(value);
  showMessage("已复制");
}

/**
 * 清空输入和结果。
 */
function handleClear() {
  input.value = "";
  result.value = null;
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
        时间戳转换
      </v-toolbar-title>

      <!-- 当前实时时钟 -->
      <v-chip class="mr-1" color="info" label size="x-small" variant="tonal">
        {{ currentTime.localTime }}
      </v-chip>

      <v-chip
        class="mr-2"
        color="secondary"
        label
        size="x-small"
        variant="tonal"
      >
        {{ currentTime.timestampSeconds }}
      </v-chip>

      <div class="d-flex align-center ga-1">
        <v-btn
          color="primary"
          density="compact"
          prepend-icon="$calendar"
          size="small"
          text="获取当前时间"
          variant="tonal"
          @click="handleFillCurrent"
        />
      </div>
    </v-toolbar>

    <!-- 输入区域 -->
    <v-card border density="compact" flat rounded style="flex: 0 0 auto">
      <v-card-text class="d-flex align-center ga-2 py-2 px-3">
        <v-text-field
          v-model="input"
          density="compact"
          hide-details
          placeholder="输入时间戳（如 1718179200）或日期字符串（如 2024-06-12）"
          variant="outlined"
          @keydown.enter="handleConvert"
        />
        <v-btn
          color="primary"
          density="compact"
          :disabled="!hasInput"
          size="small"
          text="转换"
          variant="tonal"
          @click="handleConvert"
        />
        <v-btn
          color="warning"
          density="compact"
          :disabled="!hasInput && !result"
          size="small"
          text="清空"
          variant="text"
          @click="handleClear"
        />
      </v-card-text>
    </v-card>

    <!-- 结果区域 -->
    <div style="flex: 1 1 auto; min-height: 0; overflow: auto">
      <!-- 转换结果 -->
      <template v-if="result">
        <v-card
          v-for="field in [
            {
              label: 'Unix 时间戳（秒）',
              value: String(result.timestampSeconds),
            },
            {
              label: 'Unix 时间戳（毫秒）',
              value: String(result.timestampMillis),
            },
            { label: 'ISO 8601', value: result.iso8601 },
            { label: '本地时间', value: result.localTime },
            { label: 'UTC 时间', value: result.utcTime },
            { label: '相对时间', value: result.relativeTime },
          ]"
          :key="field.label"
          border="sm"
          class="mb-2"
          flat
          rounded
        >
          <v-card-text class="d-flex align-center py-2 px-3">
            <span
              class="text-caption text-medium-emphasis"
              style="min-width: 140px"
            >
              {{ field.label }}
            </span>
            <span
              class="text-body-2 font-weight-medium"
              style="flex: 1; word-break: break-all"
            >
              {{ field.value }}
            </span>
            <v-btn
              density="compact"
              icon="$file"
              size="x-small"
              variant="text"
              @click="handleCopyField(field.value)"
            />
          </v-card-text>
        </v-card>
      </template>

      <!-- 无结果时的提示 -->
      <v-alert v-else density="compact" type="info" variant="tonal">
        输入时间戳或日期字符串，点击"转换"查看多种格式结果。支持秒级（10
        位）和毫秒级（13 位）时间戳自动识别。
      </v-alert>
    </div>

    <v-snackbar v-model="snackbar" timeout="2000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>
