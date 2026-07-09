<script setup lang="ts">
import { computed, ref } from "vue";

import { CopyOutlined, DeleteOutlined } from "@ant-design/icons-vue";

import { showError, showInfo } from "../../composables/useMessage";
import {
  addToDate,
  diffDates,
  formatDateTime,
  nowAsInput,
  type DateDiffResult,
  type DateUnit,
} from "../../tools/date-calc/dateCalculator";

type Mode = "diff" | "add";

const mode = ref<Mode>("diff");

const fromInput = ref(formatDateTime(new Date()));
const toInput = ref(formatDateTime(new Date()));

const baseInput = ref(nowAsInput());
const deltaInput = ref(1);
const unit = ref<DateUnit>("day");

const diffResult = ref<DateDiffResult | null>(null);
const addResult = ref<ReturnType<typeof addToDate> | null>(null);

const hasDiffInput = computed(
  () => fromInput.value.trim() && toInput.value.trim(),
);
const hasAddInput = computed(() => baseInput.value.trim().length > 0);

const directionLabel = computed(() => {
  if (!diffResult.value?.success) return "";
  return diffResult.value.direction === 1
    ? "from 在 to 之前"
    : "from 在 to 之后";
});

const unitOptions: { value: DateUnit; label: string }[] = [
  { value: "year", label: "年" },
  { value: "month", label: "月" },
  { value: "day", label: "日" },
  { value: "hour", label: "小时" },
  { value: "minute", label: "分钟" },
  { value: "second", label: "秒" },
];

function handleDiff() {
  const result = diffDates(fromInput.value, toInput.value);
  diffResult.value = result;
  if (!result.success) {
    showError(result.errorMessage ?? "计算失败");
  }
}

function handleAdd() {
  const result = addToDate({
    date: baseInput.value,
    delta: deltaInput.value,
    unit: unit.value,
  });
  addResult.value = result;
  if (!result.success) {
    showError(result.errorMessage ?? "计算失败");
  }
}

function handleApply() {
  if (mode.value === "diff") handleDiff();
  else handleAdd();
}

async function handleCopy(value: string) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
  showInfo("已复制");
}

function handleFillNow(which: "from" | "to" | "base") {
  const now = formatDateTime(new Date());
  if (which === "from") fromInput.value = now;
  else if (which === "to") toInput.value = now;
  else baseInput.value = now;
}

function handleClear() {
  fromInput.value = "";
  toInput.value = "";
  baseInput.value = "";
  diffResult.value = null;
  addResult.value = null;
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
      <span class="text-body-2 font-weight-medium">日期计算器</span>

      <a-tag color="cyan" size="small">
        {{ mode === "diff" ? "间隔" : "加减" }}
      </a-tag>

      <span style="flex: 1 1 auto" />

      <a-button
        size="small"
        :type="mode === 'diff' ? 'primary' : 'default'"
        ghost
        @click="mode = 'diff'"
      >
        间隔
      </a-button>
      <a-button
        size="small"
        :type="mode === 'add' ? 'primary' : 'default'"
        ghost
        @click="mode = 'add'"
      >
        加减
      </a-button>

      <a-button size="small" type="default" ghost @click="handleClear">
        <template #icon>
          <DeleteOutlined />
        </template>
        清空
      </a-button>
    </header>

    <!-- 输入区 -->
    <section
      class="d-flex flex-column ga-2 px-3 py-2"
      style="
        flex: 0 0 auto;
        border: 1px solid var(--app-border);
        border-radius: 4px;
        background-color: var(--app-surface);
      "
    >
      <template v-if="mode === 'diff'">
        <div class="d-flex align-center ga-2 flex-wrap">
          <span class="text-caption" style="min-width: 60px">从</span>
          <a-input
            v-model:value="fromInput"
            placeholder="2024-01-01 00:00:00"
            size="small"
            style="flex: 1 1 200px"
          />
          <a-button size="small" type="text" @click="handleFillNow('from')">
            现在
          </a-button>
        </div>
        <div class="d-flex align-center ga-2 flex-wrap">
          <span class="text-caption" style="min-width: 60px">到</span>
          <a-input
            v-model:value="toInput"
            placeholder="2024-12-31 23:59:59"
            size="small"
            style="flex: 1 1 200px"
          />
          <a-button size="small" type="text" @click="handleFillNow('to')">
            现在
          </a-button>
        </div>
      </template>

      <template v-else>
        <div class="d-flex align-center ga-2 flex-wrap">
          <span class="text-caption" style="min-width: 60px">起始</span>
          <a-input
            v-model:value="baseInput"
            placeholder="2024-01-01 00:00:00"
            size="small"
            style="flex: 1 1 200px"
          />
          <a-button size="small" type="text" @click="handleFillNow('base')">
            现在
          </a-button>
        </div>
        <div class="d-flex align-center ga-2 flex-wrap">
          <span class="text-caption" style="min-width: 60px">偏移</span>
          <a-input-number
            v-model:value="deltaInput"
            size="small"
            :min="-1000000"
            :max="1000000"
            style="width: 140px"
          />
          <a-select
            v-model:value="unit"
            size="small"
            style="width: 120px"
            :options="unitOptions"
          />
        </div>
      </template>

      <div class="d-flex justify-end">
        <a-button
          size="small"
          type="primary"
          ghost
          :disabled="mode === 'diff' ? !hasDiffInput : !hasAddInput"
          @click="handleApply"
        >
          计算
        </a-button>
      </div>
    </section>

    <!-- 结果区 -->
    <div style="flex: 1 1 auto; min-height: 0; overflow: auto">
      <template v-if="mode === 'diff'">
        <a-empty
          v-if="!diffResult"
          description="输入两个日期后点击「计算」查看间隔。"
          :image="undefined"
        >
          <template #image>
            <span />
          </template>
        </a-empty>

        <template v-else-if="diffResult.success">
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
              style="min-width: 140px; color: var(--app-text-muted)"
            >
              方向
            </span>
            <span class="text-body-2 font-weight-medium">
              {{ directionLabel }}
            </span>
          </section>

          <section
            v-for="field in [
              { label: '人类可读', value: diffResult.humanReadable },
              {
                label: '总天数',
                value: `${diffResult.totalDays} 天`,
              },
              {
                label: '总小时',
                value: `${diffResult.totalHours} 小时`,
              },
              {
                label: '总分钟',
                value: `${diffResult.totalMinutes} 分钟`,
              },
              {
                label: '总秒数',
                value: `${diffResult.totalSeconds} 秒`,
              },
              {
                label: '工作日',
                value: `${diffResult.weekdays} 天（不含周末）`,
              },
              {
                label: '毫秒',
                value: String(diffResult.diffMs),
              },
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
              @click="handleCopy(String(field.value))"
            >
              <template #icon>
                <CopyOutlined />
              </template>
            </a-button>
          </section>
        </template>
      </template>

      <template v-else>
        <a-empty
          v-if="!addResult"
          description="输入起始日期、偏移量和单位后点击「计算」查看新日期。"
          :image="undefined"
        >
          <template #image>
            <span />
          </template>
        </a-empty>

        <template v-else-if="addResult.success">
          <section
            v-for="field in [
              { label: '结果时间', value: addResult.output },
              { label: 'ISO 8601', value: addResult.outputIso },
              { label: '星期', value: addResult.weekday },
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
              @click="handleCopy(String(field.value ?? ''))"
            >
              <template #icon>
                <CopyOutlined />
              </template>
            </a-button>
          </section>
        </template>
      </template>
    </div>
  </div>
</template>
