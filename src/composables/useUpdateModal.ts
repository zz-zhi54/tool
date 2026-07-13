/**
 * AppShell 提供的「打开更新 Modal」函数注入键。
 *
 * 由 AppShell 持有 UpdateModal 的 ref，provide 给所有子组件消费，
 * 避免 props / emit 穿透到子树的多个层级。
 *
 * 设计要点：
 * - 必须放在独立模块导出（不要在多个文件里各自 new Symbol），
 *   否则 inject 端拿到的会是另一个 Symbol 实例，找不到 provide 的值。
 * - Vue 的 InjectionKey 包装层让消费端拿到带类型的 `() => void`，无需断言。
 */
import type { InjectionKey } from "vue";

export const OPEN_UPDATE_MODAL_KEY: InjectionKey<() => void> =
  Symbol("open-update-modal");
