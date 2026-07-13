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
 * 检查 / 下载都走通知流程；只有用户点通知里的「立即重启」才会通过
 * openRelaunch 打开 UpdateModal。openInfo 留给错误通知的「查看」按钮。
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
 *
 * 主动检查能拿到版本号用于文案；后台检查只能告诉 sidebar 该不该显示红点。
 */
const isAvailable = computed(() => status.value === "available");
const newVersion = computed(() => info.value?.version ?? "");
const isUpToDate = computed(() => status.value === "up-to-date");
const isChecking = computed(() => status.value === "checking");
const isDownloading = computed(() => status.value === "downloading");
const isReady = computed(() => status.value === "ready");
const isError = computed(() => status.value === "error");

/**
 * 是否显示红点 + 升级样式（"有可用更新"）。
 *
 * - isAvailable（用户主动检查拿到 update）：有精确版本号，强提示
 * - remoteHasUpdate（后台静默检查拿到的红点）：只知道"有"，弱提示
 *
 * 这里只看"是否值得点"；按钮文案和危险样式走更细的判断。
 */
const showDot = computed(
  () => isAvailable.value || remoteHasUpdate.value,
);

/** 升级样式：仅在 isAvailable（拿到精确版本号）时启用。 */
const isUpgrade = computed(() => isAvailable.value);

/** 状态对应按钮 type（颜色由 antdv 框架主题控制）。 */
const buttonType = computed<"primary" | "default" | "text">(() => {
  if (isUpgrade.value) return "primary";
  return "text";
});

/**
 * 按钮文本：根据是否有新版本显示不同文案。
 *
 * - 用户已 check 过、available：「升级 v新」
 * - 后台静默拿到红点（不知道版本号）：「更新 · v当前」
 * - 已是最新（up-to-date）：「已是最新 · v当前」
 * - 检查中（checking）：「检查更新…」+ loading 由模板渲染
 * - 其他：兜底「更新 · v当前」
 */
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
 * 点击行为：触发检查（用通知反馈结果），不直接开 modal。
 *
 * 检查 / 下载都走通知流程；只有用户点通知里的「立即重启」才会通过
 * openRelaunch 打开 UpdateModal。openInfo 留给错误通知的「查看」按钮。
 */
function onClick() {
  if (!openModal) {
    // 没有 modal 注入时（如单测）只跑检查，通知由 triggerCheck 内部处理。
    void triggerCheck({
      openRelaunch: () => {},
      openInfo: () => {},
    });
    return;
  }
  void triggerCheck({
    openRelaunch: () => openModal("openRelaunch"),
    openInfo: () => openModal("openInfo"),
  });
}
</script>

<template>
  <a-tooltip :title="tooltip" placement="right">
    <!--
      a-badge 渲染为 <span>，默认 display:inline-block 让 sidebar
      底部三个按钮宽度不一致（更新 115 vs 主题/设置 152）。
      给 wrapper 加 display:block + width:100% 让按钮占满 sidebar 宽度，
      跟主题 / 设置按钮对齐。
    -->
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
