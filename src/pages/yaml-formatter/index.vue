<script setup lang="ts">
import { computed, ref } from "vue";
import { parse } from "yaml";

import InputPanel from "./InputPanel.vue";
import YamlTreePanel from "./YamlTreePanel.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import {
  formatYaml,
  getYamlTextStats,
  minifyYaml,
  validateYaml,
} from "../../tools/yaml/yamlFormatter";
import { PANEL_KEYS } from "../../utils/storage";

const input = ref("");
const snackbar = ref(false);
const snackbarText = ref("");

/**
 * 当前输入的实时校验结果。
 *
 * 用户编辑 YAML 时立即更新校验状态和结构视图。
 */
const validation = computed(() => validateYaml(input.value));

/**
 * 当前输入的文本统计。
 */
const stats = computed(() => getYamlTextStats(input.value));

/**
 * 当前输入对应的解析结果。
 *
 * 结构视图直接消费这个值：输入合法时展示树，输入为空或非法时展示提示。
 */
const parsedValue = computed<unknown | undefined>(() => {
  if (!validation.value.valid) {
    return undefined;
  }

  return parse(input.value.trim());
});

const hasInput = computed(() => input.value.trim().length > 0);

/**
 * 格式化当前 YAML。
 *
 * 直接替换输入框内容，右侧结构视图自动刷新。
 */
function handleFormat() {
  const result = formatYaml(input.value);

  if (result.success) {
    input.value = result.output;
    showMessage("已在输入框内格式化 YAML");
    return;
  }

  showMessage("YAML 格式错误，请先修正输入");
}

/**
 * 压缩当前 YAML。
 */
function handleMinify() {
  const result = minifyYaml(input.value);

  if (result.success) {
    input.value = result.output;
    showMessage("已在输入框内压缩 YAML");
    return;
  }

  showMessage("YAML 格式错误，请先修正输入");
}

/**
 * 复制当前输入框中的 YAML。
 */
async function handleCopy() {
  if (!hasInput.value) {
    return;
  }

  await navigator.clipboard.writeText(input.value);
  showMessage("YAML 已复制");
}

/**
 * 清空输入。
 */
function handleClear() {
  input.value = "";
  showMessage("已清空输入");
}

function showMessage(message: string) {
  snackbarText.value = message;
  snackbar.value = true;
}
</script>

<template>
  <div
    class="d-flex flex-column ga-2 h-100"
    style="min-height: 0; overflow: hidden"
  >
    <v-toolbar border density="compact" flat rounded style="flex: 0 0 auto">
      <v-toolbar-title class="text-body-2 font-weight-medium">
        YAML 格式化
      </v-toolbar-title>

      <v-chip
        :color="
          validation.valid ? 'success' : validation.empty ? 'info' : 'error'
        "
        class="mr-1"
        label
        size="x-small"
        variant="tonal"
      >
        {{ validation.valid ? "合法" : validation.empty ? "等待输入" : "错误" }}
      </v-chip>

      <v-chip
        class="mr-1"
        color="secondary"
        label
        size="x-small"
        variant="tonal"
      >
        {{ stats.bytes }} B
      </v-chip>

      <v-chip
        class="mr-2"
        color="secondary"
        label
        size="x-small"
        variant="tonal"
      >
        {{ stats.lines }} 行
      </v-chip>

      <!-- 操作按钮：格式化、压缩、复制、清空 -->
      <div class="d-flex align-center ga-1">
        <v-btn
          color="primary"
          density="compact"
          prepend-icon="$success"
          :disabled="!hasInput"
          size="small"
          text="格式化"
          variant="tonal"
          @click="handleFormat"
        />

        <v-btn
          color="secondary"
          density="compact"
          prepend-icon="$collapse"
          :disabled="!hasInput"
          size="small"
          text="压缩"
          variant="tonal"
          @click="handleMinify"
        />

        <v-btn
          color="success"
          density="compact"
          prepend-icon="$file"
          :disabled="!hasInput"
          size="small"
          text="复制"
          variant="tonal"
          @click="handleCopy"
        />

        <v-btn
          color="warning"
          density="compact"
          prepend-icon="$clear"
          :disabled="!hasInput"
          size="small"
          text="清空"
          variant="text"
          @click="handleClear"
        />
      </div>
    </v-toolbar>

    <!-- 工作区：左右面板可拖拽调节大小 -->
    <SplitPanel :panel-key="PANEL_KEYS.yamlFormatter">
      <template #left>
        <InputPanel v-model="input" />
      </template>

      <template #right>
        <YamlTreePanel :value="parsedValue" />
      </template>
    </SplitPanel>

    <v-snackbar v-model="snackbar" timeout="2000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>
