<script setup lang="ts">
/**
 * 文本工具统一入口。
 *
 * 把"转义 / 大小写 / 行处理"三个相关小工具纵向堆叠到单页面，
 * 每个工具是一节，节内布局固定为两行：
 *   - 第 1 行：功能标题 + 选项控件 + 操作按钮
 *   - 第 2 行：输入（上）和输出（下）上下堆叠
 *
 * 正则测试因为需要更多展示空间（多列匹配卡片网格），已拆为独立页面
 * regex-tester，本页不再承载。
 *
 * UI 完全使用 ant-design-vue 组件（a-card / a-descriptions / a-textarea /
 * a-typography-text 等），无任何手写 CSS；只在内联 style 上表达"高度 /
 * 占比 / 滚动"等无法用组件 prop 表达的布局约束。
 */
import { computed, ref } from "vue";

import {
  CASE_STYLES,
  convertCase,
  type CaseStyle,
} from "../../tools/case/caseConverter";
import {
  decodeByMode,
  encodeByMode,
  ESCAPE_MODES,
  type EscapeMode,
} from "../../tools/escape/escapeTool";
import { applyLineOps } from "../../tools/line-ops/lineOps";
import { showError, showInfo, showSuccess } from "../../composables/useMessage";

/* ── 转义 ───────────────────────────────────────────── */

const escapeMode = ref<EscapeMode>("js");
const escapeInput = ref("");
const escapeOutput = ref("");

const escapeModeMeta = computed(
  () => ESCAPE_MODES.find((m) => m.id === escapeMode.value) ?? ESCAPE_MODES[0],
);

function handleEscapeEncode() {
  try {
    escapeOutput.value = encodeByMode(escapeInput.value, escapeMode.value);
    showSuccess(`${escapeModeMeta.value.label} 已编码`);
  } catch {
    showError("编码失败，请检查输入");
  }
}

function handleEscapeDecode() {
  try {
    escapeOutput.value = decodeByMode(escapeInput.value, escapeMode.value);
    showSuccess(`${escapeModeMeta.value.label} 已解码`);
  } catch {
    showError("解码失败，请检查输入");
  }
}

function handleEscapeSwap() {
  escapeInput.value = escapeOutput.value;
  escapeOutput.value = "";
  showSuccess("已交换输入和输出");
}

async function handleEscapeCopy() {
  await navigator.clipboard.writeText(escapeOutput.value);
  showInfo("输出已复制");
}

function handleEscapeClear() {
  escapeInput.value = "";
  escapeOutput.value = "";
  showInfo("已清空");
}

/* ── 大小写 ─────────────────────────────────────────── */

const caseStyle = ref<CaseStyle>("UPPER");
const caseInput = ref("");

const caseOutput = computed(() =>
  caseInput.value.trim().length > 0
    ? convertCase(caseInput.value, caseStyle.value)
    : "",
);

async function handleCaseCopy() {
  await navigator.clipboard.writeText(caseOutput.value);
  showInfo("输出已复制");
}

function handleCaseSwap() {
  caseInput.value = caseOutput.value;
}

function handleCaseClear() {
  caseInput.value = "";
  showInfo("已清空");
}

/* ── 行处理 ─────────────────────────────────────────── */

const lineInput = ref("");
const lineTrim = ref(true);
const lineRemoveEmpty = ref(true);
const lineSort = ref<"none" | "asc" | "desc">("none");
const lineDedupe = ref(false);

const lineResult = computed(() =>
  applyLineOps(lineInput.value, {
    trim: lineTrim.value,
    removeEmpty: lineRemoveEmpty.value,
    sort: lineSort.value,
    dedupe: lineDedupe.value,
  }),
);

const lineOutput = computed(() => lineResult.value.lines.join("\n"));

const sortOptions = [
  { value: "none", label: "不排序" },
  { value: "asc", label: "升序" },
  { value: "desc", label: "降序" },
];

async function handleLineCopy() {
  await navigator.clipboard.writeText(lineOutput.value);
  showInfo("输出已复制");
}

function handleLineSwap() {
  lineInput.value = lineOutput.value;
}

function handleLineClear() {
  lineInput.value = "";
  showInfo("已清空");
}

/* ── 共享布局样式（无法用组件 prop 表达的） ────────── */

// 节卡片 body：纵向两行（控件行 + 输入输出行），固定高度
const sectionBodyShort = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  height: "240px",
  padding: "8px 12px",
  minHeight: 0,
};

const sectionBodyTall = {
  ...sectionBodyShort,
  height: "320px",
};

const sectionBodyRow = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  flex: "1 1 auto",
  minHeight: 0,
};

// 上下堆叠：每行 textarea 均分剩余高度
const paneColInput = {
  flex: "1 1 0",
  minWidth: 0,
  minHeight: 0,
  display: "flex",
  flexDirection: "column" as const,
};

const paneColOutput = {
  flex: "1 1 0",
  minWidth: 0,
  minHeight: 0,
  display: "flex",
  flexDirection: "column" as const,
};

const paneLabelStyle = { marginBottom: "4px" };

// textarea 自身撑满父列
const textareaFillStyle = { flex: "1 1 auto", minHeight: 0 };
</script>

