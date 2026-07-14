# 仓库指南

基于 [Tauri 2](https://tauri.app/) + Vue 3 + TypeScript 的桌面工具箱。所有计算本地完成，不上传任何数据。

## 项目结构

```
src/                  # Vue 3 前端
  ├── pages/<id>/     # 每个工具一个页面目录
  ├── tools/<id>/     # 工具纯逻辑模块（registry.ts 为注册中心）
  ├── components/     # 通用组件（SplitPanel、PanelCard、AppSidebar 等）
  ├── composables/    # 组合式函数（主题、更新器、窗口拖拽）
  ├── layouts/        # 顶层布局 AppShell
  ├── plugins/        # Ant Design Vue 插件配置
  ├── types/          # 共享 TypeScript 类型
  └── utils/          # 工具函数（icons、storage、debounce）
src-tauri/            # Rust 后端（Tauri 2 crate）
  ├── src/            # 命令与入口（lib.rs、main.rs）
  ├── capabilities/   # Tauri 权限声明
  └── icons/          # 应用图标
```

## 构建与开发

完整命令参见 [README.md](./README.md)。常用命令：

| 命令                  | 用途                             |
| --------------------- | -------------------------------- |
| `npm install`         | 安装前端依赖                     |
| `npm run tauri dev`   | 启动桌面开发环境（Vite + Tauri） |
| `npm run build`       | 类型检查 + 生产构建              |
| `npm run tauri build` | 打包桌面分发文件                 |

Rust 端使用标准 Cargo 命令（在 `src-tauri/` 内执行 `cargo build`、`cargo fmt`、`cargo clippy`）。

## 编码规范

- **Prettier 3.8**：2 空格缩进，LF 换行。提交前务必运行。
- **TypeScript**：`strict` 模式，启用 `noUnusedLocals` 和 `noUnusedParameters`，保持 imports 和参数干净。
- **Vue SFC**：使用 `<script setup lang="ts">` + Composition API。
- **Rust**：遵循 `cargo fmt` 和 `cargo clippy`。
- **命名**：`.vue` 文件用 PascalCase，composables 和 utils 用 camelCase。
- **工具模块**：纯逻辑放 `src/tools/<id>/`，页面放 `src/pages/<id>/`。新工具在 `src/tools/registry.ts` 中注册。

## 提交与 PR 规范

- 遵循 [Conventional Commits](https://www.conventionalcommits.org/)：`feat(tools):`、`fix(ui):`、`refactor(layout):`、`chore(release):`、`docs:`。
- 主题行保持简短。正文说明 **为什么** 而非做了什么。
- 禁止提交构建产物：`src-tauri/gen/`、`src-tauri/target/`、`dist/`、`node_modules/`。
- CI 仅在 push 到 `main` 分支时触发；PR 不自动构建。Dependabot 负责依赖版本更新。
- 提交 PR 前同步 bump 版本号：`package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` 三处保持一致（前端与 Rust 端必须同步）。
- 提交 PR 前同步 bump 版本号后，必须跑 `git-cliff -o CHANGELOG.md` 重新生成 release notes，并把生成结果包含在同一次 PR 里。`release.yml` 的 `Extract CHANGELOG section` step 会按 `tauri.conf.json` 的版本号 `grep -q "^## \[X.Y.Z\]" CHANGELOG.md`，找不到就 fail。CHANGELOG 文件头注明由 git-cliff 自动生成，手写段落会被覆盖，不要手维护。

## 新增工具

1. 创建逻辑模块：`src/tools/<id>/<logic>.ts`
2. 创建页面：`src/pages/<id>/index.vue`（复用现有 `SplitPanel` / `PanelCard`）
3. 在 `src/tools/registry.ts` 中注册 — 填写 `category`、`icon`、`status`、`accent`
4. 如需新 Tauri 权限，更新 `src-tauri/capabilities/default.json`
5. 工具放入某个分类后自动继承该分类的 `accent`，除非显式覆盖

## Settings & Persistence

设置项的元信息集中在 [`src/utils/storage.ts`](./src/utils/storage.ts)：

- `SETTINGS`：所有用户偏好的元数据（`key` / `label` / `description` / `group` / `defaultValue` / `control`）。
- `SETTING_GROUPS`：设置页顶层分组的元数据，支持 `parent` 嵌套。
- `getSettings()`：返回当前快照（值、默认值、是否被修改等），设置页直接消费。
- `load(key, fallback)` / `save(key, value)`：底层 localStorage 读写，对 JSON 解析失败做容错。

新增一个用户偏好的标准流程：

1. 在 `src/utils/storage.ts` 顶部声明 key 常量（如 `export const FOO_KEY = "foo:bar"`），并在 `SETTINGS` 追加一条 `SettingMeta`。
2. 如需新的设置分组，往 `SETTING_GROUPS` 追加 `SettingGroupMeta`（可填 `parent` 嵌套）。
3. 业务代码用 `load(FOO_KEY, fallback)` 读取初始值，用 `save(FOO_KEY, value)` 持久化。
4. 控件类型在 `SettingMeta.control` 声明（`toggle` / `checkboxes`），UI 由 `SettingItem` 自动渲染；恢复默认调 `remove(key)`。

只有「真正的用户偏好」走这条路径；UI 临时状态（分栏比例、侧边栏折叠等）由组件自己管理，不进入设置页。

## Agent 专用说明

- **UI 框架优先**：项目已集成 Ant Design Vue 4 + `@ant-design/icons-vue`。优先使用 antdv 原生组件和图标，避免手写 CSS / JS 实现已有的组件能力。如果确实需要自定义样式或脚本，必须先告知用户并说明原因。
- 优先查阅官方文档而非凭经验猜测；改动 Tauri / Vue / Ant Design Vue API 前先看文档。
- 严格控制改动范围，不超出显式要求的部分。
- 官方示例未使用的特性不要添加。
