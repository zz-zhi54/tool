/**
 * 轻量消息通知 composable。
 *
 * 内部封装 antd `message` 全局实例。antd 的静态 message API 在
 * ConfigProvider 切换算法时仍由 antd 内部维护展示逻辑，无需 explicit
 * 注入上下文，因此业务侧只需要调用这几个函数。
 */

import { message } from "ant-design-vue";

type MessageType = "success" | "error" | "warning" | "info";

export function showMessage(content: string, type: MessageType = "info"): void {
  message.open({
    content,
    type,
    duration: 2,
  });
}

export function showSuccess(content: string): void {
  showMessage(content, "success");
}

export function showError(content: string): void {
  showMessage(content, "error");
}

export function showWarning(content: string): void {
  showMessage(content, "warning");
}

export function showInfo(content: string): void {
  showMessage(content, "info");
}

/**
 * 弹一条持续显示（duration: 0）的 message，可由同 key 后续调用更新文本。
 *
 * 用在后台进度这类需要持续更新、不希望被自动消失打断的场景。
 *
 * @param key    唯一 key，重复调用同 key 会**就地更新**文本
 *               （antdv 的 message.open 在 key 相同时不会新建一条）。
 */
export function showPersistent(content: string, key: string): void {
  message.open({ content, duration: 0, key });
}

/** 主动销毁指定 key 的 message（用于下载完成后清掉进度提示）。 */
export function destroyMessage(key: string): void {
  message.destroy(key);
}
