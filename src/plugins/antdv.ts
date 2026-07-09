import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css";

import type { App, Plugin } from "vue";

/**
 * ant-design-vue 插件实例。
 *
 * 主题与 Locale 由根组件使用 ConfigProvider 注入（参见 src/App.vue），
 * 这里只负责注册组件 + 全局 reset 样式，
 * 并把静态 message API 挂到全局方便 useMessage composable 使用。
 */
const antdv: Plugin = {
  install(app: App): void {
    app.use(Antd as unknown as Plugin);
  },
};

export default antdv;
