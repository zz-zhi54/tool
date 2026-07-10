# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Tool Workbench 是一个基于 **Tauri 2 + Vue 3 + TypeScript** 的桌面工具箱，目标是把日常开发、调试中零碎的小工具（格式化、编解码、时间、文本处理……）聚合为一个轻量、原生、可离线使用的桌面应用。所有计算都在前端本地完成，不上传任何数据。

## 常用命令

所有命令均在仓库根目录执行。

| 用途                                      | 命令                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| 安装依赖                                  | `npm install`                                                              |
| 启动前端 dev server（仅 Vite，1420 端口） | `npm run dev`                                                              |
| 启动桌面应用（推荐，含 Tauri 壳）         | `npm run tauri dev`                                                        |
| 类型检查 + 生产构建                       | `npm run build`（等价于 `vue-tsc --noEmit && vite build`，产物到 `dist/`） |
| 预览已构建产物                            | `npm run preview`                                                          |
| 打包桌面应用                              | `npm run tauri build`                                                      |
| Rust 单元测试                             | `cargo test`（在 `src-tauri/` 目录下）                                     |

**注意**：`package.json` 没有 `lint` / `test` 脚本，类型检查即 lint（由 `vue-tsc --noEmit` 完成），代码风格由 Prettier（3.8.4，2 空格缩进，LF 换行）保证；手动执行 `npx prettier --write .` 即可。

