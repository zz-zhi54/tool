# GitHub Actions Workflows 解读

本文档解释本仓库 `.github/workflows/` 下两个 workflow 的作用与协作方式。修改 workflow 时请同步更新本 README。

---

## 1. `ci.yml` —— 持续集成

### 1.1 触发与并发

- 对 `main` 分支的 **PR** 和 **直接 push** 都会触发。
- 同一 ref 的多次 push 会**取消正在跑的旧 run**（`concurrency.cancel-in-progress: true`），节省 runner 时间。

### 1.2 两个并行 job

| Job | Runner | 负责范围 |
|---|---|---|
| `frontend` | `ubuntu-latest` | Vue/Vuetify 前端 |
| `backend` | `ubuntu-22.04` | Rust/Tauri 后端 |

两个 job **没有依赖关系**，并行验证。

### 1.3 Frontend Checks

| 步骤 | 作用 |
|---|---|
| `actions/checkout@v5` | 拉代码 |
| `actions/setup-node@v5` + Node 24 + `cache: 'npm'` | Node 环境，自动缓存 `~/.npm` |
| `npm ci` | 基于 lockfile 的干净安装 |
| `npx vue-tsc --noEmit` | TypeScript 类型检查 |
| `npx prettier --check "src/**/*.{vue,ts,css,json}"` | 校验格式，**失败 = CI 红** |

> Prettier 范围**只覆盖 `src/`**，不查 `*.md`、不查 `.yml`、`Cargo.toml`。

### 1.4 Backend Checks

| 步骤 | 作用 |
|---|---|
| `actions/checkout@v5` | 拉代码 |
| `dtolnay/rust-toolchain@stable`（含 rustfmt + clippy） | Rust 工具链 |
| `apt-get install ...` | Tauri GTK/WebKit 依赖（见下） |
| `actions/cache@v4` | 缓存 cargo registry + `src-tauri/target` |
| `mkdir -p dist` | 占位 dist 目录 |
| `cargo fmt --check --manifest-path src-tauri/Cargo.toml` | Rust 格式校验 |
| `cargo clippy ... -- -D warnings` | Clippy，**任何警告视为错误** |

**Linux 系统依赖**（Tauri 2 运行时所需的 C 库）：

```
build-essential pkg-config libssl-dev           # 编译工具链
libgtk-3-dev librsvg2-dev libayatana-appindicator3-dev   # GTK 3 + 托盘
libwebkit2gtk-4.1-dev   → fallback 4.0         # WebView 内核
libsoup-3.0-dev         → fallback 2.4          # HTTP/WebView 网络栈
```

`||` fallback 是为了兼容新旧 Ubuntu runner 镜像。

---

## 2. `release.yml` —— 发版流水线

### 2.1 触发与权限

- 触发条件：**推送形如 `v*` 的 tag**（`git push origin v0.1.0`）。
- `permissions.contents: write` 让 `github-actions[bot]` 能创建 Release、上传资产。

### 2.2 并发

同一个 tag 被 force-push 时，旧 run 自动取消，避免双重发布。

### 2.3 平台矩阵

| platform | args | 产物 |
|---|---|---|
| `macos-15` | `--target universal-apple-darwin` | 同时打 arm64 + x86_64 |
| `windows-2022` | `''` | 默认 x86_64 |
| `ubuntu-22.04` | `''` | 默认 x86_64 |

### 2.4 步骤

| 步骤 | 作用 | 平台 |
|---|---|---|
| `actions/checkout@v5` (`fetch-depth: 0`) | 拉**完整 git 历史** | 全部 |
| `actions/setup-node@v5` + Node 24 + npm cache | Node 环境 | 全部 |
| `dtolnay/rust-toolchain@stable` | Rust 工具链 | 全部 |
| `rustup target add aarch64-apple-darwin x86_64-apple-darwin` | macOS 双架构 target | only macOS |
| `apt-get install ...` | 同 CI 的 Linux 依赖 | only Linux |
| `npm ci` | 安装前端依赖 | 全部 |
| `Compute bare version` | `${GITHUB_REF_NAME#v}` 去掉 `v` 前缀写入 env | 全部 |
| `tauri-apps/tauri-action@v0` | **核心：打包 + 发布 Release** | 全部 |

### 2.5 `tauri-action@v0` 在幕后做什么

1. 校验 tag 与 `tauri.conf.json` 的 `version` 一致。
2. 跑 `beforeBuildCommand: npm run build`，产出 `dist/`。
3. 跑 Tauri 打包，按 `matrix.args` 决定 target。
4. 上传所有产物到 GitHub Release，写入 releaseBody。
5. 把 release 标记为 **Pre-release**。

### 2.6 `releaseBody` 模板

```
## Tool v0.1.0
首个公开预发布版本。
### 下载
文件名格式: tool_<version>_<target>.<ext>
- macOS (Universal): tool_0.1.0_universal.dmg
- Windows (x64):     tool_0.1.0_x64-setup.exe / .msi
- Linux (x64):       tool_0.1.0_amd64.AppImage / .deb / rpm
### 已知问题
- macOS 未签名/未公证
- Windows / Linux 未签名
- 未启用应用内自动更新
```

`${{ env.RAW_VERSION }}` 由 `Compute bare version` 步骤写入，下一次推 tag 时自动套用。

---

## 3. 协作流程图

```
本地提交 PR / push ─────────────────► ci.yml 触发
                                           │
                  ┌────────────────────────┼────────────────────────┐
                  ▼                                                  ▼
         Frontend Checks                                       Backend Checks
                  │                                                  │
                  └─────────────────────┬────────────────────────────┘
                                        ▼
                                   PR 合入 / main push

推送 v* tag ────────────────────────► release.yml 触发
                                           │
        ┌─────────────────┬───────────────┼─────────────────┐
        ▼                 ▼               ▼                 ▼
    macos-15          windows-2022     ubuntu-22.04       (并行)
        │                 │               │
        └────────┬────────┴───────────────┘
                 ▼
        tauri-action 创建/更新 GitHub Release，
        上传所有产物，标记为 Pre-release
```

---

## 4. 已知/潜在问题

| # | 问题 | 影响 | 建议 |
|---|---|---|---|
| 1 | Prettier glob 只查 `src/**/*.{vue,ts,css,json}` | `.md` / `.yml` / `Cargo.toml` 改坏了 CI 不会发现 | 要么扩 glob，要么另起 markdownlint job |
| 2 | macOS / Windows 产物未签名、未公证 | 用户首次打开会被 Gatekeeper / SmartScreen 拦 | 长期：Apple Developer ID + Windows EV 证书 |
| 3 | `contents: write` 只在 release job 给了，CI 不需要写权限 | ✅ 符合最小权限原则 | 保持 |

---

## 5. 当前 release 产物清单（v0.1.0 参考）

| 平台 | 文件 |
|---|---|
| macOS | `tool_0.1.0_universal.dmg`、`tool_universal.app.tar.gz`（自动更新用） |
| Windows | `tool_0.1.0_x64-setup.exe`（NSIS）、`tool_0.1.0_x64_en-US.msi` |
| Linux | `tool_0.1.0_amd64.AppImage`、`tool_0.1.0_amd64.deb`、`tool-0.1.0-1.x86_64.rpm` |

命名规则：`{productName}_{version}_{target}.{ext}`，由 `tauri.conf.json` 的 `productName` 和 `version` 决定。

> macOS 的 `.app.tar.gz` 例外，是不带版本号的（用于 Tauri's auto-updater）。
