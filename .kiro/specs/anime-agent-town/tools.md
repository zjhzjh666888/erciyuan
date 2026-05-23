# Toolchain Contract / 工具链契约

> 本文件是 Pre-Slice（任务 1.1–1.2）的交付物之一，列出 `anime-agent-town` 在写第一行业务代码之前必须就位的**非 npm 工具**与**在线资源**。  
> 与根目录 `README.md` 的「工具链 / Toolchain」段落互为镜像，README 是面向团队成员的简短指引，本文件是面向 Pre-Slice 验收的契约清单。  
> **铁律**：本文件 + Asset Pipeline + `npm run check:assets` 三者全绿才允许进入 Slice 0（任务 11 起）。

---

## 1. 必装工具（Required）

### 1.1 Tiled Map Editor

| 字段 | 值 |
|---|---|
| 工具名 | Tiled Map Editor |
| 用途 | 编辑 `.tmj` Tilemap、合并 tileset、标注 Tile 自定义属性（如 `collide=true`） |
| 关联任务 | 1.1（安装与验证）/ 2.4（合并主 tileset）/ 2.5（编辑 64×64 主地图）/ 8.4（导出占位 PNG） |
| 关联需求 | R29.1（64×64 `.tmj`）、R29.2（tileset ≤ 512KB / Tile ≥ 64 种）、R29.5（`properties.collide` 标注）、R25.4（7 大分区不重叠） |
| 官方下载 | <https://www.mapeditor.org/download> |
| 推荐版本 | ≥ 1.9（默认 `.tmj` JSON 格式稳定） |
| 许可证 | GPL v2，免费 |
| Windows 默认路径 | `C:\Program Files\Tiled\tiled.exe` |
| macOS 默认路径 | `/Applications/Tiled.app/Contents/MacOS/Tiled` |
| Linux 默认路径 | `/usr/bin/tiled` 或 AppImage 自定路径 |

#### 验证清单（任务 1.1 验收点）

| # | 验收项 | 对应需求 |
|---|---|---|
| 1 | 能用 Tiled 打开 `.tmj` 文件（当前阶段可用 Tiled 自带样例 `examples/desert.tmx` 临时验证；Pre-Slice 完成后切换到仓库内的 `assets/tilemaps/town_64x64.tmj`） | R29.1 |
| 2 | 能新建 `Orthogonal` 地图、宽 × 高 = 64 × 64 Tile、Tile Size = 32 × 32 像素，并导出为 `.tmj` 后再次正确打开 | R29.1 |
| 3 | 能在 Tile 的 `Custom Properties` 面板添加 `collide` 字段（类型 `bool`） | R29.5 |
| 4 | 团队成员各自把本地安装路径写入根 `README.md` 的「工具链 / Toolchain」段落 | 任务 1.1 描述 |

#### CI 与启动校验关系

- Tiled 是 **GUI 工具**，不进入 CI 流水线，也不被 `npm run check:assets` 校验。
- 启动校验只校验 Tiled 的**产物**：`assets/tilemaps/town_64x64.tmj`、`assets/tilemaps/tileset_main.png` 是否存在、size 是否在阈值内、license 是否非空（详见 `design.md` §5 与 `requirements.md` R29）。
- 若团队某位成员暂时不需要编辑地图（例如只跑前端），允许跳过 Tiled 安装；但**必须保证仓库中的 `.tmj` 与 `.png` 已由其他成员产出并提交**。

---

### 1.2 像素图编辑器（二选一 + 在线兜底）

#### 1.2.A LibreSprite（首选）

