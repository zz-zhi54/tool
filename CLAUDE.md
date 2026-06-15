# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- 安装依赖：`npm install`
- 仅运行 Vite 前端：`npm run dev`
- 以开发模式运行桌面应用：`npm run tauri dev`
- 类型检查并构建前端：`npm run build`
- 预览已构建的前端：`npm run preview`
- 构建/打包 Tauri 应用：`npm run tauri build`
- 检查格式：`npx prettier . --check`
- 应用格式化：`npx prettier . --write`
- Rust 后端检查：`cd src-tauri && cargo check`
- Rust 后端测试：`cd src-tauri && cargo test`
- 按名称运行单个 Rust 测试：`cd src-tauri && cargo test <test_name>`

当前没有 npm `lint` 或 `test` 脚本。前端类型检查已包含在 `npm run build` 中，通过 `vue-tsc --noEmit` 执行。

## Architecture

这是一个 Tauri 2 桌面应用（"Tool Workbench"），前端使用 Vue 3 + TypeScript + Vuetify 4，后端使用 Rust。

### 启动流程

`index.html` → `src/main.ts`（创建 Vue 应用、注册 Vuetify 插件）→ `src/App.vue`（渲染 `AppShell`）。

### 工具注册模式

应用采用 **工具注册表** 模式组织导航和工具页面：

- `src/types/tool.ts` — 定义 `ToolCategoryId`、`ToolStatus`、`ToolCategory`、`ToolDefinition` 等类型。
- `src/tools/registry.ts` — 注册所有工具分类（`toolCategories`）和工具定义（`tools`）。分类顺序即导航展示顺序。当前注册了 6 个工具，均为 `"available"`。
- `src/layouts/AppShell.vue` — 主布局，持有 `currentToolId` 状态（无 Vue Router），通过 `v-if` 条件渲染对应工具页面。

**新增工具的步骤**：

1. 在 `src/tools/registry.ts` 的 `tools` 数组中添加 `ToolDefinition`。
2. 在 `src/tools/<tool>/` 下创建纯函数工具层（类型 + 逻辑）。
3. 在 `src/pages/<tool-id>/` 下创建页面组件。
4. 在 `AppShell.vue` 中导入并添加对应的 `v-if` 分支。
5. 如需持久化面板宽度，在 `src/utils/storage.ts` 的 `STORAGE_KEYS` 中添加对应 `StorageItem`。
6. 如需自定义图标，在 `src/plugins/vuetify.ts` 中导入对应 `@mdi/js` 图标并注册 alias。
7. 运行 `npm run build` 验证类型，`npx prettier src/ --write` 格式化。

### 导航与布局

布局采用 **双层顶部栏** 结构（无侧边导航抽屉）：

- `ToolStatusBar`（上方）— 当前工具标题、主题切换菜单、工具状态标签（"可用"/"本地处理"）。
- `AppNavigation`（下方）— 水平应用栏，按分类展示下拉菜单列出各分类下的工具，右侧固定"设置"入口。

布局逻辑全部在 `AppShell.vue` 中编排，工具页面切换通过改变 `currentToolId` 配合 `v-if` 实现。

### 页面与组件

