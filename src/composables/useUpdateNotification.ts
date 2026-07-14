/**
 * 「下载完成 / 安装就绪」通知。
 *
 * AppShell 启动时已经通过 useAutoUpdater.checkAndDownloadSilently()
 * 在后台跑完 check + download；本文件只负责两个 UI 副作用：
 *
 * 1. 下载中 → 右下角 message 浮字持续显示百分比（status=downloading 时启用）
 * 2. 下载完成（status=ready）→ 通知「vX 下载完成」+ 立即重启 / 稍后
 *
 * 没有任何"询问是否下载"的弹窗——启动发现新版本就直接后台下载，
 * 下载完才让用户决定是否重启，符合"少打扰"原则。
 */

import { h, watch } from "vue";
import type { VNode } from "vue";
import { notification } from "ant-design-vue";
import { RocketOutlined } from "@ant-design/icons-vue";

import { useAutoUpdater } from "./useAutoUpdater";
import { destroyMessage, showPersistent } from "./useMessage";

const NOTICE_KEY = "updater-ready";
const DOWNLOAD_MSG_KEY = "updater-download-progress";

export function useUpdateNotification() {
  const { status, progress, info, relaunch } = useAutoUpdater();

  // 下载中持续显示带百分比的浮字，结束态自动销毁。
  watch(
    [status, progress],
    ([s, p]) => {
      if (s === "downloading") {
        showPersistent(
          `下载 v${info.value?.version ?? "?"} … ${p}%`,
          DOWNLOAD_MSG_KEY,
        );
      } else {
        destroyMessage(DOWNLOAD_MSG_KEY);
      }
    },
    { immediate: false },
  );

  // ready 时弹通知让用户决定是否重启；点击 X / 稍后都保留 status=ready 不动。
  watch(
    status,
    (s) => {
      if (s !== "ready") return;
      const v = info.value?.version ?? "";
      notification.open({
        key: NOTICE_KEY,
        type: "success",
        message: `v${v} 下载完成`,
        description: "点「立即重启」应用更新；选「稍后」下次启动再装。",
        duration: null,
        placement: "topRight",
        btn: h("div", { style: "display: flex; gap: 8px;" }, [
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
                void relaunch();
              },
            },
            {
              default: () => "立即重启",
              icon: () => h(RocketOutlined),
            },
          ),
        ]) as unknown as VNode,
      });
    },
    { immediate: false },
  );
}