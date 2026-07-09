import { createApp } from "vue";

import "ant-design-vue/dist/reset.css";
import "./assets/layout.css";

import App from "./App.vue";
import antdv from "./plugins/antdv";

/**
 * 前端应用入口。
 *
 * 只负责创建 Vue 应用并安装 ant-design-vue。
 * 主题、ConfigProvider 与全局 message 实例在 App 内部统一管理。
 */
const app = createApp(App);
app.use(antdv);
app.mount("#app");