| 字段 | 值 |
|---|---|
| 工具名 | LibreSprite |
| 用途 | 绘制 7 类萌宠 sprite sheet（idle / 4 方向 walk / 动作帧）、6 类 NPC 角色、7 大分区地标精灵、UI 图标 / 气泡 / 红条 / 异世界粒子，导出 PNG（保留透明通道） |
| 关联任务 | 1.2（安装与验证）/ 3.1（地标精灵）/ 4.4（萌宠帧）/ 5.3（NPC 帧）/ 6.3–6.8（UI 视觉资源）/ 8.1–8.3（异常场景插画 + fallback 角色） |
| 关联需求 | R29.6（萌宠帧位）、R29.7（命名 `mascot_{mascot_type}_{frame}.png`）、R29.8 / R29.9（NPC ≥ 17 帧）、R29.25 / R29.26 / R29.27 / R29.28 / R29.29 / R29.30（UI 资源）、R29.39 / R29.40 / R29.41（异常资源）、R29.48（命名规范）、R29.55（sprite sheet ≤ 256 KB）、R29.60（透明通道保留） |
| 官方下载 | <https://github.com/LibreSprite/LibreSprite> |
| 推荐版本 | ≥ 1.0-rc5 |
| 许可证 | GPL v2，免费 |
| Windows 默认路径 | `C:\Program Files\LibreSprite\libresprite.exe` |
| macOS 默认路径 | `/Applications/LibreSprite.app/Contents/MacOS/LibreSprite` |
| Linux 默认路径 | `/usr/bin/libresprite` 或 AppImage 自定路径 |

#### 1.2.B Aseprite（备选，付费）

| 字段 | 值 |
|---|---|
| 工具名 | Aseprite |
| 用途 | 同 LibreSprite。专业付费版，动画帧时间轴管理更顺手；适合已有 Steam 授权的成员 |
| 关联任务 | 同 1.2.A |
| 关联需求 | 同 1.2.A |
| 官方下载 | <https://store.steampowered.com/app/431730/Aseprite/>（Steam 商店，$19.99） |
| 推荐版本 | ≥ 1.3 |
| 许可证 | 商业付费，$19.99 |
| Windows 默认路径 | `C:\Program Files (x86)\Steam\steamapps\common\Aseprite\Aseprite.exe` |
| macOS 默认路径 | `/Applications/Aseprite.app/Contents/MacOS/aseprite` |
| Linux 默认路径 | Steam 安装路径下 `Aseprite/aseprite` |

#### 1.2.C Piskel（在线兜底）

| 字段 | 值 |
|---|---|
| 工具名 | Piskel |
| 用途 | 浏览器内简易 sprite 绘制 + 帧动画导出，无需安装；用于现场临时补帧或 GUI 工具失灵时的应急方案 |
| 关联任务 | 同 1.2.A（兜底用） |
| 关联需求 | 同 1.2.A（兜底用） |
| 官方地址 | <https://www.piskelapp.com> |
| 推荐版本 | 在线服务，自动最新 |
| 许可证 | 免费在线服务（Apache 2.0 开源版本：<https://github.com/piskelapp/piskel>） |
| 安装路径 | 不需要安装 |
| 注意事项 | 数据保存依赖账号登录到云端；**不可作为主要绘制工具**，仅作应急 |

#### 团队选用建议

| 场景 | 选择 | 理由 |
|---|---|---|
| 黑客松默认推荐 | LibreSprite | GPLv2 全免费，功能足以覆盖 sprite sheet + 透明通道 + 帧动画时间轴 |
| 预算允许 / 已有授权 | Aseprite | 付费版动画工作流更顺手，专业团队可购买 |
| 现场应急补帧 | Piskel | 浏览器即开即用，GUI 工具失灵时的兜底方案 |

#### 验证清单（任务 1.2 验收点）

| # | 验收项 | 对应需求 |
|---|---|---|
| 1 | 能新建画布（任意 32 × 32 / 64 × 64 像素）并启用 RGBA 透明背景 | R29.60 |
| 2 | 能导出为 PNG-32（带 Alpha 通道），用图片查看器或浏览器打开后**透明区域确实透明**而非白底 | R29.60、R29.6（萌宠透明立绘） |
| 3 | 能将多帧合并导出为 sprite sheet（横向或纵向排列），且每帧间距 / 网格严格符合 32 × 32 整数倍 | R29.6（4 方向 walk × 4 帧 = 16 帧）、R29.7（命名规范）、R29.55（sheet ≤ 256 KB） |
| 4 | 团队成员各自把本地安装路径写入根 `README.md` 的「工具链 / Toolchain」段落 | 任务 1.2 描述 |

#### CI 与启动校验关系

