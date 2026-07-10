<script setup lang="ts">
/**
 * 编码转换统一入口。
 *
 * 把 Base64 / URL / Hex / Unicode 四个编解码纵向堆叠到单页面
 * （HTML 实体因字符集特殊仍保留独立页），与 text-hub 保持一致的
 * "多合一 + 节卡片"结构。
 *
 * 实时转换模式：每节独立维护 input / direction，输出由 computed
 * 派生，输入即转换、方向切换即反向重算，无须点击"编码/解码"按钮：
 *   - 方向 forward（编码 / 转义）→ 总是把 input 视为原始文本；
 *   - 方向 reverse（解码 / 反转义）→ 必须先通过 validate，否则
 *     输出为空 + status tag 标"非法"；
 *   - swap：把当前输出搬到 input，并把方向翻转（解码后想再回编
 *     一遍时不必手动点切换）。
 *   - 复制输出 / 清空行为保留。
 *
 * UI 完全使用 ant-design-vue 组件，无手写 CSS；只在 inline style
 * 上表达高度 / 占比 / 滚动等无法用组件 prop 表达的布局约束。
 */
import { computed, ref } from "vue";

import {
  decodeBase64,
  encodeBase64,
  validateBase64,
} from "../../tools/base64/base64Codec";
import { decodeHex, encodeHex, validateHex } from "../../tools/hex/hexCodec";
import { decodeUrl, encodeUrl, validateUrl } from "../../tools/url/urlCodec";
import {
  escapeUnicode,
  unescapeUnicode,
  validateUnicodeEscape,
} from "../../tools/unicode/unicodeEscape";
import { showInfo, showSuccess } from "../../composables/useMessage";

/** 转换方向。 */
type Direction = "forward" | "reverse";

/** 校验函数统一返回的结构。 */
interface ValidationLike {
  valid: boolean;
  empty: boolean;
  errorMessage?: string;
}

/** 一节编码器所需的状态集合。 */
interface CodecState {
  input: string;
  direction: Direction;
}

/** 编码器元信息 + 状态。 */
interface CodecSection {
  id: string;
  title: string;
  /** 主方向（编码 / 转义）按钮文案。 */
  forwardLabel: string;
  /** 反方向（解码 / 反转义）按钮文案。 */
  reverseLabel: string;
  /** 校验通过（解码方向下表示 input 是合法编码串）。 */
  validLabel: string;
  /** 校验失败（解码方向下表示 input 不是合法编码串）。 */
  invalidLabel: string;
  inputPlaceholder: string;
  outputPlaceholder: string;
  state: CodecState;
}

function createSection(
  id: string,
  title: string,
  forwardLabel: string,
  reverseLabel: string,
  validLabel: string,
  invalidLabel: string,
  inputPlaceholder: string,
  outputPlaceholder: string,
): CodecSection {
  return {
    id,
    title,
    forwardLabel,
    reverseLabel,
    validLabel,
    invalidLabel,
    inputPlaceholder,
    outputPlaceholder,
    state: { input: "", direction: "forward" },
  };
}

/**
 * 4 个节。
 *
 * 顺序：Base64 → URL → Hex → Unicode，与注册表 `tools` 的
 * 分类内顺序保持一致。
 */
const sections = ref<CodecSection[]>([
  createSection(
    "base64",
    "Base64",
    "编码",
    "解码",
    "合法 Base64",
    "非法 Base64",
    "输入需要编码的文本，或粘贴 Base64 字符串进行解码",
    "编码或解码结果将显示在这里",
  ),
  createSection(
    "url",
    "URL",
    "编码",
    "解码",
    "合法 URL 编码",
    "非法 URL 编码",
    "输入需要编码的文本，或粘贴百分号编码字符串进行解码",
    "编码或解码结果将显示在这里",
  ),
  createSection(
    "hex",
    "Hex",
    "编码",
    "解码",
    "合法 Hex",
    "非法 Hex",
    "输入需要编码的文本，或粘贴十六进制字符串进行解码",
    "编码或解码结果将显示在这里",
  ),
  createSection(
    "unicode",
    "Unicode",
    "转义",
    "反转义",
    "含 \\u 序列",
    "非法 \\u 序列",
    "输入需要转义的文本（如 中文 A😀），或粘贴 \\u 转义序列进行反转义",
    "转义或反转义结果将显示在这里",
  ),
]);

/**
 * 按节 id 计算输入校验。
 *
 * 4 个编码器都实现了 validate，返回 `{ valid, empty, errorMessage? }`。
 */
function validateSection(id: string, value: string): ValidationLike {
  switch (id) {
    case "base64":
      return validateBase64(value);
    case "url":
      return validateUrl(value);
    case "hex":
      return validateHex(value);
    case "unicode":
      return validateUnicodeEscape(value);
    default:
      return { valid: false, empty: true };
  }
}

/**
 * 一节的输出：input + direction 派生。
 *
 *  - forward 方向：input 是原文，调用 encode/escape；
 *  - reverse 方向：input 必须是合法编码串，校验失败则输出空串。
 *    任何抛错都被吞掉返回空串（用户输入到一半时不应弹错）。
 */
