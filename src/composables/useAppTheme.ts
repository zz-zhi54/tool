/**
 * 应用主题 composable。
 *
 * 主题名称：跟随系统 / 浅色 / 深色。
 *
 * 单一来源：所有状态都使用 ref/computed，确保改变 name 后
 * - `resolved` 重新计算（用于 antdv ConfigProvider 的 algorithm 选择）；
 * - `data-theme` 同步到 <html> 与 app-root，让 layout.css 里的 CSS 变量响应；
 * - `tokens` 直接给出每一组主题的颜色，便于组件用 :style 响应式绑定；
 * - localStorage 的持久化也会自动触发。
 */

import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from "vue";

export type ThemeName = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

/** 业务侧可直接绑定的颜色 token。 */
export interface ThemeTokens {
  surface: string;
  "surface-elevated": string;
  text: string;
  "text-muted": string;
  border: string;
  "border-strong": string;
}

const LIGHT_TOKENS: ThemeTokens = {
  surface: "#ffffff",
  "surface-elevated": "#ffffff",
  text: "rgba(0, 0, 0, 0.88)",
  "text-muted": "rgba(0, 0, 0, 0.55)",
  border: "rgba(0, 0, 0, 0.12)",
  "border-strong": "rgba(0, 0, 0, 0.2)",
};

const DARK_TOKENS: ThemeTokens = {
  surface: "#141414",
  "surface-elevated": "#1f1f1f",
  text: "rgba(255, 255, 255, 0.88)",
  "text-muted": "rgba(255, 255, 255, 0.65)",
  border: "rgba(255, 255, 255, 0.18)",
  "border-strong": "rgba(255, 255, 255, 0.28)",
};

const STORAGE_KEY = "app:theme";

function readStored(): ThemeName {
  if (typeof localStorage === "undefined") return "system";
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "dark") return raw;
  return "system";
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// 单一响应式源
const name = ref<ThemeName>(readStored());
const systemPrefersDarkRef = ref(systemPrefersDark());

const resolved = computed<ResolvedTheme>(() => {
  if (name.value === "system") {
    return systemPrefersDarkRef.value ? "dark" : "light";
  }
  return name.value;
});

/**
 * 当前主题的色板。
 *
 * 把 resolved 同时映射到 antdv 的 algorithm（一并交给 ConfigProvider）
 * 与一组原生 hex CSS 色值（供 :style 绑定使用）。
 */
const tokens = computed<ThemeTokens>(() =>
  resolved.value === "dark" ? DARK_TOKENS : LIGHT_TOKENS,
);

// 用户选择持久化
watchEffect(() => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, name.value);
});

/**
 * 全局主题 store。
 *
 * `name`、`resolved`、`tokens` 都是 Ref/ComputedRef，调用方需以 `.value` 读取。
 */
export const themeStore = {
  /** 用户选择的主题名称，可能为 "system"。 */
  name,
  /** 当前实际生效的主题。 */
  resolved,
  /** 当前主题的色板（响应 resolved）。 */
  tokens,
  /** 切换到指定主题名称。 */
  change(value: ThemeName): void {
    name.value = value;
  },
};

/**
 * 让响应式 data-theme 同步到 <html> 与 <body> 节点，
 * 并订阅系统主题变化（仅当 name === "system" 时影响 resolved）。
 *
 * 必须在根组件 (App.vue) 调用一次。
 */
export function bindSystemTheme() {
  // 同步 data-theme 到 <html>，让 layout.css 中的 CSS 变量生效。
  watchEffect(() => {
    if (typeof document === "undefined") return;
    const value = resolved.value;
    document.documentElement.dataset.theme = value;
    // 同步写到 <body>，避免某些嵌入式场景下 <html> 不应用样式。
    document.body.dataset.theme = value;
  });

  // 监听系统主题变化；同步更新 systemPrefersDarkRef，
  // 这样当 name === "system" 时 resolved 也会自动重算。
  onMounted(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      systemPrefersDarkRef.value = mq.matches;
    };
    mq.addEventListener("change", onChange);
    onBeforeUnmount(() => mq.removeEventListener("change", onChange));
  });
}

/**
 * 在组件内部访问主题状态。
 */
export function useAppTheme() {
  return themeStore;
}
