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
│   │   ├── AppSidebar.vue     # 左侧 200/48px 折叠式侧边栏（含导航 + 主题切换 + 设置入口 + 更新按钮）
│   │   ├── ToolStatusBar.vue  # 28px drag bar + 当前工具标题
│   │   ├── SplitPanel.vue     # 上下分栏容器，8px 拖拽条，不持久化（每次打开固定 50/50）
│   │   ├── PanelCard.vue      # 工具页面通用卡片壳（标题栏 + 内容区）
│   │   ├── OutputPanel.vue    # 工具输出通用面板（只读终端风格输出区域）
│   │   ├── SettingItem.vue    # 设置页单条控件（slider/toggle/checkbox）
│   │   ├── UpdateModal.vue    # 应用更新弹窗（版本检测 + 下载进度 + 重启）
│   │   └── UpdateEntryButton.vue  # 侧边栏底部更新入口按钮（红点提示）
│   ├── composables/           # 组合式函数
│   │   ├── useAppTheme.ts     # 主题管理（name/resolved/tokens + 系统主题绑定）
│   │   ├── useAutoUpdater.ts  # 自动更新（后台检查 + 手动触发）
│   │   ├── useMessage.ts      # 消息提示封装
│   │   ├── useUpdateModal.ts  # 更新弹窗控制（providable OPEN_UPDATE_MODAL_KEY）
│   │   └── useWindowDrag.ts   # 窗口拖拽桥接（Tauri / 非 Tauri 自动 no-op）
│   ├── layouts/AppShell.vue   # 应用主壳：drag bar + 侧边栏 + 主内容区
│   ├── pages/<tool-id>/       # 每个工具一个目录（含 index.vue 及可能的子组件）
│   ├── plugins/antdv.ts       # ant-design-vue 插件实例
│   ├── tools/                 # 工具**纯逻辑**模块（无 Vue 依赖）+ registry.ts
│   ├── types/tool.ts          # ToolDefinition / ToolCategory 共享类型
│   ├── utils/                 # 工具函数
│   │   ├── icons.ts           # icon 名 (PascalCase) → Vue 组件 查找表
│   │   └── storage.ts         # localStorage 集中管理 + SETTINGS 元数据
│   └── assets/layout.css      # CSS 变量（主题）+ .app-textarea（PanelCard 内嵌 textarea 基底）
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

`src/layouts/AppShell.vue` 通过 `VIEWS` Record (`toolId → 视图组件`) + `computed` 动态匹配当前工具视图。**新增工具时必须在 `registry.ts` 和 `VIEWS` Record 中各加一行**。

### 2. 主题：单源响应式

主题由 `composables/useAppTheme.ts` 中的 `themeStore` 统一管理（`name` / `resolved` / `tokens`）。`bindSystemTheme()` 在 `App.vue` 启动时调用一次：

- `resolved` 同时驱动 `antdv` 的 `algorithm`（浅 / 深）和 `<html data-theme="...">`（CSS 变量）。
- `tokens` 还会被 `bindSystemTheme()` 同步写入 `<html>` 的 inline CSS 变量（`--app-surface` / `--app-text` / `--app-border` 等），业务组件可以直接读 `var(--app-*)` 而无需 `:style` 绑定 `themeStore.tokens.value.*`。
- 持久化键：`app:theme`；系统主题变化时自动重算（仅当 `name === "system"`）。

`layout.css` 定义 CSS 变量浅 / 深两套；业务组件优先用 `var(--app-*)`，不要写 inline style。

### 3. 图标按名解析

`registry.ts` 中 `icon` 字段保存的是字符串（PascalCase，如 `"CodeOutlined"`），由 `utils/icons.ts` 中的 `getIconByName` 解析为实际 Vue 组件并通过 `<component :is="..." />` 渲染。**新增图标需在 `icons.ts` 的 `REGISTRY` 追加映射**，否则会回退为 `null`。