<template>
  <!--
    整页根容器：纵向堆叠 4 个功能节，节之间 ga-2 间距。
    inline style 控制 padding / overflow（必须 inline）。
  -->
  <a-flex
    vertical
    :gap="8"
    style="height: 100%; padding: 8px; overflow: auto; box-sizing: border-box"
  >
    <!-- ── 转义 ──────────────────────────────────── -->
    <a-card size="small" :body-style="sectionBodyShort">
      <a-flex align="center" :gap="4" wrap>
        <a-typography-text strong>转义工具</a-typography-text>

        <a-radio-group
          v-model:value="escapeMode"
          option-type="button"
          button-style="outline"
          size="small"
        >
          <a-radio-button v-for="m in ESCAPE_MODES" :key="m.id" :value="m.id">
            {{ m.label }}
          </a-radio-button>
        </a-radio-group>

        <a-tag color="cyan" size="small">{{ escapeModeMeta.label }}</a-tag>

        <span style="flex: 1 1 auto" />

        <a-button
          size="small"
          type="primary"
          @click="handleEscapeEncode"
        >
          编码
        </a-button>

        <a-button
          size="small"
          type="default"
          @click="handleEscapeDecode"
        >
          解码
        </a-button>

        <a-button
          size="small"
          type="dashed"
          @click="handleEscapeSwap"
        >
          交换
        </a-button>

        <a-button
          size="small"
          type="primary"
          @click="handleEscapeCopy"
        >
          复制输出
        </a-button>

        <a-button
          size="small"
          type="default"
          @click="handleEscapeClear"
        >
          清空
        </a-button>
      </a-flex>

      <a-typography-text
        type="secondary"
        style="font-size: 12px; padding: 0 4px"
      >
        {{ escapeModeMeta.description }}
      </a-typography-text>

      <div :style="sectionBodyRow">
        <div :style="paneColInput">
          <a-typography-text type="secondary" :style="paneLabelStyle">
            输入
          </a-typography-text>
          <a-textarea
            v-model:value="escapeInput"
            placeholder="输入需要转义 / 反转义的文本"
            :style="textareaFillStyle"
            :auto-size="false"
          />
        </div>
        <div :style="paneColOutput">
          <a-typography-text type="secondary" :style="paneLabelStyle">
            输出
          </a-typography-text>
          <a-textarea
            :value="escapeOutput"
            readonly
            placeholder="转义或反转义结果将显示在这里"
            :style="textareaFillStyle"
            :auto-size="false"
          />
        </div>
      </div>
    </a-card>

    <!-- ── 大小写 ────────────────────────────────── -->
    <a-card size="small" :body-style="sectionBodyShort">
      <a-flex align="center" :gap="4" wrap>
        <a-typography-text strong>大小写转换</a-typography-text>

        <a-radio-group
          v-model:value="caseStyle"
          option-type="button"
          button-style="outline"
          size="small"
        >
          <a-radio-button v-for="s in CASE_STYLES" :key="s.id" :value="s.id">
            {{ s.label }}
          </a-radio-button>
        </a-radio-group>

        <a-tag color="cyan" size="small">{{
          CASE_STYLES.find((s) => s.id === caseStyle)?.label ?? ""
        }}</a-tag>

        <span style="flex: 1 1 auto" />

        <a-button
          size="small"
          type="primary"
          @click="handleCaseCopy"
        >
          复制输出
        </a-button>

        <a-button
          size="small"
          type="dashed"
          @click="handleCaseSwap"
        >
          交换
        </a-button>

        <a-button
          size="small"
          type="default"
          @click="handleCaseClear"
        >
          清空
        </a-button>
      </a-flex>

      <div :style="sectionBodyRow">
        <div :style="paneColInput">
          <a-typography-text type="secondary" :style="paneLabelStyle">
            输入
          </a-typography-text>
          <a-textarea
            v-model:value="caseInput"
            placeholder="输入任意命名风格的文本，如 helloWorld / hello_world"
            :style="textareaFillStyle"
            :auto-size="false"
          />
        </div>
        <div :style="paneColOutput">
          <a-typography-text type="secondary" :style="paneLabelStyle">
            输出
          </a-typography-text>
          <a-textarea
            :value="caseOutput"
            readonly
            placeholder="转换结果会自动出现在这里"
            :style="textareaFillStyle"
            :auto-size="false"
          />
        </div>
      </div>
    </a-card>

    <!-- ── 行处理 ────────────────────────────────── -->
    <a-card size="small" :body-style="sectionBodyTall">
      <a-flex align="center" :gap="4" wrap>
        <a-typography-text strong>行处理</a-typography-text>

        <a-checkbox v-model:checked="lineTrim">trim</a-checkbox>
        <a-checkbox v-model:checked="lineRemoveEmpty">去空行</a-checkbox>
        <a-checkbox v-model:checked="lineDedupe">去重</a-checkbox>

        <a-select
          v-model:value="lineSort"
          size="small"
          style="width: 110px"
          :options="sortOptions"
        />

        <a-tag color="cyan" size="small">
          {{ lineResult.resultCount }} / {{ lineResult.originalCount }}
        </a-tag>

        <span style="flex: 1 1 auto" />

        <a-button
          size="small"
          type="primary"
          @click="handleLineCopy"
        >
          复制输出
        </a-button>

        <a-button
          size="small"
          type="dashed"
          @click="handleLineSwap"
        >
          交换
        </a-button>

        <a-button
          size="small"
          type="default"
          @click="handleLineClear"
        >
          清空
        </a-button>
      </a-flex>

      <div :style="sectionBodyRow">
        <div :style="paneColInput">
          <a-typography-text type="secondary" :style="paneLabelStyle">
            输入
          </a-typography-text>
          <a-textarea
            v-model:value="lineInput"
            placeholder="每行一项，输入需要处理的文本"
            :style="textareaFillStyle"
            :auto-size="false"
          />
        </div>
        <div :style="paneColOutput">
          <a-typography-text type="secondary" :style="paneLabelStyle">
            输出
          </a-typography-text>
          <a-textarea
            :value="lineOutput"
            readonly
            placeholder="处理结果会自动出现在这里"
            :style="textareaFillStyle"
            :auto-size="false"
          />
        </div>
      </div>
    </a-card>
  </a-flex>
</template>
