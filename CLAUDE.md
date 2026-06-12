# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在此仓库中工作提供指导。

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
- `src/tools/registry.ts` — 注册所有工具分类和工具定义。分类顺序即导航展示顺序。当前注册了 5 个工具，仅 JSON 格式化为 `"available"`，其余为 `"planned"`。
- `src/layouts/AppShell.vue` — 主布局，持有 `currentToolId` 状态（无 Vue Router），通过 `v-if` 条件渲染对应工具页面。

**新增工具的步骤**：
1. 在 `src/tools/registry.ts` 的 `tools` 数组中添加 `ToolDefinition`。
2. 在 `src/pages/<tool-id>/` 下创建页面组件。
3. 在 `AppShell.vue` 的模板中添加对应的 `v-if` 分支。

### 页面与组件

- `src/layouts/AppShell.vue` — 主布局：左侧导航抽屉 + 顶部状态栏 + 工具内容区。
- `src/components/` — 共享组件：`AppNavigation`（侧边栏）、`ToolActionBar`（操作按钮）、`ToolStatusBar`（顶部栏）、`ThemeMenu`（主题切换）、`CodePanel`（带搜索的文本编辑面板）、`SearchBar`。
- `src/pages/json-formatter/` — 唯一已实现的工具，双栏布局（输入 + JSON 树），支持格式化、压缩、搜索。
- `src/tools/json/jsonFormatter.ts` — 纯函数：`validateJson`、`formatJson`、`minifyJson`、`getTextStats`。

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
- 主题系统使用 Vuetify 内置的 system/light/dark 模式，无自定义颜色。
- 未发现 Cursor rules 或 GitHub Copilot instructions。