### 4. 视觉与布局：优先交给 antdv（禁止 `<style scoped>` 与业务 CSS）

**核心规则**：项目既然引入了 `ant-design-vue`，所有**业务视觉**与**布局**都应该由 antdv 组件 + 组件 prop 表达。业务代码里不写手写 CSS。

具体禁止项：

- ❌ 禁止 `<style scoped>` 块（scoped / 非 scoped 都不行）。业务文件不能写任何 CSS 规则。
- ❌ 禁止 `class="..."`（任何自定义 class，layout.css 里的 `.app-textarea` 是历史遗留，仅用于 PanelCard 内部嵌入原生 `<textarea>` 时的"透明 + 无边框 + 等宽字体"基底，属于 antdv API 缺口补充）。
- ❌ 禁止 inline 视觉样式：`style="color: ..."` `style="font-size: ..."` `style="background: ..."` `style="border: ..."` `style="padding: ..."` 等表达视觉的 inline style。
- ❌ 禁止使用 `class="ant-xxx"` 这类 antdv 内部 class 当样式使用——应改用组件 prop。

允许的例外（必须保留 inline style / class 的场景）：

- ✅ **结构性 HTML 元素**：`<header>` `<section>` `<div>` `<span>` 本身合理使用是 DOM 结构不是 CSS。
- ✅ **Tauri 平台必需**：`data-tauri-drag-region` 属性、`-webkit-app-region` 样式（控制窗口拖拽）。
- ✅ **AntDV API 缺口的尺寸/位置约束**（**先告诉用户确认后再写**）：
  - `<a-layout>` 根布局的视口尺寸（`height: 100vh; width: 100vw`）
  - SplitPanel 可拖拽分隔条（`cursor / pointer-events / height: 8px`）
  - `<a-input>` / `<a-select>` / `<a-slider>` 在 `<a-flex>` 容器内填满剩余空间（先不写 `flex: 1`，看实际渲染；确实需要时再加）
- ✅ **AntDV 没有 prop 表达的结构性视觉**（如 ToolStatusBar 的 drag bar 固定 28px 高度、标题栏 padding / 底分隔线）——这种 inline style 描述"组件库的样式补充"，不是"业务视觉"，是允许的。

必须使用 antdv 替代的常见场景：

| 场景       | 错误写法                                                                    | 正确写法                                                                                                                     |
| ---------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 垂直堆叠   | `<div style="display: flex; flex-direction: column">`                       | `<a-flex vertical>`                                                                                                          |
| 居中       | `<div style="display: flex; align-items: center; justify-content: center">` | `<a-flex align="center" justify="center">`                                                                                   |
| 网格       | `<div style="display: grid; grid-template-columns: ...">`                   | `<a-row :gutter="8">` + `<a-col :span>`                                                                                      |
| 卡片       | `<div style="border + borderRadius + backgroundColor + padding">`           | `<a-card size="small">`                                                                                                      |
| 标签       | `<span style="background: red; color: white">`                              | `<a-tag color="red">`                                                                                                        |
| 标题       | `<span style="font-weight: 500">`                                           | `<strong>` 或 `<a-typography-text strong>`                                                                                   |
| 副文本     | `<span style="color: gray; font-size: 12px">`                               | `<a-typography-text type="secondary">`                                                                                       |
| 分隔线     | `<div style="border-top: 1px solid ...">`                                   | `<a-divider>`                                                                                                                |
| 文件上传   | `<label>` + `<input type="file">`                                           | `<a-upload-dragger>` 或 `<a-upload :beforeUpload>`                                                                           |
| 文本域     | `<textarea class="app-textarea">`                                           | 嵌入 PanelCard 内部时保留 `.app-textarea`（antdv `<a-textarea>` 在 PanelCard 内不能复现透明视觉）；独立场景用 `<a-textarea>` |
| 颜色选择器 | `<input type="color" style="width: 32px; height: 24px">`                    | `<input type="color">`（用浏览器默认尺寸）                                                                                   |

