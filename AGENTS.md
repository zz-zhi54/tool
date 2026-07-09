# Repository Guidelines

本文档面向本仓库（Tauri 2 + Vue 3 + ant-design-vue + TypeScript 桌面应用 "tool"）的贡献者。项目由 Rust 后端（`src-tauri/`）和基于 Vite 构建的 Vue 前端组成，使用 ant-design-vue 作为 UI 组件库、`@ant-design/icons-vue` 提供图标。

## Project Structure & Module Organization

- `src/` —— Vue 3 前端代码。
  - `App.vue`：根组件，配置 antd 主题与 zhCN 文案。
  - `main.ts`：入口，**只负责挂载 Vue 与 ant-design-vue**，请保持精简。
  - `components/`：跨工具复用的 UI 组件（导航、侧边栏、面板容器、分栏、设置项、状态栏等）。
  - `composables/`：跨组件复用的响应式逻辑（主题、消息、窗口拖拽等）。
  - `layouts/`：页面外壳（`AppShell.vue`），**未使用 vue-router**，按当前工具 ID 在 import 的页面之间切换。
  - `pages/<tool-id>/`：每个工具或特殊页（`json-formatter`、`regex-tester`、`settings` 等）一个目录，至少含 `index.vue`。
  - `tools/<id>/`：每个工具的**纯逻辑模块**（不依赖 Vue / antd，便于复用与单测）。
  - `plugins/`、`utils/`、`types/`、`assets/`：antdv 插件入口、工具函数、共享类型、全局 CSS。
- `src-tauri/` —— Rust crate（`tool_lib` 库 + `tool` 二进制，入口 `src/lib.rs` / `src/main.rs`）、`tauri.conf.json`、`capabilities/default.json`、图标。
- `public/` —— 原样拷贝到构建产物的静态资源。
- 根目录配置：`vite.config.ts`、`tsconfig.json`、`.prettierrc`、`.prettierignore`。

## Tool Registry & Categories

`src/tools/registry.ts` 是工具清单的**唯一来源**，新增 / 删除 / 改顺序都从这里入手。当前 4 个分类共 19 个工具：

- **数据格式（`data-format`）**：JSON / YAML / XML / TOML 格式化。
- **编码转换（`encoding`）**：Base64 / URL / Hex / HTML Entity / Unicode Escape。
- **时间工具（`time`）**：时间戳 / 时区 / 日期计算。
- **文本工具（`text`）**：大小写 / 行处理 / 转义 / 文本 Diff / 正则 / SQL 生成 / UUID。

每条 `ToolDefinition` 含 `id`、`title`、`description`、`category`、`icon`（antd PascalCase 名）、`status: "available" | "planned"`、可选 `accent`。`status = "planned"` 的工具在导航中会降级展示。

新增工具的标准流程：

1. 在 `tools/<id>/` 实现纯逻辑。
2. 在 `pages/<tool-id>/index.vue` 实现 UI，并通过 `AppShell.vue` import + 加入切换分支。
3. 在 `utils/icons.ts` 添加 antd 图标 import。
4. 在 `registry.ts` 的 `toolCategories` / `tools` 中注册。
5. 如使用 `SplitPanel`、设置项或工具级偏好，参考下方「Settings & Persistence」约定。

## Settings & Persistence

应用把"用户偏好"和"页面 UI 状态"都通过 `localStorage` 持久化，**统一收敛在 `src/utils/storage.ts`** 里，业务代码不要直接 `localStorage.get/setItem`：

- 面板宽度：15 个工具各一个 key，形如 `<tool-id>:panel-percent`，集中维护在 `PANEL_KEYS`；`SplitPanel` 通过 `panel-key` prop 自动加载 / 保存。
- 主题：`useAppTheme` 在 `app:theme` 下持久化 `system` / `light` / `dark`，并通过 `<html data-theme>` 同步 CSS 变量。
- 工具级偏好：如正则 flags、SQL 引号风格，新增 key 时在 `storage.ts` 内集中声明。

设置页（`pages/settings/`）采用**数据驱动渲染**：`SETTINGS` + `SETTING_GROUPS` 在 `storage.ts` 里声明所有可配置项的元信息（key、label、defaultValue、control 类型：slider / toggle / checkboxes），`getSettings()` 给出当前快照，设置页只负责消费元数据并调用 `save` / `remove`。

新增一个用户偏好的标准流程：

1. 在 `storage.ts` 顶部声明 key 常量；如属于"工具 + 布局"，加入 `PANEL_KEYS`。
2. 在 `SETTINGS` 数组里追加一条 `SettingMeta`（`key` / `label` / `description` / `group` / `defaultValue` / `control`）。
3. 如需新分组，在 `SETTING_GROUPS` 里追加 `SettingGroupMeta`（可设 `parent` 形成嵌套）。
4. 业务侧用 `load(key, fallback)` 读取，写入仍走设置页 / `save` 即可。

