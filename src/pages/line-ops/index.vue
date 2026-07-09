<script setup lang="ts">
import { computed, ref, watch } from "vue";

import PanelCard from "../../components/PanelCard.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import { showInfo, showSuccess } from "../../composables/useMessage";
import {
  applyLineOps,
  type LineOpsOptions,
} from "../../tools/line-ops/lineOps";
import { PANEL_KEYS } from "../../utils/storage";

const input = ref("");
const trim = ref<boolean>(true);
const removeEmpty = ref<boolean>(true);
const sort = ref<"none" | "asc" | "desc">("none");
const dedupe = ref<boolean>(false);

const output = ref("");

const result = computed(() => {
  const opts: LineOpsOptions = {
    trim: trim.value,
    removeEmpty: removeEmpty.value,
    sort: sort.value,
    dedupe: dedupe.value,
  };
  return applyLineOps(input.value, opts);
});

const hasInput = computed(() => input.value.trim().length > 0);

/** 当输入或选项变化时重新计算输出。 */
watch(result, (r) => {
  output.value = r.lines.join("\n");
});

async function handleCopy() {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  showSuccess("已复制");
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

const sortOptions = [
  { value: "none", label: "不排序" },
  { value: "asc", label: "升序" },
  { value: "desc", label: "降序" },
];
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
      <span class="text-body-2 font-weight-medium">行处理</span>

      <a-tag color="cyan" size="small">
        {{ result.resultCount }} / {{ result.originalCount }}
      </a-tag>

      <a-checkbox v-model:checked="trim">trim</a-checkbox>
      <a-checkbox v-model:checked="removeEmpty">去空行</a-checkbox>
      <a-checkbox v-model:checked="dedupe">去重</a-checkbox>

      <a-select
        v-model:value="sort"
        size="small"
        style="width: 110px"
        :options="sortOptions"
      />

      <span style="flex: 1 1 auto" />

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

    <SplitPanel :panel-key="PANEL_KEYS.lineOps">
      <template #left>
        <PanelCard icon="FileTextOutlined" title="输入文本">
          <textarea
            v-model="input"
            class="app-textarea"
            placeholder="每行一项，输入需要处理的文本"
          />
        </PanelCard>
      </template>

      <template #right>
        <PanelCard icon="RightOutlined" title="输出结果">
          <textarea
            :value="output"
            class="app-textarea"
            readonly
            placeholder="处理结果会自动出现在这里"
          />
        </PanelCard>
      </template>
    </SplitPanel>
  </div>
</template>
