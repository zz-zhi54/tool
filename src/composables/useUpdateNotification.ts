/**
 * 「检查完成 / 失败」通知调度。
 *
 * 检查阶段不阻塞界面：点 sidebar / 设置页的「更新」入口 → 静默跑 checkOnly() →
 * 用 antdv notification 给出结果，**不**弹任何 modal。
 *
 * 三档文案：
 * - available → 「发现新版本 vX.X」+ 立即下载 / 稍后 两个按钮
 * - up-to-date → 「已是最新版本 v当前」+ 自动消失
 * - error → 「检查更新失败：<message>」+ 自动消失
 *
 * 点「立即下载」才调 runUpdateFlow，并通知 UpdateModal 打开执行下载；点「稍后」/
 * 关闭通知就结束，状态机仍保留为 available，下次再开 sidebar 入口还能看到红点。
 *
 * 通知里不显示「下载中 / 已下载 / 重启」状态 —— 这部分由 UpdateModal 接管：
 * 模态锁住界面直到 ready（按官方 updater 语义，下载中无可取消的句柄）。
 */

import { h } from "vue";
import type { VNode } from "vue";
import { notification } from "ant-design-vue";
import { CloudDownloadOutlined } from "@ant-design/icons-vue";

import { useAutoUpdater } from "./useAutoUpdater";
import { showError } from "./useMessage";
import packageInfo from "../../package.json";

/** 通知 key：用固定 key 让重复点「更新」时更新同一张通知而不是堆叠。 */
const NOTICE_KEY = "updater-notice";

/** 通知按钮的回调：把「开 modal + 跑下载」的责任收回到这里。 */
type OpenDownloadModal = () => void | Promise<void>;

function describeStateError(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : typeof cause === "string"
      ? cause
      : "未知错误";
}

export function useUpdateNotification() {
  const { checkOnly, info, error: stateError } = useAutoUpdater();

  /**
   * 触发一次主动检查并以通知形式反馈结果。
   *
   * @param openDownloadModal  点通知里「立即下载」时回调；
   *                           一般传入 () => updateModalRef.value?.open?.(true)
   */
  async function triggerCheck(
    openDownloadModal: OpenDownloadModal,
  ): Promise<void> {
    // 关闭前一张通知（如果有），避免新旧结果堆叠。
    notification.close(NOTICE_KEY);

    // 立刻弹「正在检查…」通知，duration: null 让它等结果出来再消。
    notification.open({
      key: NOTICE_KEY,
      type: "info",
      message: "检查更新中…",
      description: `正在连接 v${packageInfo.version} 的更新服务器。`,
      duration: null,
      placement: "topRight",
    });

    const status = await checkOnly();

    if (status === "up-to-date") {
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

    if (status === "error") {
      notification.open({
        key: NOTICE_KEY,
        type: "error",
        message: "检查更新失败",
        description: describeStateError(stateError.value?.cause),
        duration: 6,
        placement: "topRight",
      });
      return;
    }

    if (status === "available") {
      const v = info.value?.version ?? "";
      const buttons = h("div", { style: "display: flex; gap: 8px;" }, [
        h(
          "a-button",
          { onClick: () => notification.close(NOTICE_KEY) },
          { default: () => "稍后" },
        ),
        h(
          "a-button",
          {
            type: "primary",
            onClick: async () => {
              notification.close(NOTICE_KEY);
              try {
                await openDownloadModal();
              } catch (cause) {
                showError(describeStateError(cause));
              }
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
        description: "点击「立即下载」开始后台下载，或选「稍后」由你决定时间。",
        duration: null,
        placement: "topRight",
        btn: buttons as unknown as VNode,
      });
      return;
    }

    // 检查中 / downloading / ready / relaunching 等中间态不应从 triggerCheck 出现，
    // 走到这里说明状态机被外部污染 —— 关闭通知、给个兜底错误即可。
    notification.close(NOTICE_KEY);
  }

  return { triggerCheck };
}
