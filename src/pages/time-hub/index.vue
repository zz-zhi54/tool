<script setup lang="ts">
/**
 * 时间工具统一入口（单列直铺 · 时间戳 + 时区 单页版）。
 *
 * 把时间戳 / 时区合并到一个 PanelCard：
 * - 顶部共享一个 input + 源时区下拉 + 「现在」按钮；
 * - 时间戳字段 + 各时区列表都由同一份 parseTimestamp 结果派生，
 *   输入变化即时刷新，无需点击按钮。
 * - 源时区默认 = 浏览器 Intl 解析的系统时区（如 Asia/Shanghai）。
 *
 * 设计要点：
 * - 整页只有一个 PanelCard + 顶部实时时钟 header；
 * - PanelCard 内部 overflow: auto，按内容自然滚动；
 * - 解析失败时只显示 a-alert，不弹 toast。
 * - 日期计算已移除（v0.2 起）。
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import { CopyOutlined } from "@ant-design/icons-vue";

import PanelCard from "../../components/PanelCard.vue";
import { showInfo } from "../../composables/useMessage";
import {
  type CurrentTime,
  getCurrentTime,
  parseTimestamp,
} from "../../tools/timestamp/timestampConverter";
import {
  COMMON_TIMEZONES,
  convertTimezone,
  type TimezoneConvertResult,
} from "../../tools/timezone/timezoneConverter";

/** 浏览器系统时区（IANA id），用于默认源时区。 */
const SYSTEM_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

// ── 实时时钟（顶部展示） ─────────────────────────────────

const currentTime = ref<CurrentTime>(getCurrentTime());
let timerId: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timerId = setInterval(() => {
    currentTime.value = getCurrentTime();
  }, 1000);
});

onBeforeUnmount(() => {
  if (timerId !== null) clearInterval(timerId);
});

// ── 共享输入 + 源时区 ────────────────────────────────────

const input = ref("");
const sourceTimezone = ref(SYSTEM_TIMEZONE);

/** 解析时间戳；空输入返回 null。 */
const tsResult = computed(() =>
  input.value.trim().length > 0 ? parseTimestamp(input.value) : null,
);

const invalid = computed(
  () => input.value.trim().length > 0 && tsResult.value === null,
);

/** 时区列表结果：复用 tsResult 的 millis，按源时区解释。 */
const tzResult = computed<TimezoneConvertResult | null>(() => {
  const r = tsResult.value;
  if (!r) return null;
  return convertTimezone(String(r.timestampMillis), sourceTimezone.value);
});

const sourceTimezoneOptions = computed(() => {
  // 把系统时区放在最前，其余按 COMMON_TIMEZONES 原序排列；若系统时区已
  // 在列表里，保持原位不重复。
  const inList = COMMON_TIMEZONES.find((o) => o.id === SYSTEM_TIMEZONE);
  if (inList)
    return COMMON_TIMEZONES.map((o) => ({ value: o.id, label: o.label }));
  return [
    { id: SYSTEM_TIMEZONE, label: `${SYSTEM_TIMEZONE}（系统时区）` },
    ...COMMON_TIMEZONES,
  ].map((o) => ({ value: o.id, label: o.label }));
});

function handleFillNow() {
  input.value = String(currentTime.value.timestampSeconds);
}

async function handleCopy(value: string) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
  showInfo("已复制");
}

// ── 结果字段列表 ────────────────────────────────────────

const tsFields = computed(() => {
  const r = tsResult.value;
  if (!r) return [];
  return [
    { label: "Unix 时间戳（秒）", value: String(r.timestampSeconds) },
    { label: "Unix 时间戳（毫秒）", value: String(r.timestampMillis) },
    { label: "ISO 8601", value: r.iso8601 },
    { label: "本地时间", value: r.localTime },
    { label: "UTC 时间", value: r.utcTime },
    { label: "相对时间", value: r.relativeTime },
  ];
});

