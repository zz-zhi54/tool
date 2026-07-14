# Changelog

此项目的所有显着更改都将记录在此文件中。请参阅 [常规提交](https://www.conventionalcommits.org/) 了解提交指南。

> 本文件由 [git-cliff](https://git-cliff.org/) 按 Conventional Commits 从 git 历史生成，配置见 [`cliff.toml`](./cliff.toml)。
> 修改后请用 `git-cliff --output CHANGELOG.md` 重新生成。
> `release.yml` 在发布时会按当前 `Cargo.toml` 的 version 提取对应 `## [X.Y.Z]` 段落作为 GitHub Release body。

---

## [0.1.9] - 2026-07-14

### Changed

- 发布日志改为真实版本内容：新增 `CHANGELOG.md`（由 [git-cliff](https://git-cliff.org/) 按 Conventional Commits 从 git 历史生成）+ 本仓库 `cliff.toml` 配置；`.github/workflows/release.yml` 在 `tauri-action` 之前新增一步，按当前 `Cargo.toml` 的 version 提取本文件中 `## [X.Y.Z]` 段落，写入多行输出并作为 `releaseBody` 注入，替换此前写死在 workflow 中的固定模板。

### Notes

- 本版本主要用于测试应用内自动更新流程（v0.1.8 → v0.1.9）。
- 功能层面无新特性；0.1.9 与 0.1.8 行为一致，仅变更发布说明的来源。

## [0.1.8](https://github.com/zz-zhi54/tool/compare/v0.1.7..v0.1.8) - 2026-07-14

### Bug Fixes

- **(updater)** 检查下载全后台，通知进度，最后通知安装 - ([b8f3f79](https://github.com/zz-zhi54/tool/commit/b8f3f79278f36f6a84bc179a60f998d1eb3f760a)) - zz_zhi

### Documentation

- **(agents)** 记录 PR 前同步 bump 版本号的规范 - ([76d988d](https://github.com/zz-zhi54/tool/commit/76d988d09277fc3ad724cdfd901a02273a6c56a8)) - zz_zhi
- 添加设置版本信息截图 - ([879bb17](https://github.com/zz-zhi54/tool/commit/879bb176bf0cb6cc4d0fca1d1de6a37a70b73953)) - zz_zhi

### Features

- **(settings)** 展示当前与远程版本 - ([952ee88](https://github.com/zz-zhi54/tool/commit/952ee8880498d61bf335e7a8a84fde3f45fa02ad)) - zz_zhi

### Miscellaneous Chores

- **(release)** 0.1.7 → 0.1.8 - ([e5f172e](https://github.com/zz-zhi54/tool/commit/e5f172ee21bc390f5e8416a51a830ad5bfd47b6c)) - zz_zhi

### Refactoring

- **(settings)** 移除「关于」块，纯设置项列表 - ([384001a](https://github.com/zz-zhi54/tool/commit/384001a9929f36da14bb3c9fb7f2aa897e91e645)) - zz_zhi
- **(updater)** 砍掉 modal/手动入口，仅保留启动静默检查+后台下载+重启通知 - ([f831f69](https://github.com/zz-zhi54/tool/commit/f831f6947004f13705b5a04b42c113fd90b2035d)) - zz_zhi

---

## [0.1.7](https://github.com/zz-zhi54/tool/compare/v0.1.6..v0.1.7) - 2026-07-13

### Bug Fixes

- **(ui)** 用 KeepAlive 缓存工具页状态，切换页面不再清空 - ([88d7196](https://github.com/zz-zhi54/tool/commit/88d71962e9f73b766f439b25d008e6263e4e6775)) - zz_zhi

### Miscellaneous Chores

- **(release)** 0.1.6 → 0.1.7 - ([1dec28b](https://github.com/zz-zhi54/tool/commit/1dec28be0a0e88a49c6c354d101f9b8f7b91ce9d)) - zz_zhi

---

## [0.1.6](https://github.com/zz-zhi54/tool/compare/v0.1.5..v0.1.6) - 2026-07-13

### Bug Fixes

- **(ci)** remove invalid updater windows.installMode - ([021481e](https://github.com/zz-zhi54/tool/commit/021481e3d47149368f9c7977796338230d599ba2)) - zz_zhi
- **(updater)** 二次 check 卡死 + 分离后台/主动检查 + 0.1.6 - ([693df7c](https://github.com/zz-zhi54/tool/commit/693df7cd7d628edb35c7e3a57c947f322c43bc2c)) - zz_zhi
- **(updater)** 修复更新流程 5 个边界问题 - ([3a162d4](https://github.com/zz-zhi54/tool/commit/3a162d46d28fdcbf254ca88a3be060aaf22d637b)) - zz_zhi

### Documentation

- **(claude)** 同步 CLAUDE.md 与实际代码架构 - ([97ffb41](https://github.com/zz-zhi54/tool/commit/97ffb4178092ded63c188d0d7b8993e090f9c52e)) - zz_zhi
- 拆分仓库文档为 AGENTS.md + 简化 README - ([03330e6](https://github.com/zz-zhi54/tool/commit/03330e6ee338a9a7a00b3e9758a6398d02b29e5b)) - zz_zhi

### Features

- **(encoding)** encoding-hub 集成 UUID 生成器 - ([d6ebabd](https://github.com/zz-zhi54/tool/commit/d6ebabd95b8739b93d2e9906b7a10f7e1aa908c2)) - zz_zhi
- **(icons)** 重做应用图标为暖橙红拟物工具主题 - ([94a5f57](https://github.com/zz-zhi54/tool/commit/94a5f576e583ec01e21d73aa56b1edda68f6a890)) - zz_zhi

### Miscellaneous Chores

- **(cleanup)** 移除孤立代码与未使用的 opener 插件链 - ([da902da](https://github.com/zz-zhi54/tool/commit/da902da5933626689f6c7665511eba1da5f069db)) - zz_zhi
- **(cleanup)** 移除孤立资源与未使用的开发依赖 - ([4632207](https://github.com/zz-zhi54/tool/commit/46322078f83efda82c34dc72483c92831acc46b8)) - zz_zhi

### Refactoring

- **(tools)** 大小写标签改为中文 - ([8d02c61](https://github.com/zz-zhi54/tool/commit/8d02c610e4518f121eb1fe05fe2a9a7a524730a0)) - zz_zhi

---

## [0.1.5](https://github.com/zz-zhi54/tool/compare/v0.1.4..v0.1.5) - 2026-07-13

### Bug Fixes

- **(updater)** modal 打开即触发检查 + endpoint 国内 fallback + 0.1.5 - ([3374e89](https://github.com/zz-zhi54/tool/commit/3374e896028e48fe6b573c907cf13090c4b18723)) - zz_zhi

---

## [0.1.4](https://github.com/zz-zhi54/tool/compare/v0.1.3..v0.1.4) - 2026-07-13

### Bug Fixes

- **(layout)** 重构顶部 drag bar，按 Tauri + 平台条件渲染并修复 hub 页面挤压 - ([9c6a132](https://github.com/zz-zhi54/tool/commit/9c6a132943fb1ca04c266f37374ccc9fdc15fe06)) - zz_zhi
- **(qrcode)** slider 在 flex 容器内填满剩余空间 - ([90da5e7](https://github.com/zz-zhi54/tool/commit/90da5e73b9cbc3c0384faddca5a2848f9ccb99bc)) - zz_zhi
- **(ui)** sidebar 底部三按钮去 strong，文本格式一致 - ([1b62a58](https://github.com/zz-zhi54/tool/commit/1b62a5895abe8a93d3ac1df5bdcd6c21d428cbe5)) - zz_zhi
- **(ui)** sidebar 底部更新按钮宽度对齐 - ([169c3a6](https://github.com/zz-zhi54/tool/commit/169c3a669bb19984b48deee92fbf81d815780f6d)) - zz_zhi
- **(updater)** sidebar 更新按钮按状态分支显示文案 - ([bcb32a4](https://github.com/zz-zhi54/tool/commit/bcb32a4485948f565258353d8e57b7af05465524)) - zz_zhi

### Features

- **(qrcode)** 引入二维码生成与识别模块 - ([a1b1d51](https://github.com/zz-zhi54/tool/commit/a1b1d515d47351e6c0079bd6c7a0c054a20a11fa)) - zz_zhi
- **(settings)** 设置页新增「关于」块 +「检查更新」入口 - ([9d8f109](https://github.com/zz-zhi54/tool/commit/9d8f109912a84517cd67fc1f6fc31f00fcbc486b)) - zz_zhi
- **(tools)** 合并独立工具为多合一 hub - ([1beb43a](https://github.com/zz-zhi54/tool/commit/1beb43a2612877c782f80d5c0c5f532c6a7be0c2)) - zz_zhi
- **(tools)** 恢复文本 Diff 工具并支持本地文件选择 - ([cd9cecb](https://github.com/zz-zhi54/tool/commit/cd9cecb4407d6628f8b9da56db0d1d3d1128e0f1)) - zz_zhi
- **(updater)** 应用内更新入口与 Modal - ([ea32c0b](https://github.com/zz-zhi54/tool/commit/ea32c0bca2b02b3a9fbaca8731437f6fd5232293)) - zz_zhi
- **(utils)** 新增通用 debounce 工具 - ([36bba23](https://github.com/zz-zhi54/tool/commit/36bba23d3f9750f44a10c20ce2a9047bae1e66be)) - zz_zhi

### Miscellaneous Chores

- **(release)** 0.1.3 → 0.1.4 - ([844ad92](https://github.com/zz-zhi54/tool/commit/844ad926265dc95e2f1de9a5a2fc6f904920c1ce)) - zz_zhi

### Refactoring

- **(components)** SplitPanel 改为上下分栏并移除持久化与设置项 - ([b1a140d](https://github.com/zz-zhi54/tool/commit/b1a140d6ed401e12e07e65646d8fd1fa98cfe9cf)) - zz_zhi
- **(layout)** AppShell 改为路由表 + 侧边栏窄屏自动折叠 - ([9c4e7fa](https://github.com/zz-zhi54/tool/commit/9c4e7fae943cfa525a654ed8bcd1de4e343c54a0)) - zz_zhi
- **(pages)** 删除已被多合一 hub 取代的独立 page - ([10bfc13](https://github.com/zz-zhi54/tool/commit/10bfc13643131c06784978927ce718adb6f66931)) - zz_zhi
- **(ui)** 移除手写 CSS 工具类，改用 antdv 原生组件 - ([670ee5f](https://github.com/zz-zhi54/tool/commit/670ee5f400012b3594dbf92f08375ee2b15fee34)) - zz_zhi
- **(ui)** 全量迁移至 antdv 原生组件，移除手写 CSS 与 inline 样式 - ([e92946e](https://github.com/zz-zhi54/tool/commit/e92946e28846bc64d9760401c188b8ff759dcba8)) - zz_zhi

---

## [0.1.3](https://github.com/zz-zhi54/tool/compare/v0.1.2..v0.1.3) - 2026-07-10

### Bug Fixes

- **(macos)** release workflow 显式 --no-sign 跳过 codesign - ([2d7b2a8](https://github.com/zz-zhi54/tool/commit/2d7b2a8581eef985a57d37015b98498ed7212578)) - zz_zhi

### Miscellaneous Chores

- **(release)** v0.1.3 - ([eb6deac](https://github.com/zz-zhi54/tool/commit/eb6deacb8d2cf7be0d550ffa7d2a16f5b2bd3bcf)) - zz_zhi

---

## [0.1.2](https://github.com/zz-zhi54/tool/compare/v0.1.1..v0.1.2) - 2026-07-10

### Bug Fixes

- **(updater)** pubkey 字段改用原始 base64 字符串 - ([3f44f99](https://github.com/zz-zhi54/tool/commit/3f44f99885aa264336ef8e45a817a7d883027181)) - zz_zhi

### Features

- **(updater)** 集成 Tauri 应用内自动更新 - ([7b075c9](https://github.com/zz-zhi54/tool/commit/7b075c94bb78bd062b905b7a2f7504ba0ef389c2)) - zz_zhi

### Ci

- **(release)** 缓存 Rust 编译产物 - ([cb8fe84](https://github.com/zz-zhi54/tool/commit/cb8fe844f045027550ef98674a0a93bf66666545)) - zz_zhi
- **(release)** tag 检查 step 强制使用 bash shell - ([436bd11](https://github.com/zz-zhi54/tool/commit/436bd11968bbc9d79d7596bfa228924f6f1c3713)) - zz_zhi
- **(release)** 对齐 tauri-action 官方 README，使用 **VERSION** 占位符与 draft 发布 - ([d07ab6e](https://github.com/zz-zhi54/tool/commit/d07ab6eb6af1cfd1e282b93479810179a998e89e)) - zz_zhi

---

## [0.1.1](https://github.com/zz-zhi54/tool/compare/v0.1.0..v0.1.1) - 2026-07-09

### Documentation

- **(agents)** simplify release process section to GitHub-only - ([c908e94](https://github.com/zz-zhi54/tool/commit/c908e946c088712ce806b90d2fcf352f5dd2bde7)) - zz_zhi
- **(agents)** 重写 AGENTS.md 反映 antd 迁移和项目当前结构 - ([be62214](https://github.com/zz-zhi54/tool/commit/be62214dad64df98fb901ec9ab700069c5e263fb)) - zz_zhi
- **(ci)** 新增 .github/workflows/README.md 解释 ci.yml 与 release.yml - ([de52bd4](https://github.com/zz-zhi54/tool/commit/de52bd4780df020d7abc7f2bc0ef5daf6797f210)) - zz_zhi

### Miscellaneous Chores

- **(release)** v0.1.1 + 简化 release workflow 为 main push 触发 - ([e07a970](https://github.com/zz-zhi54/tool/commit/e07a9700f328bdb629f19fb555f10476b2cf0766)) - zz_zhi
- 移除 GitHub Actions CI/CD 流程改由本地验证 - ([7c0d601](https://github.com/zz-zhi54/tool/commit/7c0d6019895f989fcd5ad300a2bba029de12753e)) - zz_zhi
- 更新仓库指引与 prettier 忽略规则 - ([ff7444d](https://github.com/zz-zhi54/tool/commit/ff7444d4622dc34b8fec5141052035827382de73)) - zz_zhi

### Style

- prettier 格式化 src/assets/layout.css - ([b1fedb0](https://github.com/zz-zhi54/tool/commit/b1fedb01ff6eceac8e6704808ec61c20bb073b79)) - zz_zhi

### Ci

- **(release)** 新增 GitHub Actions release workflow - ([7a3a31c](https://github.com/zz-zhi54/tool/commit/7a3a31c64150904320a62e31db9ad991213f1a2c)) - zz_zhi
- 升级 Node 20 → 24 并锁定 macos-15 解决 runner 弃用警告 - ([631981e](https://github.com/zz-zhi54/tool/commit/631981edb86803a3c1ee564eff3141de14fc2b6e)) - zz_zhi
- 添加 dependabot 配置覆盖 cargo/npm/github-actions - ([19e0544](https://github.com/zz-zhi54/tool/commit/19e054423a24ac2d46dbd052ba3c127c378d0db5)) - zz_zhi
- CI trigger 加入 dev 分支 - ([922dab4](https://github.com/zz-zhi54/tool/commit/922dab43b41328673c4ccffd0d77da5ca7fa3c73)) - zz_zhi
- 重新触发 CI 验证 dev 分支 trigger - ([79e083d](https://github.com/zz-zhi54/tool/commit/79e083d45d983d36931375c806900775fa447b33)) - zz_zhi

---

## [0.1.0] - 2026-07-09

### Documentation

- claude - ([e577d93](https://github.com/zz-zhi54/tool/commit/e577d936292adc8ee1aedda5db4b5ecaa5aa9be9)) - zz_zhi
- update claude.md with navigation and storage documentation - ([cf241b9](https://github.com/zz-zhi54/tool/commit/cf241b98eaf6e81127e68db98963c25d3528ab26)) - zz_zhi

### Features

- **(tools)** 新增yaml/base64/timestamp/regex工具 - ([ad599d9](https://github.com/zz-zhi54/tool/commit/ad599d9bb069a6b19e8cb064283fb5237d576625)) - zz_zhi
- **(tools)** 新增 SQL 生成器工具 - ([154cd1c](https://github.com/zz-zhi54/tool/commit/154cd1ccae714b163cc1ed0ff9bc32531f02e77c)) - zz_zhi
- **(tools)** 新增 SQL 生成器工具 - ([14631b7](https://github.com/zz-zhi54/tool/commit/14631b73a79d877280bd8de8fa91df0c88f24721)) - zz_zhi
- init - ([769cde3](https://github.com/zz-zhi54/tool/commit/769cde332d79e25a4e191df1353855a5c67a2ac8)) - zz_zhi
- init - ([8cea2db](https://github.com/zz-zhi54/tool/commit/8cea2db8e089a49901eebc2cbe7cc7ed7a055ff7)) - zz_zhi
- init - ([db840b7](https://github.com/zz-zhi54/tool/commit/db840b7ffc3456a1a6ae3c87c63dac47bf725870)) - zz_zhi
- init - ([b646951](https://github.com/zz-zhi54/tool/commit/b6469518d5744a66f2a35901856dd7d6932abe5f)) - zz_zhi
- init - ([a7ca88c](https://github.com/zz-zhi54/tool/commit/a7ca88c96e8670307c6207c543fb53e4a36b7e82)) - zz_zhi

### Miscellaneous Chores

- **(release)** v0.1.0 首发版本 - ([c01956c](https://github.com/zz-zhi54/tool/commit/c01956ccf093481754d7c12fe62bf69a2b5b8978)) - zz_zhi
- **(tauri)** increase default window dimensions - ([4f7e13f](https://github.com/zz-zhi54/tool/commit/4f7e13fe0fb38aa08af5180b66851be8801561ff)) - zz_zhi

### Refactoring

- **(ui)** 重构组件结构，内联主题切换并简化搜索功能 - ([c768b3c](https://github.com/zz-zhi54/tool/commit/c768b3c6d83db91ad9c0a9a88d7711e263408627)) - zz_zhi

<!-- generated by git-cliff -->
