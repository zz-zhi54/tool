/**
 * AppShell 提供的「打开更新 Modal」函数注入键。
 *
 * 由 AppShell 持有 UpdateModal 的 ref，provide 给所有子组件消费，
 * 避免 props / emit 穿透到子树的多个层级。
 *
 * 设计要点：
 * - 必须放在独立模块导出（不要在多个文件里各自 new Symbol），
 *   否则 inject 端拿到的会是另一个 Symbol 实例，找不到 provide 的值。
 * - Vue 的 InjectionKey 包装层让消费端拿到带类型的函数，无需断言。
 *
 * 动作类型：
 * - `openRelaunch` — 下载完成态，进入 modal 走重启流程；
 * - `openInfo` — 查看错误 / 详细信息 / 任何当前 status。
 *
 * Modal 本身不锁屏（不区分状态都能关），所以这两个动作的差别只在
 * modal 打开后默认聚焦的"主按钮"上：openRelaunch 默认展示「立即重启」，
 * openInfo 默认展示「关闭」。
 */

import type { InjectionKey } from "vue";

/** Modal 入口支持的动作。 */
export type UpdateModalAction = "openRelaunch" | "openInfo";

/**
 * Modal 入口函数签名。
 *
 * 注入端拿到的是 `(action?: UpdateModalAction) => void | Promise<void>`；
 * 不传 action 默认为 `openInfo`，便于旧调用点（sidebar / 设置页）平滑过渡。
 */
export type OpenUpdateModalFn = (
  action?: UpdateModalAction,
) => void | Promise<void>;

export const OPEN_UPDATE_MODAL_KEY: InjectionKey<OpenUpdateModalFn> =
  Symbol("open-update-modal");