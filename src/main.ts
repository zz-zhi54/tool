import { createApp } from "vue";

import "@fontsource/roboto/100.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto/900.css";

import "@fontsource/roboto/100-italic.css";
import "@fontsource/roboto/300-italic.css";
import "@fontsource/roboto/400-italic.css";
import "@fontsource/roboto/500-italic.css";
import "@fontsource/roboto/700-italic.css";
import "@fontsource/roboto/900-italic.css";

import App from "./App.vue";
import vuetify from "./plugins/vuetify";

/**
 * 前端应用入口。
 *
 * 这里只负责创建 Vue 应用并安装 Vuetify，具体主题、组件和指令配置
 * 统一放在 plugins/vuetify.ts，避免入口文件随着功能增加而变重。
 */
createApp(App).use(vuetify).mount("#app");
