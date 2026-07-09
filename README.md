# Tool Workbench

一款基于 **Tauri 2 + Vue 3 + TypeScript** 的桌面工具箱。目标是把日常开发、调试中零碎的小工具（格式化、编解码、时间、文本处理……）聚合成一个轻量、原生、可离线使用的桌面应用，所有计算都在本地完成，不上传任何数据。

> 仓库地址：[github.com/zz-zhi54/tool](https://github.com/zz-zhi54/tool)

## ✨ 功能概览

所有工具都通过 [`src/tools/registry.ts`](./src/tools/registry.ts) 注册，分类顺序即为侧边栏 / 导航的展示顺序。

### 数据格式

| 工具 | 说明 |
| --- | --- |
| JSON 格式化 | 校验、格式化和压缩 JSON 数据 |
| YAML 格式化 | 整理 YAML 缩进，并支持与 JSON 互转 |
| XML 格式化 | 校验、格式化和压缩 XML 文档 |
| TOML 格式化 | 校验、格式化和压缩 TOML 配置 |

### 编码转换

| 工具 | 说明 |
| --- | --- |
| Base64 编码 | 在普通文本和 Base64 之间快速转换 |
| URL 编解码 | 在普通文本和百分号编码之间互转 |
| Hex 编解码 | 在普通文本和十六进制字节之间互转 |
| HTML 实体编解码 | 在普通文本和 HTML 实体之间互转 |
| Unicode 转义 | 在普通文本和 `\uXXXX` 转义之间互转 |

### 时间工具

| 工具 | 说明 |
| --- | --- |
| 时间戳转换 | 在时间戳和可读日期之间互相转换 |
| 时区转换 | 将时间戳转换到任意时区的本地时间 |
| 日期计算器 | 计算两个日期间的间隔，或对日期做加减运算 |

### 文本工具

| 工具 | 说明 |
| --- | --- |
| 正则测试 | 验证正则表达式并查看匹配结果 |
| SQL IN 生成器 | 将多行数据转换为 SQL `IN` 语句 |
| 转义工具 | 在 JS / JSON / 正则 / SQL / Shell 之间转义 |
| UUID 生成器 | 批量生成 v1 / v4 / v7 版本的 UUID |
| 文本 Diff | 对比两段文本的差异，按行高亮 |
| 大小写转换 | 在 `UPPER` / `lower` / `camel` / `snake` 等命名风格间转换 |
| 行处理 | 对多行文本做排序、去重、去空行与 `trim` |

## 🧱 技术栈

- **桌面壳**：[Tauri 2](https://tauri.app/)（Rust + 系统 WebView）
- **前端框架**：[Vue 3](https://vuejs.org/) + `<script setup lang="ts">` SFC
- **构建工具**：[Vite 6](https://vitejs.dev/)
- **UI 组件库**：[Ant Design Vue 4](https://antdv.com/) + `@ant-design/icons-vue`
- **类型系统**：TypeScript 5.6（`strict` + `noUnusedLocals` + `noUnusedParameters`）
- **格式化**：[Prettier 3.8.4](https://prettier.io/)（2 空格缩进，LF 换行）
- **本地能力**：`@tauri-apps/plugin-opener`（系统应用打开链接）

## 📁 目录结构

```text
.
├── src/                     # Vue 3 前端
│   ├── App.vue              # 根组件
│   ├── main.ts              # 入口（仅做挂载，保持精简）
│   ├── components/          # 通用组件（SplitPanel、PanelCard、AppSidebar 等）
│   ├── composables/         # 组合式函数（主题、消息、窗口拖拽）
│   ├── layouts/             # 页面外壳 AppShell
│   ├── pages/<tool-id>/     # 每个工具一个目录
│   ├── plugins/             # Ant Design Vue 等插件配置
│   ├── tools/               # 工具纯逻辑模块 + registry.ts（注册中心）
│   ├── types/               # 共享类型
│   ├── utils/               # 工具函数（icons、storage）
│   └── assets/              # 静态资源
├── src-tauri/               # Rust crate
│   ├── src/                 # 入口与命令实现
│   ├── capabilities/        # Tauri 权限声明（default.json）
│   ├── icons/               # 应用图标
│   └── tauri.conf.json
├── public/                  # 原样拷贝到构建产物的静态资源
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

更详细的工程约定请阅读 [AGENTS.md](./AGENTS.md)。

## 🚀 开发与构建

所有命令均在仓库根目录执行。

### 环境要求

- Node.js（建议 ≥ 18）
- Rust 工具链（[rustup](https://rustup.rs/)）
- Tauri 平台依赖，参见 [Tauri 官方前置条件](https://tauri.app/start/prerequisites/)

### 安装依赖

```bash
npm install
```

### 启动开发服务器（仅前端）

```bash
npm run dev
# 默认监听 http://localhost:1420
```

### 启动桌面应用（推荐）

```bash
npm run tauri dev
# 启动 Vite 开发服务器，并打开 Tauri 桌面壳
```

### 类型检查 + 生产构建

```bash
npm run build
# 等价于：vue-tsc --noEmit && vite build
# 产物输出到 dist/
```

### 打包桌面应用

```bash
npm run tauri build
# 输出位置由 src-tauri/tauri.conf.json 决定
```

### 本地预览已构建产物

```bash
npm run preview
```

## 🧩 新增一个工具

1. 在 `src/tools/<id>/` 下创建纯逻辑模块。
2. 在 `src/pages/<id>/` 下编写 Vue 页面（可复用 `SplitPanel` / `PanelCard`）。
3. 在 `src/tools/registry.ts` 的 `toolCategories` 与 `tools` 中完成注册：
   - 指定 `category`、`icon`（Ant Design Vue 图标名，PascalCase）、`status`、`accent`。
   - `accent` 缺省时回退到所属分类的 `accent`。
4. 若需要新的 Tauri 插件命令，记得在 `src-tauri/capabilities/default.json` 中扩展权限。

## 🤝 贡献指南

- 遵循 [Conventional Commits](https://www.conventionalcommits.org/)：`feat(tools): 新增 SQL 生成器工具`。
- 主题行保持简短，中英双语皆可；较大改动请在 commit body 中说明「为什么」而不是「做了什么」。
- 提交前运行 Prettier，清理未使用的 import / 参数。
- UI 类改动请在 PR 中附上截图，并关联相关 Issue。
- 不允许手工编辑 `src-tauri/gen/` 或 `src-tauri/target/` 等工具链生成产物。

## 📄 License

本项目基于 **Apache License 2.0** 开源，详见根目录的 [LICENSE](./LICENSE) 文件。

```text
Copyright 2026 zz_zhi

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