- 像素图编辑器（LibreSprite / Aseprite / Piskel）均为 **GUI 工具**，不进入 CI 流水线，也不被 `npm run check:assets` 校验。
- 启动校验只校验**产物**：`assets/sprites/**.png`、`assets/ui/**.svg|png`、`assets/fallback/**.png` 是否存在、`size_kb` 是否在阈值内（sprite sheet ≤ 256 KB / 单文件 ≤ 1 MB）、`license` 字段是否非空（详见 `design.md` §5 与 `requirements.md` R29.43–56）。
- 必须额外校验产物**透明通道保留**：导出的 PNG 文件 `Color Type` 应为 6（RGBA）或 4（Greyscale + Alpha），可由 `scripts/check-assets.ts` 在 hash 校验之外追加 PNG header 校验。
- 若团队某位成员暂时不需要绘制素材（例如只写后端代码），允许跳过安装；但**必须保证仓库中的 sprite 已由其他成员产出并提交**。

---

### 1.2.[Legacy Anchor]（旧锚点，已被 §1.2.A–C 取代）

> ⚠ 历史参考：以下 3 行 Markdown 锚点在任务 1.2 完成前是占位条目，现已由上方 §1.2.A–C 字段化契约取代。保留此区块仅用于 PR 评审定位，可在 Slice 0 启动后清理。

- **首选**：LibreSprite（GPLv2，免费）— <https://github.com/LibreSprite/LibreSprite>
- **备选**：Aseprite（$19.99）— <https://store.steampowered.com/app/431730/Aseprite/>
- **在线兜底**：Piskel — <https://www.piskelapp.com>

---

### 1.3 npm 启动钩子（predev / prebuild / predemo → check:assets）

| 字段 | 值 |
|---|---|
| 工具名 | npm lifecycle scripts（`pre*` 钩子） |
| 用途 | 在任意运行/构建/路演入口之前强制执行 `scripts/check-assets.ts` 启动校验，缺资产时立即中止，杜绝带病 demo |
| 关联任务 | 1.5（配置三个钩子）/ 1.4（钩子调用的校验脚本本体）/ 10.1（最终 DoD `check:assets:strict` 全绿） |
| 关联需求 | R29.50（启动校验失败立即中止）、R29.51（拒绝 silent fallback）、R29.52（license 字段非空） |
| 配置位置 | 仓库根 `package.json` 的 `scripts` 字段 |
| 实现 | `tsx scripts/check-assets.ts`（与 task 1.4 实现一致；design.md §5.2 给出标准形式） |

#### 钩子映射

| 钩子 | 触发命令 | 实际执行 | 校验模式 |
|---|---|---|---|
| `predev` | `npm run dev` | `npm run check:assets` | 宽松（manifest 为空时返回 0，便于 Pre-Slice 早期开发） |
| `prebuild` | `npm run build` | `npm run check:assets` | 宽松 |
| `predemo` | `npm run demo` | `npm run check:assets:strict` | **严格**（`STRICT_HASH=true`，hash 必须逐项匹配，杜绝路演前夕被改素材） |

#### 行为约定

1. 任一钩子退出码非 0 → 下游主命令（`dev` / `build` / `demo`）**必然中止**，不进入业务进程
2. `predemo` 强制 strict 模式（hash 比对）确保现场素材未被改动；`predev` / `prebuild` 走宽松模式以便资产采购阶段允许"manifest 已登记但 hash 暂未冻结"的中间态
3. 钩子由 npm 自身机制保证，无需额外脚手架；任何团队成员 `git pull` 后无需手动配置即生效
4. 当本地 `node_modules` 未安装（即 `tsx` 不可用），钩子会以 `Exit Code 1` 失败退出 — 这同样是合规行为（缺工具链 = 不该开工）

#### 验证清单（任务 1.5 验收点）

| # | 验收项 | 对应需求 |
|---|---|---|
| 1 | 仓库根 `package.json` 含 `predev` / `prebuild` / `predemo` 三个钩子，分别指向 `check:assets` / `check:assets` / `check:assets:strict` | R29.50 |
| 2 | 在缺资产（MANIFEST 缺失或不通过校验）状态下执行 `npm run dev`，命令链中止于 predev，主进程不启动 | R29.50、R29.51 |
| 3 | `predemo` 在严格模式下运行；任意 `required_for_demo=true` 资产 hash 不匹配即 fail | R29.52 |
| 4 | 钩子配置不依赖额外工具（无需 husky / lint-staged 等三方），仅靠 npm 原生 lifecycle | 任务 1.5 描述 |