function computeOutput(section: CodecSection): string {
  const { id, state } = section;
  if (state.input.length === 0) return "";
  try {
    if (state.direction === "forward") {
      switch (id) {
        case "base64":
          return encodeBase64(state.input);
        case "url":
          return encodeUrl(state.input);
        case "hex":
          return encodeHex(state.input);
        case "unicode":
          return escapeUnicode(state.input);
      }
    } else {
      const v = validateSection(id, state.input);
      if (!v.valid) return "";
      switch (id) {
        case "base64":
          return decodeBase64(state.input);
        case "url":
          return decodeUrl(state.input);
        case "hex":
          return decodeHex(state.input);
        case "unicode":
          return unescapeUnicode(state.input);
      }
    }
  } catch {
    return "";
  }
  return "";
}

/** 每节输出：用 computed 包装，让输入/方向变化时响应式刷新。 */
const outputMap = computed<Record<string, string>>(() =>
  Object.fromEntries(sections.value.map((s) => [s.id, computeOutput(s)])),
);

/** 每节 status tag 颜色 + 文案。 */
const statusMap = computed<
  Record<string, { color: string; label: string; showInvalid: boolean }>
>(() => {
  const result: Record<
    string,
    { color: string; label: string; showInvalid: boolean }
  > = {};
  for (const s of sections.value) {
    if (s.state.input.length === 0) {
      result[s.id] = {
        color: "default",
        label: "等待输入",
        showInvalid: false,
      };
      continue;
    }
    if (s.state.direction === "forward") {
      result[s.id] = {
        color: "cyan",
        label: s.forwardLabel + " 中",
        showInvalid: false,
      };
      continue;
    }
    // reverse
    const v = validateSection(s.id, s.state.input);
    if (v.valid) {
      result[s.id] = {
        color: "green",
        label: s.validLabel,
        showInvalid: false,
      };
    } else {
      result[s.id] = { color: "red", label: s.invalidLabel, showInvalid: true };
    }
  }
  return result;
});

/* ── 操作 ─────────────────────────────────────────── */

function handleSwap(section: CodecSection) {
  const out = outputMap.value[section.id];
  if (!out) return;
  section.state.input = out;
  // swap 之后方向自动翻转：上一轮输出当作新输入，应该用反方向还原
  section.state.direction =
    section.state.direction === "forward" ? "reverse" : "forward";
  showSuccess("已交换输入和输出");
}

async function handleCopyOutput(section: CodecSection) {
  const out = outputMap.value[section.id];
  if (!out) return;
  await navigator.clipboard.writeText(out);
  showInfo("输出已复制");
}

function handleClear(section: CodecSection) {
  section.state.input = "";
  // 清空后让方向回到 forward，避免下次进来看到上次的反向状态
  section.state.direction = "forward";
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

const sectionBodyRow = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  flex: "1 1 auto",
  minHeight: 0,
};

const paneCol = {
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
  <div
    class="d-flex flex-column ga-2"
    style="height: 100%; padding: 8px; overflow: auto; box-sizing: border-box"
  >
    <a-card
      v-for="section in sections"
      :key="section.id"
      size="small"
      :body-style="sectionBodyShort"
    >
      <div class="d-flex align-center" style="gap: 4px; flex-wrap: wrap">
        <a-typography-text strong>{{ section.title }}</a-typography-text>

        <!--
          方向切换：用一个 a-radio-group 在 forward / reverse 之间切，
          比单独按钮更直观，且占用空间小、不打断用户连续输入。
        -->
        <a-radio-group
          :value="section.state.direction"
          option-type="button"
          button-style="outline"
          size="small"
          @update:value="
            (v: string | number | boolean) =>
              (section.state.direction =
                v === 'reverse' ? 'reverse' : 'forward')
          "
        >
          <a-radio-button value="forward">
            {{ section.forwardLabel }}
          </a-radio-button>
          <a-radio-button value="reverse">
            {{ section.reverseLabel }}
          </a-radio-button>
        </a-radio-group>

        <a-tag :color="statusMap[section.id].color" size="small">
          {{ statusMap[section.id].label }}
        </a-tag>

        <span style="flex: 1 1 auto" />

        <a-button
          :disabled="!outputMap[section.id]"
          size="small"
          type="dashed"
          ghost
          @click="handleSwap(section)"
        >
          交换
        </a-button>

        <a-button
          :disabled="!outputMap[section.id]"
          size="small"
          type="primary"
          ghost
          @click="handleCopyOutput(section)"
        >
          复制输出
        </a-button>

        <a-button
          :disabled="section.state.input.length === 0"
          size="small"
          type="default"
          ghost
          @click="handleClear(section)"
        >
          清空
        </a-button>
      </div>

      <div :style="sectionBodyRow">
        <div :style="paneCol">
          <a-typography-text type="secondary" :style="paneLabelStyle">
            输入
          </a-typography-text>
          <a-textarea
            v-model:value="section.state.input"
            :placeholder="section.inputPlaceholder"
            :style="textareaFillStyle"
            :auto-size="false"
          />
        </div>
        <div :style="paneCol">
          <a-typography-text type="secondary" :style="paneLabelStyle">
            输出（{{
              section.state.direction === "forward"
                ? section.forwardLabel
                : section.reverseLabel
            }}）
          </a-typography-text>
          <a-textarea
            :value="outputMap[section.id]"
            readonly
            :placeholder="section.outputPlaceholder"
            :style="textareaFillStyle"
            :auto-size="false"
          />
        </div>
      </div>
    </a-card>
  </div>
</template>
