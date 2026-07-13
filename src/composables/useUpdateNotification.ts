/**
 * 「检查 / 下载 / 安装就绪」通知调度。
 *
 * 整个更新流程都用 antdv notification / message 提示，不锁界面。
 * Modal 仅作「重启确认」入口，且本身不再锁屏。
 */

import { h, watch } from "vue";
import type { VNode } from "vue";
import { notification } from "ant-design-vue";
import {
  CloudDownloadOutlined,
  RocketOutlined,
} from "@ant-design/icons-vue";

import { useAutoUpdater } from "./useAutoUpdater";
import { destroyMessage, showPersistent } from "./useMessage";
import type { UpdateModalAction } from "./useUpdateModal";
import packageInfo from "../../package.json";

const NOTICE_KEY = "updater-notice";
const DOWNLOAD_MSG_KEY = "updater-download-progress";

export type UpdateModalActions = Record<
  UpdateModalAction,
  () => void | Promise<void>
>;

function describeCause(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : typeof cause === "string"
      ? cause
      : "未知错误";
}

function describeError(
  stage: "check" | "download" | "relaunch",
  cause: unknown,
): string {
  const detail = describeCause(cause);
  switch (stage) {
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

export function useUpdateNotification() {
  const { checkOnly, runUpdateFlow, status, progress, info, error } =
    useAutoUpdater();

  /**
   * 订阅 status / progress：downloading 时持续显示带百分比的浮字，
   * 其他任何状态都销毁浮字。
   */
  watch(
    [status, progress],
    ([s, p]) => {
      if (s === "downloading") {
        const v = info.value?.version ?? "?";
        showPersistent(`下载 v${v} … ${p}%`, DOWNLOAD_MSG_KEY);
        return;
      }
      destroyMessage(DOWNLOAD_MSG_KEY);
    },
    { immediate: false },
  );

  /**
   * 触发一次主动检查并以通知形式反馈结果。
   */
  async function triggerCheck(actions: UpdateModalActions): Promise<void> {
    destroyMessage(DOWNLOAD_MSG_KEY);

    notification.open({
      key: NOTICE_KEY,
      type: "info",
      message: "检查更新中…",
      description: `正在连接 v${packageInfo.version} 的更新服务器。`,
      duration: null,
      placement: "topRight",
    });

    const result = await checkOnly();

    if (result === "up-to-date") {
      notification.open({
        key: NOTICE_KEY,
        type: "success",
        message: "已是最新版本",
        description: `当前已是 v${packageInfo.version}，无需更新。`,
        duration: 4,
        placement: "topRight",
      });
      return;
    }

    if (result === "error") {
      notification.open({
        key: NOTICE_KEY,
        type: "error",
        message: "检查更新失败",
        description: describeError("check", error.value?.cause),
        duration: 6,
        placement: "topRight",
        btn: h(
          "a-button",
          {
            size: "small",
            onClick: () => {
              notification.close(NOTICE_KEY);
              void actions.openInfo();
            },
          },
          { default: () => "查看" },
        ) as unknown as VNode,
      });
      return;
    }

    if (result === "available") {
      const v = info.value?.version ?? "";
      const buttons = h("div", { style: "display: flex; gap: 8px;" }, [
        h(
          "a-button",
          {
            size: "small",
            onClick: () => notification.close(NOTICE_KEY),
          },
          { default: () => "稍后" },
        ),
        h(
          "a-button",
          {
            size: "small",
            type: "primary",
            onClick: async () => {
              notification.close(NOTICE_KEY);
              await runDownload(actions);
            },
          },
          {
            default: () => "立即下载",
            icon: () => h(CloudDownloadOutlined),
          },
        ),
      ]);
      notification.open({
        key: NOTICE_KEY,
        type: "info",
        message: `发现新版本 v${v}`,
        description: "点「立即下载」开始后台下载，过程中可继续使用其他工具。",
        duration: null,
        placement: "topRight",
        btn: buttons as unknown as VNode,
      });
      return;
    }

    // 其他状态不该出现 —— 关掉通知兜底。
    notification.close(NOTICE_KEY);
  }

  /**
   * 后台跑 runUpdateFlow，下载进度由上面的 watch → message 浮字呈现，
   * 完成 / 失败后用通知告知。
   */
  async function runDownload(actions: UpdateModalActions): Promise<void> {
    notification.close(NOTICE_KEY);

    const result = await runUpdateFlow();

    if (result === "ready") {
      const v = info.value?.version ?? "";
      const buttons = h("div", { style: "display: flex; gap: 8px;" }, [
        h(
          "a-button",
          {
            size: "small",
            onClick: () => notification.close(NOTICE_KEY),
          },
          { default: () => "稍后" },
        ),
        h(
          "a-button",
          {
            size: "small",
            type: "primary",
            onClick: () => {
              notification.close(NOTICE_KEY);
              void actions.openRelaunch();
            },
          },
          {
            default: () => "立即重启",
            icon: () => h(RocketOutlined),
          },
        ),
      ]);
      notification.open({
        key: NOTICE_KEY,
        type: "success",
        message: `v${v} 下载完成`,
        description: "点「立即重启」应用更新；选「稍后」可继续使用，下次启动再装。",
        duration: null,
        placement: "topRight",
        btn: buttons as unknown as VNode,
      });
      return;
    }

    if (result === "error") {
      const stage = error.value?.stage ?? "download";
      notification.open({
        key: NOTICE_KEY,
        type: "error",
        message: stage === "check" ? "检查更新失败" : "下载失败",
        description: describeError(stage, error.value?.cause),
        duration: 6,
        placement: "topRight",
        btn: h(
          "a-button",
          {
            size: "small",
            onClick: () => {
              notification.close(NOTICE_KEY);
              void actions.openInfo();
            },
          },
          { default: () => "查看" },
        ) as unknown as VNode,
      });
      return;
    }

    // up-to-date / idle 等不该出现，兜底关掉通知。
    notification.close(NOTICE_KEY);
  }

  return { triggerCheck, runDownload };
}