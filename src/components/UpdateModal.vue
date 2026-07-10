<script setup lang="ts">
import { computed, ref } from "vue";
import { CloudDownloadOutlined, RocketOutlined } from "@ant-design/icons-vue";

import { useAutoUpdater } from "../composables/useAutoUpdater";
import { showError } from "../composables/useMessage";
import packageInfo from "../../package.json";

const open = ref(false);
const appVersion = packageInfo.version;

const { status, info, progress, error, runUpdateFlow, relaunch, reset } =
  useAutoUpdater();

/**
 * 允许关闭 Modal 的状态：空闲 / 已是最新 / 失败。
 * 检查中 / 发现新版本 / 下载中 / 下载完成 时点遮罩/关闭键/ESC 都无效，
 * 避免误操作打断下载或安装流程。
 */
const canClose = computed(
  () =>
    status.value === "up-to-date" ||
    status.value === "error" ||
    status.value === "idle",
);

/**
 * "立即下载"按钮是否处于 loading 状态。
 * 用 ref 包一层避免在 v-else-if="status === 'available'" 块内
 * 直接比较 status === 'downloading' 触发 TS2367（类型已收窄）。
 */
const isDownloading = computed(() => status.value === "downloading");

function describeError(err: { stage: string; cause: unknown }): string {
  const detail =
    err.cause instanceof Error
      ? err.cause.message
      : typeof err.cause === "string"
        ? err.cause
        : "未知错误";
  switch (err.stage) {
    case "check":
      return `检查更新失败：${detail}`;
    case "download":
      return `下载更新失败：${detail}`;
    case "relaunch":
      return `重启失败：${detail}`;
    default:
      return detail;
  }
}

/**
 * 主动打开 Modal 的入口。
 *
 * 由 chrome 上的"更新"按钮（侧边栏 / 顶部导航）通过 inject 拿到本组件 ref 后调用。
 * 这里只负责打开，不再自动跑流程 —— Modal 打开后用户根据 status 决定下一步。
 */
function openModal() {
  reset();
  open.value = true;
}
defineExpose({ open: openModal });

async function onConfirmDownload() {
  await runUpdateFlow();
  if (status.value === "error" && error.value) {
    showError(describeError(error.value));
  }
}

async function onRelaunch() {
  await relaunch();
  if (error.value) {
    showError(describeError(error.value));
  }
}
</script>

<template>
  <a-modal
    v-model:open="open"
    :footer="null"
    :mask-closable="canClose"
    :closable="canClose"
    :keyboard="canClose"
    width="420px"
  >
    <!-- 初始 / 检查中 -->
    <div
      v-if="status === 'idle' || status === 'checking'"
      class="d-flex flex-column align-center ga-3 py-3"
    >
      <a-spin v-if="status === 'checking'" />
      <div class="text-body-2">正在检查更新…</div>
    </div>

    <!-- 已是最新 -->
    <div
      v-else-if="status === 'up-to-date'"
      class="d-flex flex-column align-center ga-2 py-3"
    >
      <div class="text-body-2 font-weight-medium">已是最新版本</div>
      <div class="text-caption" style="color: var(--app-text-muted)">
        当前已是 v{{ appVersion }}，无需更新。
      </div>
      <a-button type="primary" @click="open = false">好的</a-button>
    </div>

    <!-- 发现新版本 -->
    <div
      v-else-if="status === 'available'"
      class="d-flex flex-column ga-3 py-2"
    >
      <div class="text-body-2">
        发现新版本 <strong>v{{ info?.version }}</strong>
      </div>
      <div
        v-if="info?.notes"
        class="text-caption"
        style="
          color: var(--app-text-muted);
          max-height: 200px;
          overflow: auto;
          white-space: pre-wrap;
          border: 1px solid var(--app-border);
          border-radius: 4px;
          padding: 8px;
        "
      >
        {{ info.notes }}
      </div>
      <div class="d-flex" style="gap: 8px; justify-content: flex-end">
        <a-button @click="open = false">稍后</a-button>
        <a-button type="primary" :loading="isDownloading" @click="onConfirmDownload">
          <template #icon><CloudDownloadOutlined /></template>
          立即下载
        </a-button>
      </div>
    </div>

    <!-- 下载中 -->
    <div
      v-else-if="status === 'downloading'"
      class="d-flex flex-column ga-3 py-3"
    >
      <div class="text-body-2">正在下载 v{{ info?.version }}…</div>
      <a-progress :percent="progress" />
    </div>

    <!-- 下载完成 -->
    <div
      v-else-if="status === 'ready'"
      class="d-flex flex-column align-center ga-3 py-3"
    >
      <div class="text-body-2 font-weight-medium">下载完成</div>
      <div class="text-caption" style="color: var(--app-text-muted)">
        点击「立即重启」应用更新。
      </div>
      <a-button type="primary" @click="onRelaunch">
        <template #icon><RocketOutlined /></template>
        立即重启
      </a-button>
    </div>

    <!-- 失败 -->
    <div
      v-else-if="status === 'error'"
      class="d-flex flex-column align-center ga-3 py-3"
    >
      <div class="text-body-2" style="color: var(--app-error, #d4380d)">
        {{ error ? describeError(error) : "更新失败" }}
      </div>
      <a-button @click="open = false">关闭</a-button>
    </div>
  </a-modal>
</template>
