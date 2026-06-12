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

这是一个 Tauri 2 桌面应用，前端使用 Vue 3 + TypeScript，并通过 Vite 构建；后端使用 Rust。

- `src/main.ts` 创建 Vue 应用，并把 `App.vue` 挂载到 `index.html` 中的 `#app`。
- `src/App.vue` 当前包含模板 UI、组件状态和样式。它通过 Tauri 的 `invoke` API 调用 Rust：`invoke("greet", { name })`。
- `src-tauri/src/main.rs` 是原生二进制入口；它委托给 `tool_lib::run()`。
- `src-tauri/src/lib.rs` 构建 Tauri 应用、注册插件，并使用 `#[tauri::command]` 暴露 Rust 命令。命令必须添加到 `tauri::generate_handler![...]` 中，前端才能通过 `invoke` 调用。
- `src-tauri/tauri.conf.json` 将前端和原生应用连接起来。开发环境会启动 `npm run dev`，并期望 Vite 运行在 `http://localhost:1420`；构建时会运行 `npm run build`，并打包 `../dist`。
- `vite.config.ts` 针对 Tauri 做了配置：固定开发服务器端口为 `1420`，启用 `strictPort: true`，支持可选的 `TAURI_DEV_HOST` HMR 设置，并将 `src-tauri` 排除在 Vite 文件监听之外。
- `src-tauri/capabilities/default.json` 控制 Tauri v2 中主窗口的权限；当前启用了默认 core 权限和 opener 插件权限。

不要手动编辑生成物或构建产物：`node_modules/`、`dist/`、`src-tauri/target/`。已提交的 `src-tauri/gen/schemas/` 是 Tauri 生成的 schema，供配置文件和 capability 文件使用。

## Project notes

- README 当前说明这是默认的 Tauri + Vue + TypeScript 模板，并推荐使用 VS Code 搭配 Vue Official、Tauri 和 rust-analyzer 扩展。
- 项目已配置 Prettier，配置文件为空对象（`.prettierrc` 是 `{}`），并忽略 `build` 和 `coverage`。
- 未发现 Cursor rules 或 GitHub Copilot instructions。
