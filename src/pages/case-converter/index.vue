<script setup lang="ts">
import { computed, ref, watch } from "vue";

import PanelCard from "../../components/PanelCard.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import { showInfo } from "../../composables/useMessage";
import {
  CASE_STYLES,
  convertCase,
  type CaseStyle,
} from "../../tools/case/caseConverter";
import { PANEL_KEYS } from "../../utils/storage";

const style = ref<CaseStyle>("UPPER");
const input = ref("");
const output = ref("");

const hasInput = computed(() => input.value.trim().length > 0);

const styleLabel = computed(
  () => CASE_STYLES.find((s) => s.id === style.value)?.label ?? "",
);

/** 当输入或风格变化时自动重新计算输出。 */
watch([input, style], () => {
  if (hasInput.value) {
    output.value = convertCase(input.value, style.value);
  } else {
    output.value = "";
  }
});

async function handleCopy() {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  showInfo("已复制");
}

function handleSwap() {
  if (!output.value) return;
  input.value = output.value;
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
      <span class="text-body-2 font-weight-medium">大小写转换</span>

      <a-tag color="cyan" size="small">{{ styleLabel }}</a-tag>

      <span style="flex: 1 1 auto" />

      <a-radio-group
        v-model:value="style"
        option-type="button"
        button-style="outline"
        size="small"
      >
        <a-radio-button v-for="s in CASE_STYLES" :key="s.id" :value="s.id">
          {{ s.label }}
        </a-radio-button>
      </a-radio-group>

      <a-button
        :disabled="!output"
        size="small"
        type="primary"
        ghost
        @click="handleCopy"
      >
        复制输出
      </a-button>

      <a-button
        :disabled="!output"
        size="small"
        type="dashed"
        ghost
        @click="handleSwap"
      >
        交换
      </a-button>

      <a-button
        :disabled="!hasInput && !output"
        size="small"
        type="default"
        ghost
        @click="handleClear"
      >
        清空
      </a-button>
    </header>

    <SplitPanel :panel-key="PANEL_KEYS.caseConverter">
      <template #left>
        <PanelCard icon="FileTextOutlined" title="输入文本">
          <textarea
            v-model="input"
            class="app-textarea"
            placeholder="输入任意命名风格的文本，如 helloWorld / hello_world / HelloWorld"
          />
        </PanelCard>
      </template>

      <template #right>
        <PanelCard icon="RightOutlined" title="输出结果">
          <textarea
            :value="output"
            class="app-textarea"
            readonly
            placeholder="转换结果会自动出现在这里"
          />
        </PanelCard>
      </template>
    </SplitPanel>
  </div>
</template>
