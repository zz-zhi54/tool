<script setup lang="ts">
/**
 * 主界面左侧栏底部「更新」入口按钮。
 *
 * 响应 useAutoUpdater 的共享状态：
 *
 * - available → 红色 + 红点，tooltip 提示新版本号
 * - up-to-date → 绿色 + 对勾图标，标识「运行在最新版本」
 * - 其他状态   → 灰色 + 下载图标（默认）
 *
 * 点击行为：触发 `triggerCheck()`，**不**直接弹模态。
 * 检查阶段用 antdv notification 通知完成，下载阶段才弹模态（由通知的
 * 「立即下载」按钮回调打开），符合「检查不阻塞、下载可锁屏」的官方语义。
 */

import { computed, inject } from "vue";
import {
  CheckCircleOutlined,
  CloudDownloadOutlined,
  RocketOutlined,
} from "@ant-design/icons-vue";

import { useAutoUpdater } from "../composables/useAutoUpdater";
import {
  OPEN_UPDATE_MODAL_KEY,
  type OpenUpdateModalFn,
} from "../composables/useUpdateModal";
import { useUpdateNotification } from "../composables/useUpdateNotification";
import packageInfo from "../../package.json";

const props = withDefaults(
  defineProps<{
    /** 折叠态下只显示图标和 tooltip。 */
    collapsed?: boolean;
  }>(),
  { collapsed: false },
);

const { status, info, hasUpdate: remoteHasUpdate } = useAutoUpdater();
const { triggerCheck } = useUpdateNotification();
const openModal = inject(
  OPEN_UPDATE_MODAL_KEY,
  null,
) as OpenUpdateModalFn | null;
const appVersion = packageInfo.version;

/**
 * 是否有更新：优先看用户主动检查后的 status（精确，包含版本号），
 * 否则看后台静默检查的红点标志（粗略，只知道"有/没有"）。
 */
const isAvailable = computed(() => status.value === "available");
const newVersion = computed(() => info.value?.version ?? "");
const isUpToDate = computed(() => status.value === "up-to-date");
const isChecking = computed(() => status.value === "checking");
const isDownloading = computed(() => status.value === "downloading");
const isReady = computed(() => status.value === "ready");
const isError = computed(() => status.value === "error");

const showDot = computed(() => isAvailable.value || remoteHasUpdate.value);

/** 升级样式：仅在 isAvailable（拿到精确版本号）时启用。 */
const isUpgrade = computed(() => isAvailable.value);

const buttonType = computed<"primary" | "default" | "text">(() => {
  if (isUpgrade.value) return "primary";
  return "text";
});

const label = computed(() => {
  if (isUpgrade.value && newVersion.value) {
    return `升级 v${newVersion.value}`;
  }
  if (isUpToDate.value) {
    return `已是最新 · v${appVersion}`;
  }
  if (isChecking.value) {
    return `检查更新…`;
  }
  if (isDownloading.value) {
    return `下载中…`;
  }
  if (isReady.value) {
    return `准备就绪`;
  }
  if (isError.value) {
    return `更新失败`;
  }
  return `更新 · v${appVersion}`;
});

const tooltip = computed(() => {
  if (isUpgrade.value && newVersion.value) {
    return `当前 v${appVersion} → v${newVersion.value}，点击查看`;
  }
  if (isUpToDate.value) {
    return `已是最新 v${appVersion}`;
  }
  if (isChecking.value) {
    return "正在检查更新…";
  }
  if (isDownloading.value) {
    return "正在下载更新…";
  }
  if (isReady.value) {
    return `v${newVersion.value} 下载完成，点击重启`;
  }
  if (isError.value) {
    return "更新出错，点击重试";
  }
  return `检查 v${appVersion} 是否有更新`;
});

/**
 * 点击行为：仅触发检查，下载留给通知的「立即下载」按钮。
 *
 * modal 在 available 阶段仍可能未打开（用户点「稍后」），所以这里也提供一个
 * fallback：如果 status 已经是 available/downloading/ready 等「已知结果」，
 * 直接打开 modal 而不是再查一次（避免触发 useAutoUpdater 里 runUpdateFlow
 * 的二次 reset）。
 */
function onClick() {
  if (openModal) {
    void triggerCheck(() => openModal());
  } else {
    // 没有 modal 注入时（如单测）只跑检查；通知由 triggerCheck 内部处理。
    void triggerCheck(async () => {});
  }
}
</script>

<template>
  <a-tooltip :title="tooltip" placement="right">
    <a-badge
      :dot="showDot"
      :offset="[-2, 2]"
      :style="{ display: 'block', width: '100%' }"
    >
      <a-button
        block
        size="small"
        :type="buttonType"
        :danger="isUpgrade"
        :loading="isChecking || isDownloading"
        data-tauri-no-drag
        @click="onClick"
      >
        <template #icon>
          <RocketOutlined v-if="isUpgrade" />
          <CheckCircleOutlined v-else-if="isUpToDate" />
          <CloudDownloadOutlined v-else />
        </template>
        <span v-if="!props.collapsed">
          {{ label }}
        </span>
      </a-button>
    </a-badge>
  </a-tooltip>
</template>
