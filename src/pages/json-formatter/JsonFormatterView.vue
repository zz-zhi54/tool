<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

import CodePanel from "../../components/CodePanel.vue";
import JsonTreePanel from "./JsonTreePanel.vue";
import ToolActionBar from "../../components/ToolActionBar.vue";
import type { JsonValue } from "../../tools/json/jsonTypes";
import {
  formatJson,
  getTextStats,
  minifyJson,
  validateJson,
} from "../../tools/json/jsonFormatter";

const input = ref("");
const inputPanelPercent = ref(60);
const isResizing = ref(false);
const workspaceRef = ref<HTMLElement | null>(null);
const snackbar = ref(false);
const snackbarText = ref("");

/**
 * 当前输入的实时校验结果。
 *
 * 只要用户粘贴或编辑 JSON，就会立即更新校验状态和结构视图，
 * 不再要求先点击"格式化"才能看到 JSON 层级。
 */
const validation = computed(() => validateJson(input.value));

/**
 * 当前输入的文本统计。
 *
 * 紧凑桌面布局中，统计信息展示在顶部状态条，避免右侧再出现重复检查面板。
 */
const stats = computed(() => getTextStats(input.value));

/**
 * 当前输入对应的 JSON 结构。
 *
 * 结构视图直接消费这个值：输入合法时展示树，输入为空或非法时展示提示。
 */
const parsedValue = computed<JsonValue | undefined>(() => {
  if (!validation.value.valid) {
    return undefined;
  }

  return JSON.parse(input.value.trim()) as JsonValue;
});

const hasInput = computed(() => input.value.trim().length > 0);
const inputHasError = computed(
  () => !validation.value.empty && !validation.value.valid,
);

/**
 * 输入面板宽度样式。
 *
 * 桌面端通过拖拽分割条调整左右面板比例；小窗口下会由 CSS 回退为上下布局。
 */
const inputPaneStyle = computed(() => ({
  flexBasis: `${inputPanelPercent.value}%`,
}));

/**
 * 结构视图区域宽度样式。
 */
const detailPaneStyle = computed(() => ({
  flexBasis: `${100 - inputPanelPercent.value}%`,
}));

/**
 * 在输入框内格式化当前 JSON。
 *
 * 点击"格式化"后不再写入单独的输出文本区域，而是直接把输入框内容
 * 替换为缩进后的 JSON，右侧结构视图会跟随输入内容自动刷新。
 */
function handleFormat() {
  const result = formatJson(input.value);

  if (result.success) {
    input.value = result.output;
    showMessage("已在输入框内格式化 JSON");
    return;
  }

  showMessage("JSON 格式错误，请先修正输入");
}

/**
 * 在输入框内压缩当前 JSON。
 *
 * 压缩和格式化一样直接更新输入框，保证页面只有一个 JSON 文本来源。
 */
function handleMinify() {
  const result = minifyJson(input.value);

  if (result.success) {
    input.value = result.output;
    showMessage("已在输入框内压缩 JSON");
    return;
  }

  showMessage("JSON 格式错误，请先修正输入");
}

/**
 * 复制当前输入框中的 JSON。
 *
 * 因为格式化/压缩都会直接回写输入框，所以复制操作只需要复制当前输入。
 */
async function handleCopy() {
  if (!hasInput.value) {
    return;
  }

  await navigator.clipboard.writeText(input.value);
  showMessage("JSON 已复制");
}

/**
 * 清空输入。
 *
 * 清空后校验结果会回到 empty 状态，结构视图也会自动回到提示状态。
 */
function handleClear() {
  input.value = "";
  showMessage("已清空输入");
}

/**
 * 开始拖拽左右面板分割条。
 *
 * 鼠标移动时根据指针在工作区中的横向位置计算输入区占比。
 */
function startResize(event: PointerEvent) {
  isResizing.value = true;
  window.addEventListener("pointermove", handleResize);
  window.addEventListener("pointerup", stopResize);
  handleResize(event);
}

/**
 * 根据指针位置调整输入区宽度。
 *
 * 宽度限制在 35% - 75% 之间，避免任意一侧被压到不可用。
 */
function handleResize(event: PointerEvent) {
  const bounds = workspaceRef.value?.getBoundingClientRect();

  if (!bounds) {
    return;
  }

  const nextPercent = ((event.clientX - bounds.left) / bounds.width) * 100;
  inputPanelPercent.value = clampPanelPercent(nextPercent);
}

/**
 * 结束拖拽并清理全局事件。
 */
function stopResize() {
  isResizing.value = false;
  window.removeEventListener("pointermove", handleResize);
  window.removeEventListener("pointerup", stopResize);
}

/**
 * 键盘调整分割条。
 *
 * 让分割条在获得焦点后也可以用左右方向键微调，符合桌面工具的可访问性预期。
 */
function resizeBy(delta: number) {
  inputPanelPercent.value = clampPanelPercent(inputPanelPercent.value + delta);
}

/**
 * 限制左右面板比例范围。
 */
function clampPanelPercent(value: number) {
  return Math.min(75, Math.max(35, value));
}

/**
 * 展示短提示。
 *
 * 操作结果统一通过 snackbar 反馈，避免在页面中堆叠临时状态文本。
 */
function showMessage(message: string) {
  snackbarText.value = message;
  snackbar.value = true;
}

onBeforeUnmount(stopResize);
</script>

<template>
  <!--
    使用 Vuetify class + inline style 控制布局。
    d-flex flex-column 纵向排列；
    ga-2 子元素间距；h-100 满高；
    min-height:0 overflow:hidden 防止 flex 子元素撑破导致外部滚动。
  -->
  <div
    class="d-flex flex-column ga-2 h-100"
    style="min-height: 0; overflow: hidden"
  >
    <v-toolbar border density="compact" flat rounded style="flex: 0 0 auto">
      <v-toolbar-title class="text-body-2 font-weight-medium">
        JSON 格式化
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

      <ToolActionBar
        :disabled="!hasInput"
        :has-output="hasInput"
        @clear="handleClear"
        @copy="handleCopy"
        @format="handleFormat"
        @minify="handleMinify"
      />
    </v-toolbar>

    <!--
      工作区：左右面板可拖拽调节大小。
      ga-2 子元素间距；overflow:hidden 防止滚动溢出到外部。
    -->
    <div
      ref="workspaceRef"
      class="d-flex ga-2"
      :style="{
        flex: '1 1 auto',
        minHeight: 0,
        overflow: 'hidden',
        userSelect: isResizing ? 'none' : undefined,
      }"
    >
      <!-- 输入 JSON 面板 -->
      <section style="min-width: 0; min-height: 0" :style="inputPaneStyle">
        <CodePanel
          v-model="input"
          :error="inputHasError"
          icon="$file"
          placeholder='粘贴需要处理的 JSON，例如：{ "name": "tool" }'
          title="输入 JSON"
        />
      </section>

      <!-- 拖拽分割条 -->
      <v-sheet
        aria-label="调整输入 JSON 和结构视图宽度"
        role="separator"
        style="width: 8px; cursor: col-resize; flex: 0 0 8px"
        tabindex="0"
        @keydown.left.prevent="resizeBy(-5)"
        @keydown.right.prevent="resizeBy(5)"
        @pointerdown.prevent="startResize"
      />

      <!-- 结构视图面板 -->
      <section style="min-width: 0; min-height: 0" :style="detailPaneStyle">
        <JsonTreePanel :value="parsedValue" />
      </section>
    </div>

    <v-snackbar v-model="snackbar" timeout="2000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>