## Build, Test, and Development Commands

所有命令均在仓库根目录执行。

- `npm run dev` —— 启动 Vite 开发服务器，监听 `http://localhost:1420`。
- `npm run tauri dev` —— 在 Vite 开发服务器之上启动 Tauri 桌面壳（实际调试推荐用这个）。
- `npm run build` —— 先执行 `vue-tsc --noEmit` 做类型检查，再产出生产构建到 `dist/`。
- `npm run tauri build` —— 打包成可分发的桌面应用。
- `npm run preview` —— 本地预览已构建的 `dist/`。
- `npm run tauri <sub>` —— 等价于 `npx tauri <sub>`（如 `tauri info`、`tauri icon`）。

## Coding Style & Naming Conventions

- Vue SFC 使用 `<script setup lang="ts">`，组件应保持小巧、可组合。
- TypeScript 启用 `strict`、`noUnusedLocals`、`noUnusedParameters`，提交前请清理未使用的 import 与参数。
- 缩进 2 空格，换行 LF。格式化交给 Prettier 3.8.4（默认 `.prettierrc`），提交前请跑 `npx prettier --write "src/**/*.{vue,ts,css,json}"`。
- 工具页面 ID（`pages/<tool-id>/`）使用 kebab-case；`tools/<id>/` 子目录使用简短 ID；Rust 标识符使用 `snake_case`。
- UI 组件全部来自 ant-design-vue + `@ant-design/icons-vue`；**不要引入 Vuetify / Element Plus 等其他组件库**，新增图标优先复用 antd 已有。
- 持久化走 `src/utils/storage.ts`，key 在文件顶部集中声明；面板宽度 key 形如 `<tool-id>:panel-percent`。

## Testing Guidelines

目前尚未接入自动化测试框架。修改后请通过 `npm run tauri dev` 进行人工验证。**PR / push 不再触发 CI**，所有类型检查与格式校验请在本地提交前自行跑一遍：

```bash
npx vue-tsc --noEmit
npx prettier --check "src/**/*.{vue,ts,css,json}"
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

> 仓库已开启 Dependabot 定期升级 npm / Cargo / GitHub Actions 依赖；版本变更的回归靠本地命令兜底。

新增测试时，推荐在 `src/` 下按 `*.spec.ts` 形式就近放置，并在 `package.json` 中添加 `vitest` 脚本；`src-tauri` 中的 Tauri 命令逻辑请使用标准的 `#[cfg(test)]` 模块覆盖。

## Commit & Pull Request Guidelines

- Commit 信息遵循 Conventional Commits：`<type>(<scope>): <subject>`。仓库历史中出现过的 type 包括 `feat`、`refactor`、`chore`、`docs`，scope 可省略（例如 `feat(tools): 新增 SQL 生成器工具`）。
- 主题行保持简短，中英双语皆可；较大改动请在 body 中说明「为什么」而不是「做了什么」。
- Pull Request 应描述改动内容、列出受影响的工具或模块，UI 类改动请附上截图，并关联相关 Issue。

## Agent-Specific Notes

- 不要编辑 `src-tauri/gen/` 或 `src-tauri/target/` 下由工具链自动生成的文件。
- 新增工具、设置项的完整流程请直接参考上文「Tool Registry & Categories」与「Settings & Persistence」。
- Tauri 权限声明位于 `src-tauri/capabilities/default.json`，新增插件命令时请同步扩展；当前窗口 `label` 为 `main`，不要随意改动。
- 主题切换：`useAppTheme` 是单一入口，组件优先消费 `themeStore.tokens` 而非写死颜色，CSS 侧通过 `data-theme` 变量响应。

## Release Process

仓库仅托管在 GitHub 上（`origin` → `https://github.com/zz-zhi54/tool`），无其它 remote。

### 日常提交

按上方 Commit & Pull Request Guidelines 进行；`git push` 直接同步到 GitHub。

### 准备发版

1. 在本地整理 `main` 上的提交（`git rebase -i` / `git reset --soft` 合并 WIP），保持历史清晰。
2. 同步更新 `package.json` 与 `src-tauri/Cargo.toml` 中的 `version`（保持三者一致）。
3. `git tag vX.Y.Z` 后 `git push origin main --tags`。
4. tag 触发 `.github/workflows/release.yml`，自动在 macOS / Windows / Linux 上构建并发布为 **Pre-release**。

### 注意事项

- 不要把 WIP / 调试 / `fix typo` 之类的提交直接推到 `main`。
- tag 一旦触发 release workflow，请勿再修改 `package.json`、`src-tauri/tauri.conf.json` 或 `src-tauri/Cargo.toml` 的 `version`，除非同时 bump tag。
- 安装包目前未签名 / 未公证（macOS 首次打开需在「系统设置 → 隐私与安全性」点击「仍要打开」），release body 已在 workflow 中说明。
