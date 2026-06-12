<script setup lang="ts">
import { computed, ref } from "vue";

import {
  decodeBase64,
  encodeBase64,
  validateBase64,
} from "../../tools/base64/base64Codec";

const input = ref("");
const output = ref("");
const snackbar = ref(false);
const snackbarText = ref("");

/**
 * 当前输入的 Base64 合法性。
 *
 * 用于状态栏 chip 显示，帮助用户判断输入内容是否可以被解码。
 */
const validation = computed(() => validateBase64(input.value));

const hasInput = computed(() => input.value.trim().length > 0);
const hasOutput = computed(() => output.value.length > 0);

/**
 * 将输入文本编码为 Base64。
 */
function handleEncode() {
  if (!hasInput.value) {
    return;
  }

  try {
    output.value = encodeBase64(input.value);
    showMessage("已编码为 Base64");
  } catch {
    showMessage("编码失败，请检查输入内容");
  }
}

/**
 * 将 Base64 解码为普通文本。
 */
function handleDecode() {
  if (!hasInput.value) {
    return;
  }

  if (!validation.value.valid) {
    showMessage("输入不是合法的 Base64 字符串");
    return;
  }

  try {
    output.value = decodeBase64(input.value);
    showMessage("已从 Base64 解码");
  } catch {
    showMessage("解码失败，请检查 Base64 输入");
  }
}

/**
 * 将输出结果交换到输入区。
 *
 * 方便连续编解码（如先编码再解码回来验证）。
 */
function handleSwap() {
  if (!hasOutput.value) {
    return;
  }

  input.value = output.value;
  output.value = "";
  showMessage("已交换输入和输出");
}

/**
 * 复制输出结果。
 */
async function handleCopyOutput() {
  if (!hasOutput.value) {
    return;
  }

  await navigator.clipboard.writeText(output.value);
  showMessage("输出已复制");
}

/**
 * 清空输入和输出。
 */
function handleClear() {
  input.value = "";
  output.value = "";
  showMessage("已清空");
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
        Base64 编码
      </v-toolbar-title>

      <v-chip
        :color="
          validation.valid
            ? 'success'
            : validation.empty
              ? 'info'
              : hasInput
                ? 'warning'
                : 'info'
        "
        class="mr-1"
        label
        size="x-small"
        variant="tonal"
      >
        {{
          validation.valid
            ? "合法 Base64"
            : validation.empty
              ? "等待输入"
              : hasInput
                ? "普通文本"
                : "等待输入"
        }}
      </v-chip>

      <!-- 操作按钮 -->
      <div class="d-flex align-center ga-1">
        <v-btn
          color="primary"
          density="compact"
          prepend-icon="$next"
          :disabled="!hasInput"
          size="small"
          text="编码"
          variant="tonal"
          @click="handleEncode"
        />

        <v-btn
          color="secondary"
          density="compact"
          prepend-icon="$prev"
          :disabled="!hasInput"
          size="small"
          text="解码"
          variant="tonal"
          @click="handleDecode"
        />

        <v-btn
          color="info"
          density="compact"
          prepend-icon="$refresh"
          :disabled="!hasOutput"
          size="small"
          text="交换"
          variant="tonal"
          @click="handleSwap"
        />

        <v-btn
          color="success"
          density="compact"
          prepend-icon="$file"
          :disabled="!hasOutput"
          size="small"
          text="复制输出"
          variant="tonal"
          @click="handleCopyOutput"
        />

        <v-btn
          color="warning"
          density="compact"
          prepend-icon="$clear"
          :disabled="!hasInput && !hasOutput"
          size="small"
          text="清空"
          variant="text"
          @click="handleClear"
        />
      </div>
    </v-toolbar>

    <!-- 工作区：左右面板各占 50% -->
    <div
      class="d-flex ga-2"
      style="flex: 1 1 auto; min-height: 0; overflow: hidden"
    >
      <!-- 输入面板 -->
      <v-card
        border="sm"
        class="d-flex flex-column"
        flat
        style="flex: 1; min-width: 0; min-height: 0; overflow: hidden"
      >
        <v-card-title
          class="d-flex align-center text-body-2 font-weight-medium px-2 py-1"
        >
          <v-icon class="mr-1" icon="$file" size="small" />
          输入文本
        </v-card-title>
        <v-divider />
        <v-card-text
          class="pa-2"
          style="flex: 1; min-height: 0; overflow: hidden"
        >
          <textarea
            v-model="input"
            placeholder="输入需要编码的文本，或粘贴 Base64 字符串进行解码"
            style="
              width: 100%;
              height: 100%;
              resize: none;
              border: none;
              outline: none;
              background: transparent;
              font-family: inherit;
              font-size: inherit;
              line-height: inherit;
              color: inherit;
            "
          />
        </v-card-text>
      </v-card>

      <!-- 输出面板 -->
      <v-card
        border="sm"
        class="d-flex flex-column"
        flat
        style="flex: 1; min-width: 0; min-height: 0; overflow: hidden"
      >
        <v-card-title
          class="d-flex align-center text-body-2 font-weight-medium px-2 py-1"
        >
          <v-icon class="mr-1" icon="$next" size="small" />
          输出结果
        </v-card-title>
        <v-divider />
        <v-card-text
          class="pa-2"
          style="flex: 1; min-height: 0; overflow: hidden"
        >
          <textarea
            :value="output"
            readonly
            placeholder="编码或解码结果将显示在这里"
            style="
              width: 100%;
              height: 100%;
              resize: none;
              border: none;
              outline: none;
              background: transparent;
              font-family: inherit;
              font-size: inherit;
              line-height: inherit;
              color: inherit;
            "
          />
        </v-card-text>
      </v-card>
    </div>

    <v-snackbar v-model="snackbar" timeout="2000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>
