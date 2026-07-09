<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import {
  ClockCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
} from "@ant-design/icons-vue";

import { showError, showInfo, showSuccess } from "../../composables/useMessage";
import {
  COMMON_TIMEZONES,
  convertTimezone,
  getCurrentMillis,
  type TimezoneConvertResult,
} from "../../tools/timezone/timezoneConverter";

const input = ref("");
const sourceTimezone = ref("Asia/Shanghai");
const result = ref<TimezoneConvertResult | null>(null);

/** 当前时间（秒）顶部展示 */
const nowSeconds = ref(Math.floor(getCurrentMillis() / 1000));

let timerId: ReturnType<typeof setInterval> | null = null;

const hasInput = computed(() => input.value.trim().length > 0);

const sourceOptions = computed(() => COMMON_TIMEZONES);

onMounted(() => {
  timerId = setInterval(() => {
    nowSeconds.value = Math.floor(getCurrentMillis() / 1000);
  }, 1000);
});

onBeforeUnmount(() => {
  if (timerId !== null) clearInterval(timerId);
});

function handleConvert() {
  if (!hasInput.value) return;

  const r = convertTimezone(input.value, sourceTimezone.value);
  if (!r) {
    showError("无法解析输入，请检查格式");
    result.value = null;
    return;
  }
  result.value = r;
  showSuccess("转换完成");
}

function handleFillCurrent() {
  input.value = String(nowSeconds.value);
  handleConvert();
}

async function handleCopy(value: string) {
  await navigator.clipboard.writeText(value);
  showInfo("已复制");
}

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
      <span class="text-body-2 font-weight-medium">时区转换</span>

      <a-tag color="blue" size="small">当前 {{ nowSeconds }}</a-tag>

      <span style="flex: 1 1 auto" />

      <a-button size="small" type="primary" ghost @click="handleFillCurrent">
        <template #icon>
          <ClockCircleOutlined />
        </template>
        获取当前时间
      </a-button>
    </header>

    <!-- 输入区 -->
    <section
      class="d-flex align-center ga-2 px-3 py-2 flex-wrap"
      style="
        flex: 0 0 auto;
        border: 1px solid var(--app-border);
        border-radius: 4px;
        background-color: var(--app-surface);
      "
    >
      <a-input
        v-model:value="input"
        placeholder="输入时间戳或日期字符串"
        size="small"
        style="flex: 1 1 240px"
        @keydown.enter="handleConvert"
      />

      <span class="text-caption" style="color: var(--app-text-muted)">
        源时区
      </span>

      <a-select
        v-model:value="sourceTimezone"
        size="small"
        style="width: 180px"
        :options="sourceOptions.map((o) => ({ value: o.id, label: o.label }))"
        show-search
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

    <!-- 结果列表 -->
    <div style="flex: 1 1 auto; min-height: 0; overflow: auto">
      <a-empty
        v-if="!result"
        description="输入时间戳后点击「转换」查看各时区结果。"
        :image="undefined"
      >
        <template #image>
          <span />
        </template>
      </a-empty>

      <template v-else>
        <section
          class="d-flex align-center py-2 px-3 mb-2"
          style="
            border: 1px solid var(--app-border);
            border-radius: 4px;
            background-color: var(--app-surface);
          "
        >
          <span
            class="text-caption"
            style="min-width: 100px; color: var(--app-text-muted)"
          >
            秒
          </span>
          <span
            class="text-body-2 font-weight-medium"
            style="flex: 1; word-break: break-all"
          >
            {{ result.timestampSeconds }}
          </span>
          <a-button
            size="small"
            type="text"
            @click="handleCopy(String(result.timestampSeconds))"
          >
            <template #icon>
              <CopyOutlined />
            </template>
          </a-button>
        </section>

        <section
          v-for="row in result.rows"
          :key="row.id"
          class="d-flex align-center py-2 px-3 mb-2 flex-wrap"
          style="
            border: 1px solid var(--app-border);
            border-radius: 4px;
            background-color: var(--app-surface);
            gap: 8px;
          "
        >
          <div style="min-width: 180px">
            <div class="text-body-2 font-weight-medium">{{ row.label }}</div>
            <div class="text-caption" style="color: var(--app-text-muted)">
              {{ row.id }} · {{ row.offset }}
            </div>
          </div>

          <div style="flex: 1 1 auto; min-width: 200px">
            <div class="text-body-2 font-weight-medium">
              {{ row.localTime }}
            </div>
            <div class="text-caption" style="color: var(--app-text-muted)">
              {{ row.time24 }} · {{ row.relativeTime }}
            </div>
          </div>

          <a-button size="small" type="text" @click="handleCopy(row.localTime)">
            <template #icon>
              <CopyOutlined />
            </template>
          </a-button>
        </section>
      </template>
    </div>
  </div>
</template>