**环境要求**：Node.js ≥ 18，Rust 工具链（[rustup](https://rustup.rs/)），以及 Tauri 平台依赖，参见 [Tauri 官方前置条件](https://tauri.app/start/prerequisites/)。

## 目录与职责

```
.
├── src/                       # Vue 3 前端
│   ├── App.vue                # 根组件（ConfigProvider + AppShell）
│   ├── main.ts                # 入口（仅创建 app 并挂载 antdv 插件）
│   ├── components/            # 通用组件
│   │   ├── AppSidebar.vue     # 左侧 200/48px 折叠式侧边栏
│   │   ├── AppNavigation.vue  # 顶部分类下拉导航（含主题切换 + 设置入口）
│   │   ├── ToolStatusBar.vue  # 28px drag bar + 当前工具标题
│   │   ├── SplitPanel.vue     # 左右分栏容器，支持拖拽 + localStorage 持久化
│   │   ├── PanelCard.vue      # 工具页面通用卡片壳（标题栏 + 内容区）
│   │   └── SettingItem.vue    # 设置页单条控件（slider/toggle/checkbox）
│   ├── composables/           # 组合式函数
│   │   ├── useAppTheme.ts     # 主题 store（system/light/dark）+ token + bindSystemTheme
│   │   ├── useMessage.ts      # antd message 静态 API 的薄封装
│   │   └── useWindowDrag.ts   # Tauri startDragging() IPC 兜底
│   ├── layouts/AppShell.vue   # 应用主壳：drag bar + 侧边栏 + 主内容区
│   ├── pages/<tool-id>/       # 每个工具一个目录（含 index.vue 及可能的子组件）
│   ├── plugins/antdv.ts       # ant-design-vue 插件实例
│   ├── tools/                 # 工具**纯逻辑**模块（无 Vue 依赖）+ registry.ts
│   ├── types/tool.ts          # ToolDefinition / ToolCategory 共享类型
│   ├── utils/                 # 工具函数
│   │   ├── icons.ts           # icon 名 (PascalCase) → Vue 组件 查找表
│   │   └── storage.ts         # localStorage 集中管理 + SETTINGS 元数据
│   └── assets/layout.css      # CSS 变量（主题）+ 紧凑工具类（d-flex/pa-2 等）
├── src-tauri/                 # Rust crate
│   ├── src/
│   │   ├── main.rs            # 入口（仅调用 tool_lib::run）
│   │   └── lib.rs             # Tauri Builder + 插件 + 命令注册
│   ├── capabilities/default.json  # Tauri 权限声明
│   ├── icons/                 # 应用图标
│   ├── tauri.conf.json        # Tauri 配置（identifier: com.zhide.tool）
│   └── Cargo.toml
├── public/                    # 原样拷贝到 dist/ 的静态资源
├── index.html                 # Vite 入口（lang="zh-CN"）
├── vite.config.ts             # port 1420 strict + 忽略 src-tauri
├── tsconfig.json              # strict + noUnusedLocals + noUnusedParameters
└── package.json
```

## 架构核心约定

### 1. 工具 = 逻辑模块 + 页面 + 注册项

每个工具遵循**三层分离**：

- **`src/tools/<id>/`**：纯 TypeScript 逻辑（如 `json/jsonFormatter.ts`、`hex/hexCodec.ts`），**不依赖 Vue**，便于复用与单元测试。
- **`src/pages/<id>/`**：Vue 页面 + 子组件，调用上面的纯逻辑；通常用 `SplitPanel` + `PanelCard` 组合。
- **`src/tools/registry.ts`**：在 `toolCategories` 和 `tools` 中登记元信息（`id` / `title` / `description` / `category` / `icon` / `status` / `accent`）。**分类顺序即侧边栏与导航的展示顺序**，`accent` 缺省时回退到所属分类的 `accent`。

`src/layouts/AppShell.vue` 通过一长串 `<XxxView v-if="currentToolId === 'xxx'" />` 把所有页面硬编码进主内容区。**新增工具时必须同时在 `registry.ts` 和 `AppShell.vue` 的 v-if 列表中各加一行**。

### 2. 主题：单源响应式

主题由 `composables/useAppTheme.ts` 中的 `themeStore` 统一管理（`name` / `resolved` / `tokens`）。`bindSystemTheme()` 在 `App.vue` 启动时调用一次：

- `resolved` 同时驱动 `antdv` 的 `algorithm`（浅 / 深）和 `<html data-theme="...">`（CSS 变量）。
- `tokens` 提供可直接绑定到 `:style` 的颜色 hex 值。
- 持久化键：`app:theme`；系统主题变化时自动重算（仅当 `name === "system"`）。

`layout.css` 把 `--app-surface` / `--app-text` / `--app-border` 等定义为 CSS 变量，业务组件优先用变量；不能用变量时（如 `:style` 绑定）用 `themeStore.tokens.value.*`。

### 3. 图标按名解析

`registry.ts` 中 `icon` 字段保存的是字符串（PascalCase，如 `"CodeOutlined"`），由 `utils/icons.ts` 中的 `getIconByName` 解析为实际 Vue 组件并通过 `<component :is="..." />` 渲染。**新增图标需在 `icons.ts` 的 `REGISTRY` 追加映射**，否则会回退为 `null`。

### 4. 设置页数据驱动

`utils/storage.ts` 中的 `SETTINGS` 元数据 + `SETTING_GROUPS` 是设置页的**唯一数据源**：

- 三种控件：`slider` / `toggle`（按钮组）/ `checkboxes`。
- `pages/settings/index.vue` 通过 `getSettings()` 拉快照，`SettingItem.vue` 根据 `control.type` 分发。
- 各工具通过 `utils/storage.ts` 中的常量键（如 `PANEL_KEYS.jsonFormatter`）读写偏好；持久化由 `SplitPanel` 自动写入。

### 5. Tauri 集成非常薄

当前 Rust 端只有：

- `tauri-plugin-opener`（系统应用打开链接）
- 一个占位的 `greet` 命令（未在能力中暴露给前端使用）

`capabilities/default.json` 已声明 `core:default` / `core:window:default` / `core:window:allow-start-dragging` / `opener:default`。**新增 Tauri 命令时需要在 `lib.rs` 注册并相应扩展 `capabilities/default.json`**，同时前端通过 `@tauri-apps/api/core` 的 `invoke()` 调用。

窗口拖拽通过 `composables/useWindowDrag.ts` 的 `bindWindowDrag(el)` 桥接（非 Tauri 环境自动 no-op），CSS 用 `data-tauri-drag-region` / `data-tauri-no-drag` 区分拖动区与可点击控件。

## 新增一个工具的步骤

1. 在 `src/tools/<id>/` 下写纯逻辑模块（导出纯函数，类型可独立放在 `xxxTypes.ts`）。
2. 在 `src/pages/<id>/` 下写 Vue 页面（可复用 `SplitPanel` / `PanelCard`，从 `src/utils/storage` 取 `PANEL_KEYS` 常量）。
3. 在 `src/tools/registry.ts` 的 `toolCategories` 与 `tools` 中登记：指定 `category`、PascalCase `icon`（先在 `utils/icons.ts` 加入）、`status`、`accent`。
4. 在 `src/layouts/AppShell.vue` 的工具列表 `<XxxView v-if="..." />` 中加一行。
5. 若需要新的用户偏好，按 `SETTING_GROUPS` 分组追加到 `SETTINGS`。
6. 若需要 Tauri 命令：在 `src-tauri/src/lib.rs` 加 `#[tauri::command] fn ...` 并在 `capabilities/default.json` 扩权限。

## 提交与代码风格

- 遵循 [Conventional Commits](https://www.conventionalcommits.org/)：`feat(tools): 新增 SQL 生成器工具`、`fix(pages): 修复 ...`。
- 主题行保持简短，中英双语皆可；较大改动请在 commit body 中说明**为什么**而不是**做了什么**。
- 提交前运行 Prettier，清理未使用的 import / 参数（`noUnusedLocals` / `noUnusedParameters` 会卡住 build）。
- UI 类改动请在 PR 中附上截图。
- **不要手动编辑** `src-tauri/gen/` 或 `src-tauri/target/`（工具链生成产物）。