/** 结果行内联样式（与 PanelCard 内部区分的浅色背景） */
const rowStyle = {
  border: "1px solid var(--app-border)",
  borderRadius: "4px",
  backgroundColor: "var(--app-surface)",
  padding: "8px 12px",
  gap: "8px",
} as const;
</script>

<template>
  <a-flex vertical :gap="8" style="height: 100%; min-height: 0; overflow: auto">
    <!-- 顶部状态条：标题 + 实时时钟 -->
    <a-card size="small" :body-style="{ padding: '4px 12px' }">
      <a-flex align="center" :gap="8">
        <span style="font-weight: 500">时间工具</span>
        <a-tag color="blue" size="small">{{ currentTime.localTime }}</a-tag>
        <a-tag color="cyan" size="small">
          {{ currentTime.timestampSeconds }}
        </a-tag>
      </a-flex>
    </a-card>

    <PanelCard icon="ClockCircleOutlined" title="时间 + 时区">
      <a-flex vertical :gap="12">
        <!-- 输入区 -->
        <a-flex align="center" :gap="8">
          <a-input
            v-model:value="input"
            size="small"
            placeholder="输入时间戳（如 1718179200）或日期字符串（如 2024-06-12）"
            style="flex: 1 1 auto"
          />
          <a-button size="small" type="text" @click="handleFillNow">
            现在
          </a-button>
        </a-flex>
        <a-flex align="center" :gap="8">
          <span
            style="
              color: var(--app-text-muted);
              min-width: 64px;
              font-size: 12px;
            "
          >
            源时区
          </span>
          <a-select
            v-model:value="sourceTimezone"
            size="small"
            style="flex: 1 1 auto"
            :options="sourceTimezoneOptions"
            show-search
          />
        </a-flex>

        <a-alert
          v-if="invalid"
          type="warning"
          show-icon
          message="无法解析输入，请检查格式"
        />

        <!-- 时间戳字段 -->
        <a-flex
          v-for="field in tsFields"
          :key="field.label"
          align="center"
          :style="rowStyle"
        >
          <span
            style="
              min-width: 140px;
              color: var(--app-text-muted);
              font-size: 12px;
            "
          >
            {{ field.label }}
          </span>
          <span style="flex: 1 1 auto; word-break: break-all; font-weight: 500">
            {{ field.value }}
          </span>
          <a-button size="small" type="text" @click="handleCopy(field.value)">
            <template #icon>
              <CopyOutlined />
            </template>
          </a-button>
        </a-flex>

        <!-- 各时区列表 -->
        <template v-if="tzResult">
          <a-flex align="center" :style="rowStyle">
            <span
              style="
                min-width: 100px;
                color: var(--app-text-muted);
                font-size: 12px;
              "
            >
              秒
            </span>
            <span
              style="flex: 1 1 auto; word-break: break-all; font-weight: 500"
            >
              {{ tzResult.timestampSeconds }}
            </span>
            <a-button
              size="small"
              type="text"
              @click="handleCopy(String(tzResult.timestampSeconds))"
            >
              <template #icon>
                <CopyOutlined />
              </template>
            </a-button>
          </a-flex>
          <a-flex
            v-for="row in tzResult.rows"
            :key="row.id"
            align="center"
            :style="rowStyle"
          >
            <div style="min-width: 160px">
              <div style="font-weight: 500">{{ row.label }}</div>
              <div style="color: var(--app-text-muted); font-size: 12px">
                {{ row.id }} · {{ row.offset }}
              </div>
            </div>
            <div style="flex: 1 1 auto; min-width: 180px">
              <div style="font-weight: 500">
                {{ row.localTime }}
              </div>
              <div style="color: var(--app-text-muted); font-size: 12px">
                {{ row.time24 }} · {{ row.relativeTime }}
              </div>
            </div>
            <a-button
              size="small"
              type="text"
              @click="handleCopy(row.localTime)"
            >
              <template #icon>
                <CopyOutlined />
              </template>
            </a-button>
          </a-flex>
        </template>
      </a-flex>
    </PanelCard>
  </a-flex>
</template>
