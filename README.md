# Tool Workbench

一款基于 **Tauri 2 + Vue 3 + TypeScript** 的桌面工具箱。将日常开发中零散的小工具聚合为一个轻量、原生、可离线使用的桌面应用，所有计算在本地完成，不上传任何数据。

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](./LICENSE)
[![Tauri 2](https://img.shields.io/badge/tauri-2.x-FFC131)](https://tauri.app/)
[![Vue 3](https://img.shields.io/badge/vue-3.x-4FC08D)](https://vuejs.org/)

## 功能概览

### 数据格式

| 工具 | 说明 |
| --- | --- |
| JSON 格式化 | 校验、格式化与压缩 JSON 数据 |
| YAML 格式化 | 整理 YAML 缩进，与 JSON 互转 |
| XML 格式化 | 校验、格式化与压缩 XML 文档 |
| TOML 格式化 | 校验、格式化与压缩 TOML 配置 |

### 编码转换

| 工具 | 说明 |
| --- | --- |
| 编码转换 | Base64 / URL / Hex / Unicode 编解码统一入口 |
| HTML 实体编解码 | 普通文本与 HTML 实体互转 |
| SQL 生成器 | 多行数据拼接为 SQL IN 片段 |

### 时间工具

| 工具 | 说明 |
| --- | --- |
| 时间工具 | 时间戳转换、时区转换、日期计算统一入口 |

### 文本工具

| 工具 | 说明 |
| --- | --- |
| 文本工具 | 转义、大小写转换与行处理统一入口 |
| 正则测试 | 验证正则表达式并查看匹配结果 |
| 文本 Diff | 按行对比差异，高亮新增与删除 |

### 二维码

| 工具 | 说明 |
| --- | --- |
| 二维码工具 | 生成任意内容二维码 / 识别图片中的二维码 |

## 技术栈

- **桌面壳**：[Tauri 2](https://tauri.app/)（Rust + 系统 WebView）
- **框架**：[Vue 3](https://vuejs.org/) + `<script setup lang="ts">`
- **构建**：[Vite 6](https://vitejs.dev/)
- **UI**：[Ant Design Vue 4](https://antdv.com/) + `@ant-design/icons-vue`
- **类型**：TypeScript 5.6（`strict`）
- **格式化**：[Prettier 3.8](https://prettier.io/)

## 快速开始

### 环境要求

- Node.js ≥ 18
- Rust 工具链（[rustup](https://rustup.rs/)）
- 系统依赖参见 [Tauri 官方前置条件](https://tauri.app/start/prerequisites/)

### 安装与运行

```bash
# 安装依赖
npm install

# 启动桌面开发环境
npm run tauri dev

# 仅前端开发服务器（http://localhost:1420）
npm run dev
```

### 构建

```bash
# 类型检查 + 生产构建
npm run build

# 打包桌面分发文件
npm run tauri build
```

## 目录结构

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

## 新增工具

1. 创建逻辑模块：`src/tools/<id>/<logic>.ts`
2. 创建页面：`src/pages/<id>/index.vue`（复用现有 `SplitPanel` / `PanelCard`）
3. 在 [`src/tools/registry.ts`](./src/tools/registry.ts) 中注册 — 填写 `category`、`icon`、`status`、`accent`
4. 如需新 Tauri 权限，更新 `src-tauri/capabilities/default.json`

## 贡献指南

详见 [AGENTS.md](./AGENTS.md)。

## License

[Apache-2.0](./LICENSE) © 2026 zz_zhi
