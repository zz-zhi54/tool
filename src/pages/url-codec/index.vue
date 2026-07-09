<script setup lang="ts">
import { computed, ref } from "vue";

import PanelCard from "../../components/PanelCard.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import {
  showError,
  showInfo,
  showSuccess,
  showWarning,
} from "../../composables/useMessage";
import { decodeUrl, encodeUrl, validateUrl } from "../../tools/url/urlCodec";
import { PANEL_KEYS } from "../../utils/storage";

const input = ref("");
const output = ref("");

/** 校验输入是否能被解码（用作状态栏提示）。 */
const validation = computed(() => validateUrl(input.value));

const hasInput = computed(() => input.value.trim().length > 0);
const hasOutput = computed(() => output.value.length > 0);

function handleEncode() {
  if (!hasInput.value) return;
  try {
    output.value = encodeUrl(input.value);
    showSuccess("已编码为 URL");
  } catch {
    showError("编码失败，请检查输入内容");
  }
}

function handleDecode() {
  if (!hasInput.value) return;
  if (!validation.value.valid) {
    showWarning("输入不是合法的 URL 编码字符串");
    return;
  }
  try {
    output.value = decodeUrl(input.value);
    showSuccess("已从 URL 解码");
  } catch {
    showError("解码失败，请检查输入");
  }
}

function handleSwap() {
  if (!hasOutput.value) return;
  input.value = output.value;
  output.value = "";
  showSuccess("已交换输入和输出");
}

async function handleCopyOutput() {
  if (!hasOutput.value) return;
  await navigator.clipboard.writeText(output.value);
  showInfo("输出已复制");
}

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
      <span class="text-body-2 font-weight-medium">URL 编解码</span>

      <a-tag
        :color="
          validation.valid
            ? 'green'
            : validation.empty
              ? 'default'
              : hasInput
                ? 'orange'
                : 'default'
        "
        size="small"
      >
        {{
          validation.valid
            ? "合法 URL"
            : validation.empty
              ? "等待输入"
              : hasInput
                ? "普通文本"
                : "等待输入"
        }}
      </a-tag>

      <span style="flex: 1 1 auto" />

      <a-button
        :disabled="!hasInput"
        size="small"
        type="primary"
        ghost
        @click="handleEncode"
      >
        编码
      </a-button>

      <a-button
        :disabled="!hasInput"
        size="small"
        type="default"
        ghost
        @click="handleDecode"
      >
        解码
      </a-button>

      <a-button
        :disabled="!hasOutput"
        size="small"
        type="dashed"
        ghost
        @click="handleSwap"
      >
        交换
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

    <SplitPanel :panel-key="PANEL_KEYS.urlCodec">
      <template #left>
        <PanelCard icon="FileTextOutlined" title="输入文本">
          <textarea
            v-model="input"
            class="app-textarea"
            placeholder="输入需要编码的文本，或粘贴 URL 编码字符串进行解码"
          />
        </PanelCard>
      </template>

      <template #right>
        <PanelCard icon="RightOutlined" title="输出结果">
          <textarea
            :value="output"
            class="app-textarea"
            readonly
            placeholder="编码或解码结果将显示在这里"
          />
        </PanelCard>
      </template>
    </SplitPanel>
  </div>
</template>
