# Repository Guidelines

本文档面向本仓库（Tauri 2 + Vue 3 + TypeScript 桌面应用 "tool"）的贡献者。项目由 Rust 后端（`src-tauri/`）和基于 Vite 构建的 Vue/Vuetify 前端组成。

## Project Structure & Module Organization

- `src/` —— Vue 3 前端代码。
  - `App.vue`、`main.ts`：入口文件；`main.ts` 只负责挂载 Vue 与 Vuetify，请保持精简。
  - `components/`：可复用 UI 组件（`PanelCard.vue`、`SplitPanel.vue`、`ToolStatusBar.vue`、`AppNavigation.vue`）。
  - `layouts/`：页面外壳（`AppShell.vue`）。
  - `pages/<tool-id>/`：每个路由工具页一个目录（如 `json-formatter`、`regex-tester` 等）。
  - `tools/`：每个工具的纯逻辑模块，外加 `registry.ts`，它是工具 ID、分类、图标、顺序等信息的唯一来源。
  - `plugins/`、`utils/`、`types/`、`assets/`：Vuetify 配置、工具函数、共享类型、被 Vite 打包的静态资源。
- `src-tauri/` —— Rust crate（`tool_lib` 库 + `tool` 二进制）、`tauri.conf.json`、`capabilities/default.json`、图标。
- `public/` —— 原样拷贝到构建产物的静态资源。
- 根目录配置：`vite.config.ts`、`tsconfig.json`、`.prettierrc`。

## Build, Test, and Development Commands

所有命令均在仓库根目录执行。

- `npm run dev` —— 启动 Vite 开发服务器，监听 `http://localhost:1420`。
- `npm run tauri dev` —— 在 Vite 开发服务器之上启动 Tauri 桌面壳（实际调试推荐用这个）。
- `npm run build` —— 先执行 `vue-tsc --noEmit` 做类型检查，再产出生产构建到 `dist/`。
- `npm run tauri build` —— 打包成可分发的桌面应用。
- `npm run preview` —— 本地预览已构建的 `dist/`。

## Coding Style & Naming Conventions

- Vue SFC 使用 `<script setup lang="ts">`，组件应保持小巧、可组合。
- TypeScript 启用 `strict`，并启用了 `noUnusedLocals` 与 `noUnusedParameters`，提交前请清理未使用的 import 与参数。
- 缩进使用 2 个空格，换行符使用 LF。代码格式化由 Prettier 3.8.4（默认 `.prettierrc`）完成，提交前请运行 Prettier。
- 工具 ID 使用 kebab-case（如 `json-formatter`），Rust 标识符使用 `snake_case`（如 `tool_lib`），文件名与 ID 保持一致。

## Testing Guidelines

目前尚未接入测试框架。修改后请通过 `npm run tauri dev` 进行人工验证。新增测试时，推荐在 `src/` 下按 `*.spec.ts` 形式就近放置，并在 `package.json` 中添加 `vitest` 脚本；`src-tauri` 中的 Tauri 命令逻辑请使用标准的 `#[cfg(test)]` 模块覆盖。

## Commit & Pull Request Guidelines

- Commit 信息遵循 Conventional Commits：`<type>(<scope>): <subject>`。仓库历史中出现过的 type 包括 `feat`、`refactor`、`chore`、`docs`，scope 可省略（例如 `feat(tools): 新增 SQL 生成器工具`）。
- 主题行保持简短，中英双语皆可；较大改动请在 body 中说明「为什么」而不是「做了什么」。
- Pull Request 应描述改动内容、列出受影响的工具或模块，UI 类改动请附上截图，并关联相关 Issue。

## Agent-Specific Notes

- 不要编辑 `src-tauri/gen/` 或 `src-tauri/target/` 下由工具链自动生成的文件。
- 新增一个工具的流程：创建 `src/tools/<id>/` 与 `src/pages/<id>/`，然后在 `src/tools/registry.ts` 的 `toolCategories` 与 `tools` 中完成注册。
- Tauri 权限声明位于 `src-tauri/capabilities/default.json`，新增插件命令时请同步扩展该文件。

## Release Process

仓库仅托管在 GitHub 上（`origin` → `https://github.com/zz-zhi54/tool`），无其它 remote。

### 日常提交

按上方 Commit & Pull Request Guidelines 进行；`git push` 直接同步到 GitHub。

### 准备发版

1. 在本地整理 `main` 上的提交（`git rebase -i` / `git reset --soft` 合并 WIP），保持历史清晰。
2. `git tag vX.Y.Z` 后 `git push origin main --tags`。
3. tag 触发 `.github/workflows/release.yml`，自动在 macOS / Windows / Linux 上构建并发布为 **Pre-release**。

### 注意事项

- 不要把 WIP / 调试 / `fix typo` 之类的提交直接推到 `main`。
- tag 一旦触发 release workflow，请勿再修改 `src-tauri/tauri.conf.json` 或 `src-tauri/Cargo.toml` 的 `version`，除非同时 bump tag。