- `src/layouts/AppShell.vue` — 主布局，编排双层应用栏 + 工具内容区。
- `src/components/AppNavigation.vue` — 水平导航栏：按分类分组的下拉菜单 + 设置入口。
- `src/components/ToolStatusBar.vue` — 顶部状态栏：当前工具标题 + 工具状态标签 + 主题切换。
- `src/components/SplitPanel.vue` — 左右可拖拽分栏容器。传 `storageItem` 则启用拖拽并将比例持久化到 localStorage；不传则固定 50/50。支持键盘方向键微调（±5%）。
- `src/components/PanelCard.vue` — 带标题栏（图标 + 文字 + 可选右侧操作插槽）的标准卡片壳，用于 base64-codec、regex-tester、sql-generator 等固定分栏工具页面。
- `src/pages/json-formatter/` — JSON 格式化，双栏布局（输入 + JSON 树视图）。子组件：`InputPanel.vue`、`JsonTreePanel.vue`（自带卡片壳）。
- `src/pages/yaml-formatter/` — YAML 格式化，与 JSON 格式化结构一致。依赖 `yaml` npm 包。子组件：`InputPanel.vue`、`YamlTreePanel.vue`（自带卡片壳）。
- `src/pages/base64-codec/index.vue` — Base64 编解码，左右分栏（输入 + 输出），支持交换。双向实时转换。
- `src/pages/timestamp-converter/index.vue` — 时间戳转换，自动识别秒/毫秒级时间戳与日期字符串，实时显示当前时钟。
- `src/pages/regex-tester/index.vue` — 正则测试，左侧输入正则+测试文本，右侧实时高亮匹配结果和捕获组。默认 flags 和输入内容通过 storage 持久化。
- `src/pages/sql-generator/index.vue` — SQL IN 生成器，将多行文本转换为 `IN ("val1", "val2", ...)` 语句。引号风格（`""`/`''`）通过 storage 持久化。
- `src/pages/settings/index.vue` — 设置页面，从 `ST storage_KEYS` 元数据自动渲染分组控件（滑块/切换按钮/复选框），支持单项重置和全部重置。
- `src/tools/<tool>/` — 每个工具对应一个纯函数目录，包含类型定义和工具函数，无 Vue 依赖。

### 存储系统（localStorage）

`src/utils/storage.ts` 是 localStorage 的集中管理层，设计要点：

- 每个持久化项声明为一个 `StorageItem<T>`，包含 key、默认值、分组、控件类型（slider/toggle/checkboxes）、校验/归一化函数、格式化函数。
- `STORAGE_KEYS` 对象统一定义所有存储项；设置页通过 `getAllStorageItems()` 动态渲染控件，无需手动编写表单。
- 当前存储项：5 个面板宽度比例（json/yaml/base64/regex/sql）、1 个正则默认 flags、1 个 SQL 引号风格。
- 新增存储偏好时：定义 `StorageItem` → 加入 `STORAGE_KEYS` → 设置页自动渲染。

### Rust 后端

- `src-tauri/src/main.rs` — 二进制入口，委托给 `tool_lib::run()`。
- `src-tauri/src/lib.rs` — 构建 Tauri 应用、注册插件，通过 `#[tauri::command]` 暴露命令。命令必须添加到 `tauri::generate_handler![...]` 中，前端才能通过 `invoke` 调用。
- 当前后端仅有一个 `greet` 示例命令；所有工具逻辑均在前端 TypeScript 中完成。

### Tauri 配置

- `src-tauri/tauri.conf.json` — 开发环境启动 `npm run dev` 并期望 Vite 运行在 `http://localhost:1420`；构建时运行 `npm run build` 并打包 `../dist`。
- `vite.config.ts` — 固定端口 `1420`（`strictPort: true`），支持可选 `TAURI_DEV_HOST` HMR，排除 `src-tauri`。
- `src-tauri/capabilities/default.json` — Tauri v2 主窗口权限：`core:default` + `opener:default`。

不要手动编辑生成物或构建产物：`node_modules/`、`dist/`、`src-tauri/target/`。已提交的 `src-tauri/gen/schemas/` 是 Tauri 生成的 schema，供配置文件和 capability 文件使用。

## Project notes

- 项目已配置 Prettier，配置文件为空对象（`.prettierrc` 是 `{}`），并忽略 `build` 和 `coverage`。
- 项目额外运行时依赖：`yaml`（YAML 解析/序列化）、`@mdi/js`（Material Design 图标 SVG path）。
- 图标系统使用 `@mdi/js` + Vuetify 自定义 alias（见 `src/plugins/vuetify.ts` 的 `customAliases`）。新增工具图标需在 `customAliases` 中注册，然后在 `ToolDefinition.icon` 中以 `$alias` 形式引用。
- 主题系统使用 Vuetify 内置的 system/light/dark 模式，默认跟随系统，无自定义颜色。
- 工具页面统一使用 `index.vue` 作为入口。
- 组件拆分原则：只被用一次且体量小的组件应内联到父组件，避免过度拆分。能用浏览器原生能力（如 Ctrl+F 搜索 textarea）的场景不要自定义实现。
- `yaml` 包的 `stringify` 不支持 `flowLevel` 选项，只支持 `indent`、`lineWidth` 等基本选项。
