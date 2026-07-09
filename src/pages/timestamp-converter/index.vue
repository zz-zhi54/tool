<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import {
  ClockCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
} from "@ant-design/icons-vue";

import {
  type CurrentTime,
  getCurrentTime,
  parseTimestamp,
} from "../../tools/timestamp/timestampConverter";
import { showError, showInfo, showSuccess } from "../../composables/useMessage";

const input = ref("");
const currentTime = ref<CurrentTime>(getCurrentTime());
const result = ref<ReturnType<typeof parseTimestamp>>(null);
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
    showError("无法解析输入，请检查格式");
    result.value = null;
    return;
  }

  result.value = parsed;
  showSuccess("转换完成");
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
  showInfo("已复制");
}

/**
 * 清空输入和结果。
 */
function handleClear() {
  input.value = "";
  result.value = null;
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
      <span class="text-body-2 font-weight-medium">时间戳转换</span>

      <!-- 当前实时时钟 -->
      <a-tag color="blue" size="small">{{ currentTime.localTime }}</a-tag>

      <a-tag color="cyan" size="small">{{
        currentTime.timestampSeconds
      }}</a-tag>

      <span style="flex: 1 1 auto" />

      <a-button size="small" type="primary" ghost @click="handleFillCurrent">
        <template #icon>
          <ClockCircleOutlined />
        </template>
        获取当前时间
      </a-button>
    </header>

    <!-- 输入区域 -->
    <section
      class="d-flex align-center ga-2 px-3 py-2"
      style="
        flex: 0 0 auto;
        border: 1px solid var(--app-border);
        border-radius: 4px;
        background-color: var(--app-surface);
      "
    >
      <a-input
        v-model:value="input"
        placeholder="输入时间戳（如 1718179200）或日期字符串（如 2024-06-12）"
        size="small"
        style="flex: 1 1 auto"
        @keydown.enter="handleConvert"
      />
      <a-button
        :disabled="!hasInput"
        size="small"
        type="primary"
        ghost
        @click="handleConvert"
      >
        转换
      </a-button>
      <a-button
        :disabled="!hasInput && !result"
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
    </section>

    <!-- 结果区域 -->
    <div style="flex: 1 1 auto; min-height: 0; overflow: auto">
      <!-- 转换结果 -->
      <template v-if="result">
        <section
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
          class="d-flex align-center py-2 px-3 mb-2"
          style="
            border: 1px solid var(--app-border);
            border-radius: 4px;
            background-color: var(--app-surface);
          "
        >
          <span
            class="text-caption"
            style="min-width: 140px; color: var(--app-text-muted)"
          >
            {{ field.label }}
          </span>
          <span
            class="text-body-2 font-weight-medium"
            style="flex: 1; word-break: break-all"
          >
            {{ field.value }}
          </span>
          <a-button
            size="small"
            type="text"
            @click="handleCopyField(field.value)"
          >
            <template #icon>
              <CopyOutlined />
            </template>
          </a-button>
        </section>
      </template>

      <!-- 无结果时的提示 -->
      <a-alert
        v-else
        type="info"
        message="输入时间戳或日期字符串，点击「转换」查看多种格式结果。支持秒级（10 位）和毫秒级（13 位）时间戳自动识别。"
        show-icon
      />
    </div>
  </div>
</template>
