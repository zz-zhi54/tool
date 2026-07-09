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