**新增 inline style / class 时的流程**：

1. 先查 antdv 组件有没有 prop 直接表达（例如 `<a-typography-text>` 有 `type` / `<a-tag>` 有 `color` / `<a-divider>` 等）。
2. 实在没有 prop 表达，且不属于 antdv API 缺口范围，**先告诉用户、确认后再写**。
3. 写完后用 grep 自查：

```bash
grep -n "style=" src/<改动文件>          # 检查 inline style 是否都是必要例外
grep -rn "<style" src/                    # 应无输出
grep -rn 'class="' src/ | grep -v "ant-"  # 仅 .app-textarea 合法
```

### 5. 设置页数据驱动

`utils/storage.ts` 中的 `SETTINGS` 元数据 + `SETTING_GROUPS` 是设置页的**唯一数据源**：

- 三种控件：`slider` / `toggle`（按钮组）/ `checkboxes`。
- `pages/settings/index.vue` 通过 `getSettings()` 拉快照，`SettingItem.vue` 根据 `control.type` 分发。
- 各工具通过 `utils/storage.ts` 中的常量键（如 `PANEL_KEYS.jsonFormatter`）读写偏好；持久化由 `SplitPanel` 自动写入。

### 6. Tauri 集成：仅插件，无自定义命令

当前 Rust 端注册了三个 Tauri 插件，无自定义 `#[tauri::command]`（仅一个占位 `greet` 未暴露给前端）：

- `tauri-plugin-opener` — 用系统默认应用打开链接
- `tauri-plugin-process` — `relaunch()` 更新后重启应用
- `tauri-plugin-updater` — 应用内自动更新（签名 + `latest.json` 端点）

`capabilities/default.json` 已声明所有插件的相应权限。**新增 Tauri 命令时需要在 `lib.rs` 注册并相应扩展 `capabilities/default.json`**，前端通过 `@tauri-apps/api/core` 的 `invoke()` 调用。

窗口拖拽通过 `composables/useWindowDrag.ts` 的 `bindWindowDrag(el)` 桥接（非 Tauri 环境自动 no-op），CSS 用 `data-tauri-drag-region` / `data-tauri-no-drag` 区分拖动区与可点击控件。

## 新增一个工具的步骤

1. 在 `src/tools/<id>/` 下写纯逻辑模块（导出纯函数，类型可独立放在 `xxxTypes.ts`）。
2. 在 `src/pages/<id>/` 下写 Vue 页面（可复用 `SplitPanel` / `PanelCard`，从 `src/utils/storage` 取 `PANEL_KEYS` 常量）。
3. 在 `src/tools/registry.ts` 的 `toolCategories` 与 `tools` 中登记：指定 `category`、PascalCase `icon`（先在 `utils/icons.ts` 加入）、`status`、`accent`。
4. 在 `src/layouts/AppShell.vue` 的 `VIEWS` Record 中添加 `"<tool-id>": XxxView` 映射。
5. 若需要新的用户偏好，按 `SETTING_GROUPS` 分组追加到 `SETTINGS`。
6. 若需要 Tauri 命令：在 `src-tauri/src/lib.rs` 加 `#[tauri::command] fn ...` 并在 `capabilities/default.json` 扩权限。

## 提交与代码风格

- 遵循 [Conventional Commits](https://www.conventionalcommits.org/)：`feat(tools): 新增 SQL 生成器工具`、`fix(pages): 修复 ...`。
- 主题行保持简短，中英双语皆可；较大改动请在 commit body 中说明**为什么**而不是**做了什么**。
- 提交前运行 Prettier，清理未使用的 import / 参数（`noUnusedLocals` / `noUnusedParameters` 会卡住 build）。
- UI 类改动请在 PR 中附上截图。
- **不要手动编辑** `src-tauri/gen/` 或 `src-tauri/target/`（工具链生成产物）。
