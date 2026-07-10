<script setup lang="ts">
/**
 * 编码转换统一入口。
 *
 * 把 Base64 / URL / Hex / Unicode 四个编解码纵向堆叠到单页面
 * （HTML 实体因字符集特殊仍保留独立页），与 text-hub 保持一致的
 * "多合一 + 节卡片"结构。
 *
 * 实时转换模式：每节独立维护 input / direction，输出由 computed
 * 派生，输入即转换、方向切换即反向重算，无须点击"编码/解码"按钮。
 *
 * UI 完全使用 ant-design-vue 组件，无手写 CSS。
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
  forwardLabel: string;
  reverseLabel: string;
  validLabel: string;
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

const outputMap = computed<Record<string, string>>(() =>
  Object.fromEntries(sections.value.map((s) => [s.id, computeOutput(s)])),
);

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
  section.state.direction = "forward";
  showInfo("已清空");
}
</script>

<template>
  <a-flex
    vertical
    :gap="8"
    style="height: 100%; padding: 8px; overflow: auto; box-sizing: border-box"
  >
    <a-card v-for="section in sections" :key="section.id" size="small">
      <a-flex vertical :gap="8" style="height: 240px">
        <a-flex align="center" :gap="4" wrap>
          <strong>{{ section.title }}</strong>

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

          <a-flex :flex="'1 1 auto'" />

          <a-button size="small" type="dashed" @click="handleSwap(section)">
            交换
          </a-button>

          <a-button
            size="small"
            type="primary"
            @click="handleCopyOutput(section)"
          >
            复制输出
          </a-button>

          <a-button size="small" type="default" @click="handleClear(section)">
            清空
          </a-button>
        </a-flex>

        <a-flex vertical :gap="8" style="flex: 1 1 auto; min-height: 0">
          <a-flex vertical :gap="4" style="flex: 1 1 0; min-height: 0">
            <a-typography-text type="secondary">输入</a-typography-text>
            <a-textarea
              v-model:value="section.state.input"
              :placeholder="section.inputPlaceholder"
              :auto-size="false"
              style="flex: 1 1 auto; min-height: 0"
            />
          </a-flex>
          <a-flex vertical :gap="4" style="flex: 1 1 0; min-height: 0">
            <a-typography-text type="secondary">
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
              :auto-size="false"
              style="flex: 1 1 auto; min-height: 0"
            />
          </a-flex>
        </a-flex>
      </a-flex>
    </a-card>
  </a-flex>
</template>
