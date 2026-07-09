<script setup lang="ts">
import { computed, ref, watch } from "vue";

import PanelCard from "../../components/PanelCard.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import { showError, showInfo, showSuccess } from "../../composables/useMessage";
import {
  decodeByMode,
  encodeByMode,
  ESCAPE_MODES,
  type EscapeMode,
} from "../../tools/escape/escapeTool";
import { PANEL_KEYS } from "../../utils/storage";

const mode = ref<EscapeMode>("js");
const input = ref("");
const output = ref("");

const modeMeta = computed(
  () => ESCAPE_MODES.find((m) => m.id === mode.value) ?? ESCAPE_MODES[0],
);

const hasInput = computed(() => input.value.trim().length > 0);
const hasOutput = computed(() => output.value.length > 0);

/**
 * 切换模式时，如果用户没有手动改过输出，则重新计算一次。
 */
watch(mode, () => {
  if (hasInput.value) handleEncode();
});

function handleEncode() {
  if (!hasInput.value) {
    output.value = "";
    return;
  }
  try {
    output.value = encodeByMode(input.value, mode.value);
    showSuccess(`${modeMeta.value.label} 已编码`);
  } catch {
    showError("编码失败，请检查输入");
  }
}

function handleDecode() {
  if (!hasInput.value) {
    output.value = "";
    return;
  }
  try {
    output.value = decodeByMode(input.value, mode.value);
    showSuccess(`${modeMeta.value.label} 已解码`);
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
      class="d-flex align-center ga-1 px-2 py-1 flex-wrap"
      style="
        flex: 0 0 auto;
        gap: 4px;
        border: 1px solid var(--app-border);
        border-radius: 4px;
        background-color: var(--app-surface);
      "
    >
      <span class="text-body-2 font-weight-medium">转义工具</span>

      <a-tag color="cyan" size="small">{{ modeMeta.label }}</a-tag>

      <span style="flex: 1 1 auto" />

      <a-radio-group
        v-model:value="mode"
        option-type="button"
        button-style="outline"
        size="small"
      >
        <a-radio-button v-for="m in ESCAPE_MODES" :key="m.id" :value="m.id">
          {{ m.label }}
        </a-radio-button>
      </a-radio-group>

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

    <div
      class="text-caption"
      style="flex: 0 0 auto; padding: 0 4px; color: var(--app-text-muted)"
    >
      {{ modeMeta.description }}
    </div>

    <SplitPanel :panel-key="PANEL_KEYS.escapeTool">
      <template #left>
        <PanelCard icon="FileTextOutlined" title="输入文本">
          <textarea
            v-model="input"
            class="app-textarea"
            placeholder="输入需要转义 / 反转义的文本"
          />
        </PanelCard>
      </template>

      <template #right>
        <PanelCard icon="RightOutlined" title="输出结果">
          <textarea
            :value="output"
            class="app-textarea"
            readonly
            placeholder="转义或反转义结果将显示在这里"
          />
        </PanelCard>
      </template>
    </SplitPanel>
  </div>
</template>