#### CI 与启动校验关系

- npm 钩子是 **本地与 CI 共用** 的最前置守门人：开发机 `npm run dev` 与 CI `npm ci && npm run build` 都会触发对应 `pre*` 钩子
- CI 流水线另需显式追加 `npm run check:assets:strict` 以模拟 `predemo` 路径（详见 design.md §5 末段 CI 章节）
- 本地若设置环境变量 `npm_config_ignore_scripts=true` 可绕过钩子，但**严禁在 demo 现场或 CI 中启用**该变量（破坏 R29.50 的强约束）

---

## 2. 在线辅助工具（No Install Needed）

| 工具 | 用途 | 关联任务 |
|---|---|---|
| [Universal LPC Spritesheet Generator](https://lpc.4wall.ai/) | 快速合成 7 类萌宠的发色 / 瞳色 / 装饰 | 4.3 |
| [Kenney Asset Browser](https://kenney.nl/assets) | CC0 资产采购 | 2.1 / 6.2 |
| [OpenGameArt](https://opengameart.org/) | LPC RPG Pack / Pixel UI pack 等 CC-BY 资产采购 | 2.2 / 6.1 |
| [Pixabay Sound Effects](https://pixabay.com/sound-effects/) | 音效采购（Pixabay License，免费商用免署名） | 7.1–7.4 |
| [itch.io](https://itch.io) | Tiny RPG Town、PIPOYA 等免费/低价像素资产 | 2.3 / 4.2 |

---

## 3. 安装路径登记

请每位团队成员在根 `README.md` 的「工具链 / Toolchain」段落对应行填写本机安装路径。  
当任意成员的安装路径不在默认位置（例如 Windows 安装到非 `C:\Program Files`）时，必须**显式登记**以便排障。

填写格式示例：

```markdown
| 团队成员本地安装路径 | Alice: `C:\Program Files\Tiled\tiled.exe` / Bob: `D:\Tools\Tiled\tiled.exe` |
```

---

## 4. Pre-Slice DoD（任务 1.1 / 1.2 完成判定）

### 4.1 任务 1.1（Tiled）

| # | DoD 项 | 状态 |
|---|---|---|
| 1 | 根 `README.md` 已新增「工具链 / Toolchain」段落，包含 Tiled 字段化条目与验证清单 | ✅ 由本任务交付 |
| 2 | `.kiro/specs/anime-agent-town/tools.md` 已建立，作为 Pre-Slice 工具链契约的单一事实来源 | ✅ 由本任务交付 |
| 3 | 每位团队成员已在本机安装 Tiled ≥ 1.9 并完成 §1.1 验证清单 1–3 项 | ⏳ 由各成员完成后在 README 表格补全本地路径 |
| 4 | 任务 1.1 在 `tasks.md` 由 `[-]` 切到 `[x]` 状态 | ⏳ 由 orchestrator 在所有团队成员验收完成后负责 |

### 4.2 任务 1.2（像素图编辑器）

| # | DoD 项 | 状态 |
|---|---|---|
| 1 | 根 `README.md`「工具链 / Toolchain」段落已扩展为字段化的「LibreSprite / Aseprite / Piskel 三工具表」+ 团队选用建议 + 验证清单 | ✅ 由本任务交付 |
| 2 | `.kiro/specs/anime-agent-town/tools.md` §1.2.A / §1.2.B / §1.2.C 三段字段化契约已建立 | ✅ 由本任务交付 |
| 3 | 每位团队成员至少安装 LibreSprite / Aseprite / Piskel 三者之一并完成 §1.2 验证清单 1–3 项（重点：能导出带透明通道的 sprite sheet） | ⏳ 由各成员完成后在 README 表格补全本地路径 |
| 4 | 任务 1.2 在 `tasks.md` 由 `[-]` 切到 `[x]` 状态 | ⏳ 由 orchestrator 在所有团队成员验收完成后负责 |

