import "vuetify/styles";

import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi-svg";

/**
 * Vuetify 插件实例。
 *
 * 本项目的 UI 体系统一交给 Vuetify 管理：
 * - 主题只使用 Vuetify 内置的 system / light / dark。
 * - 颜色只使用组件的 color、type、variant 等语义属性。
 * - 图标使用 Vuetify 的内置 SVG 图标集，避免额外维护图标字体依赖。
 * - 不在这里定义十六进制颜色，避免形成项目自有色板。
 */
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    // 使用 Vuetify 提供的 SVG 图标集，确保 v-icon、prepend-icon 等组件能力可直接使用。
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    // 默认跟随系统主题，让桌面应用首次打开时自然匹配操作系统外观。
    defaultTheme: "system",
  },
});

export default vuetify;
