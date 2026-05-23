# 次元萌宠小镇 / anime-agent-town

> 抖音黑客松赛道 1「AI 体验：刷到懂你的瞬间」参赛作品

「次元萌宠小镇」是一个由二维码 / 抖音视频流弹框驱动的多智能体像素小镇 Web 应用。在 Stanford Generative Agents 与 a16z AI Town 的范式之上，叠加 7 类萌宠人格识别、个性化二次元内容推荐、同好搭子匹配与 AI 引导内容发布的完整闭环。

- **A 链路（路演主推）**：视频流弹框 → 测一测 → 萌宠生成 → 个性化推荐 → 进入小镇
- **B 链路（小镇深度）**：扫码 QR → 角色生成 → 执念赋予 → Smallville 风像素小镇 → 智能体自治 → 仪表盘审计

## 工具链 / Toolchain

> 本段落是 Pre-Slice 任务 1.1 / 1.2 的交付物之一。每位团队成员请在对应工具行的「团队成员本地安装路径」列填入本机安装路径，便于排障。
> 完整字段化契约见 [`.kiro/specs/anime-agent-town/tools.md`](./.kiro/specs/anime-agent-town/tools.md)。

### 1. Tiled Map Editor（任务 1.1）

| 字段 | 值 |
|---|---|
| 工具名 | Tiled Map Editor |
| 用途 | 编辑 `.tmj` Tilemap、合并 tileset、标注 Tile 自定义属性（如 `collide=true`） |
| 推荐版本 | ≥ 1.9 |
| 许可证 | GPL v2，免费 |
| 官方下载 | <https://www.mapeditor.org/download> |
| Windows 默认路径 | `C:\Program Files\Tiled\tiled.exe` |
| macOS 默认路径 | `/Applications/Tiled.app/Contents/MacOS/Tiled` |
| Linux 默认路径 | `/usr/bin/tiled`（或 AppImage 自定路径） |
| 团队成员本地安装路径 | _待填写：例如 Alice: `C:\Program Files\Tiled\tiled.exe`_ |
| 关联需求 | R29.1（64×64 `.tmj`）、R29.2（tileset ≤ 512KB / Tile ≥ 64 种）、R29.5（`properties.collide` 标注）、R25.4（7 大分区不重叠） |

#### 验证清单

1. 能用 Tiled 打开 `.tmj` 文件（Pre-Slice 阶段可用 Tiled 自带样例临时验证）
2. 能新建 `Orthogonal` 地图、宽高 64 × 64 Tile、Tile Size 32 × 32 像素，并导出为 `.tmj` 后再次正确打开
3. 能在 Tile 的 `Custom Properties` 面板添加 `collide` 字段（类型 `bool`）

### 2. 像素图编辑器（任务 1.2，二选一 + 在线兜底）

| 项 | 首选：LibreSprite | 备选：Aseprite | 在线兜底：Piskel |
|---|---|---|---|
| 用途 | 绘制萌宠/NPC sprite sheet、地标精灵、UI 图标，导出 PNG（保留透明通道） | 同左，专业付费版，动画帧管理更顺手 | 浏览器内绘制简易 sprite，无需安装 |
| 许可证 | GPL v2，免费 | 商业付费 $19.99 | 免费在线服务 |
| 推荐版本 | ≥ 1.0-rc5 | ≥ 1.3 | — |
| 官方地址 | <https://github.com/LibreSprite/LibreSprite> | <https://store.steampowered.com/app/431730/Aseprite/> | <https://www.piskelapp.com> |
| Windows 默认路径 | `C:\Program Files\LibreSprite\libresprite.exe` | `C:\Program Files (x86)\Steam\steamapps\common\Aseprite\Aseprite.exe` | 浏览器访问 |
| macOS 默认路径 | `/Applications/LibreSprite.app/Contents/MacOS/LibreSprite` | `/Applications/Aseprite.app/Contents/MacOS/aseprite` | 浏览器访问 |
| Linux 默认路径 | AppImage 自定路径 或 `/usr/bin/libresprite` | Steam 安装路径 | 浏览器访问 |
| 团队成员本地安装路径 | _待填写：例如 Alice: `C:\Program Files\LibreSprite\libresprite.exe`_ | _待填写_ | 不需要 |
| 关联需求 | R29.6 / R29.7（7 类萌宠 sprite 命名 + 帧位）、R29.8 / R29.9（NPC 帧）、R29.25 / R29.27 / R29.28（UI 图标）、R29.55（sprite sheet ≤ 256 KB）、R29.60（透明通道保留） |

#### 团队选用建议

- **黑客松首选 LibreSprite**：GPLv2 完全免费，功能足以覆盖 sprite sheet 导出 + 透明通道 + 帧动画时间轴。
- **预算充裕选 Aseprite**：付费版动画工作流更顺手，已有授权的成员直接用。
- **临时性微调选 Piskel**：浏览器即用，适合现场补几帧或 GUI 工具失灵时兜底；不可作为主要绘制工具（保存依赖云端）。

#### 验证清单

1. 能新建画布（任意 32 × 32 / 64 × 64 像素）并启用 RGBA 透明背景
2. 能导出为 PNG-32（带 Alpha 通道），用图片查看器或浏览器打开后**透明区域确实透明**而非白底
3. 能将多帧合并导出为 sprite sheet（横向或纵向排列），且每帧间距/网格符合 32 × 32 整数倍
4. 团队成员各自把本地安装路径填入上方表格的「团队成员本地安装路径」列

#### CI 与启动校验关系

- 像素图编辑器是 **GUI 工具**，不进入 CI 流水线，也不被 `npm run check:assets` 校验。
- 启动校验只校验其**产物**：`assets/sprites/**.png`、`assets/ui/**.svg|png` 是否存在、size 是否在阈值内、license 是否非空（详见 `design.md` §5 与 `requirements.md` R29）。
- 若团队某位成员暂时不需要绘制素材（例如只写代码），允许跳过安装；但**必须保证仓库中的 sprite 已由其他成员产出并提交**。

## Asset Status

> Wave 4 已用 `scripts/_generate-real-assets.mjs` 生成结构化像素艺术替换占位；Wave 5 通过 `scripts/_register-assets.mjs` 把 `packages/mock-town/src/*.ts` 也纳入登记表。
> 真实素材的下载/绘制/筛选清单见 [`assets/PROCUREMENT.md`](./assets/PROCUREMENT.md)。

清单当前状态（来自最新一次 `node scripts/_register-assets.mjs` + `npm run check:assets`）：

| 类别 (R29 子条款) | 当前数量 | 最低要求 | 满足？ | 备注 |
| --- | ---: | ---: | :---: | --- |
| **A** Tilemap & 主 tileset (R29.1–5) | 2 | 1× tileset + 1× `.tmj` | ✅ | `tileset_main.png` 8×8 网格 64 块 + `town_64x64.tmj` Tiled 1.10 格式 |
| **A** 7 大功能区地标 (R25.1, R25.2, R29.3) | 7 | 7 张 + `landmark_for_zone` 字段 | ✅ | 7 张 PNG 已含 `landmark_for_zone` ↔ Convention_Plaza / Cos_Studio / Goods_Bazaar / Doujin_Atelier / Newbie_Lobby / Limited_Info_House / Buzz_Square |
| **B** 萌宠 sprite (R29.6, R29.7) | 154 | 7 类 × ≥ 22 帧 = 154 | ✅ | 每条含 `mascot_type` + `frame`；7 类各 22 帧（idle / portrait_64 / 4 dir × 4 walk frames / 4 action frames） |
| **C** NPC sprite (R29.8, R29.9) | 510 | 6 类 × 5 NPC × 17 帧 = 510 | ✅ | 每条含 `persona_tag` + `npc_index` + `frame`；30 个 slot × 17 帧 |
| **I** UI 视觉资源 (R29.25–30) | 24 | 气泡 + 红条 + 卡片底 + 7 mascot icon + 11 companion icon + 3 isekai 粒子 = 24 | ✅ | speech_bubble.svg / degraded_banner.svg / glass_card_bg.png / icons_mascot/*.svg ×7 / icons_companion/*.svg ×11 / isekai_particles/*.png ×3 |
| **J** 音效 + 字体 (R29.31–36) | 2 | audio 占位 + en/romaji 字体 | ⚠ 部分 | `fonts/pixel_en_romaji.ttf` (OFL, TakWolf) ✅；`audio/.PROCUREMENT_PENDING` 占位（required_for_demo=false）；中文字体 `fonts/pixel_zh.ttf` 仍 `.PLACEHOLDER`，4 段音效 (R29.31–34) 仍待外部下载 → 见 PROCUREMENT.md |
| **L** Fallback 异常资产 (R29.39–42) | 4 | network_disconnected / isekai_failed / fallback_character / town_static_snapshot | ✅ | 4 张占位 PNG，已 required_for_demo=true；待 Slice 0 通过 Phaser 截图替换 town_static_snapshot.png（task 11.8） |
| **mock-data** Mock-Town 源文件 (R29.57–59) | 11 | `packages/mock-town/src/*.ts` 全集 | ✅ | companions / conventions / doujins / index / mascots / npcs / publish_templates / quizzes / runtime / timeline / videos；`path` 字段以 `../packages/mock-town/...` 为前缀（相对 `assets/` 解析） |

**总计 714 条登记，5.04 MB；** `npm run check:assets` 与 `npm run check:assets:strict`（含 sha256 严格匹配）均通过。

启动校验命令：

```pwsh
node scripts/_register-assets.mjs        # 重新扫描 + 重写 MANIFEST.yaml
node node_modules/tsx/dist/cli.mjs scripts/check-assets.ts            # 校验
$env:STRICT_HASH='true'; node node_modules/tsx/dist/cli.mjs scripts/check-assets.ts  # 严格模式
```

替换流程详见 PROCUREMENT.md「替换流程（每条目通用）」段。

## Credits

<!-- Pre-Slice 任务 10.5 — CC-BY / CC-BY-SA 资产署名（覆盖 R29.43–47） -->

> 当前 `assets/` 目录除 Ark Pixel 字体外，**全部视觉素材都是占位 PNG / SVG 或由 `scripts/_generate-real-assets.mjs` 程序化生成的结构化像素艺术**（详见 [`assets/PROCUREMENT.md`](./assets/PROCUREMENT.md)）。下表列出的所有第三方来源都是 [`assets/MANIFEST.yaml`](./assets/MANIFEST.yaml) 与 PROCUREMENT 流程**已经预声明**的合规来源——一旦真素材替换到位，本段署名即时生效，无需追加披露。
>
> 我们**只引入**许可证为 CC0 / OFL / Pixabay / Unsplash / CC-BY 4.0 / CC-BY-SA 3.0–4.0 / OGA-BY 3.0 的素材，**拒绝**任何未授权 IP 角色立绘或商业 anime 工作室美术（对应 R29.46）。

### CC0 / 公有领域 / Royalty-Free（无署名义务，仍主动署名）

| 来源 | 作者 / 组织 | 许可证（SPDX） | URL | 用途 |
|---|---|---|---|---|
| Kenney RPG Urban Kit / RPG Base / UI Pack / Music Loops / Sound Pack | [Kenney](https://kenney.nl) (Kenney Vleugels) | [`CC0-1.0`](https://creativecommons.org/publicdomain/zero/1.0/) | <https://kenney.nl/> | 主 tileset 合并源、UI 图标兜底、SFX 与 BGM 候选 |
| PIPOYA Free RPG Character Sprites 32×32 | [PIPOYA](https://pipoya.itch.io) | [`CC0-1.0`](https://creativecommons.org/publicdomain/zero/1.0/) | <https://pipoya.itch.io/pipoya-free-rpg-character-sprites-32x32> | NPC 像素角色基底（6 类 persona × ≥ 5 NPC 的真实素材替换源） |
| Vonwaon Bitmap Font | Haoyu Qiu ([@timothyqiu](https://timothyqiu.itch.io)) | [`CC0-1.0`](https://creativecommons.org/publicdomain/zero/1.0/) | <https://timothyqiu.itch.io/vonwaon-bitmap> | 中文像素字体（12px / 16px，覆盖 GB2312，对应 R29.35） |
| Pixabay Sound Effects | Pixabay 社区贡献者 | [`LicenseRef-Pixabay-Content-License`](https://pixabay.com/service/license-summary/)（royalty-free，无署名义务） | <https://pixabay.com/sound-effects/> | UI 点击 / 翻页 / 弹框掉落 SFX（R29.32–33） |
| Unsplash Photos | Unsplash 社区摄影师 | [`LicenseRef-Unsplash`](https://unsplash.com/license) | <https://unsplash.com/license> | 视频流 mock 缩略图占位参考（不再分发原图，仅做尺寸/构图参考） |

### OFL 1.1 / CC-BY 4.0（必须署名）

| 来源 | 作者 / 组织 | 许可证（SPDX） | URL | 用途 |
|---|---|---|---|---|
| Ark Pixel Font 12px Proportional（Latin / 罗马音） | [TakWolf](https://takwolf.com) ([@TakWolf](https://github.com/TakWolf)) | [`OFL-1.1`](https://openfontlicense.org)（SIL Open Font License） | <https://github.com/TakWolf/ark-pixel-font> | 英文 + 日文罗马音像素字体，对应 R29.36；已落盘 `assets/fonts/pixel_en_romaji.ttf` |
| Zpix 最像素（中文字体备选） | [SolidZORO](https://github.com/SolidZORO) | [`OFL-1.1`](https://openfontlicense.org) | <https://github.com/SolidZORO/zpix-pixel-font> | Vonwaon 不可达时的 `pixel_zh.ttf` 备选 |

### CC-BY-SA 3.0 / 4.0 / OGA-BY 3.0（必须署名 + 派生同许可证）

| 来源 | 作者 / 贡献者 | 许可证（SPDX） | URL | 用途 |
|---|---|---|---|---|
| Liberated Pixel Cup（LPC）Collection — RPG Pack base set / Character Bases / Tile Atlas | LPC contributors | [`CC-BY-SA-3.0`](https://creativecommons.org/licenses/by-sa/3.0/) / `CC-BY-SA-4.0` / `CC-BY-3.0` / `GPL-3.0-or-later` / `OGA-BY-3.0`（多许可证选其一） | <https://opengameart.org/content/lpc-collection> | 主 tileset 合并源、4 方向 walk 角色基底（萌宠 / NPC 真素材升级路径） |
| LPC contributor — Stephen "Redshrike" Challener | Stephen Challener (Redshrike) | `CC-BY-SA-3.0` / `OGA-BY-3.0`（按其在 OGA 页面声明） | <https://opengameart.org/users/redshrike> | LPC 角色头身基底，凡引用其 sprite 时同步在本行追加文件名 |
| LPC contributor — Charles Sanchez (CharlesGabriel) | Charles Sanchez | `CC-BY-SA-3.0` | <https://opengameart.org/users/charlesgabriel> | LPC 服装 / 配饰 layer |
| LPC contributor — William.Thompsonj | William Thompson | `CC-BY-SA-3.0` | <https://opengameart.org/users/williamthompsonj> | LPC 动作扩展帧 |
| LPC contributor — Sharm | Sharm | `CC-BY-SA-3.0` | <https://opengameart.org/users/sharm> | LPC tile / 装饰物 |

> **CC-BY-SA 强约束**：派生作品（包括我们对其 sprite 的二次拼合 / 重着色）必须以**相同许可证**回馈社区。任何把 LPC 基底合入仓库的提交，都要在该提交的 PR 描述里写明：来源 URL + 作者 + 许可证 + 是否经修改。
>
> **未经授权 IP 拒绝清单**（R29.46）：商业 anime（如 Aniplex / Bandai / KyoAni / 集英社等）官方角色立绘 / 配音 / 主题曲；同人圈知名 OC（无作者授权）；任何带有可识别商标的素材（除非该商标已确认为 generic）。本仓库**不接受**此类素材通过 `MANIFEST.yaml`，启动校验脚本会以 `license` 字段为枚举白名单进行兜底拦截。

### Tooling / 工具链署名

| 工具 | 作者 | 许可证（SPDX） | URL |
|---|---|---|---|
| Tiled Map Editor | Thorbjørn Lindeijer | [`GPL-2.0-only`](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html) | <https://www.mapeditor.org/> |
| LibreSprite | LibreSprite contributors | [`GPL-2.0-only`](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html) | <https://github.com/LibreSprite/LibreSprite> |
| Aseprite（团队成员可选自费授权） | David Capello | [`LicenseRef-Aseprite-EULA`](https://www.aseprite.org/faq/#can-i-use-aseprite-commercially)（商业付费） | <https://www.aseprite.org/> |
| Piskel | Julian Descottes | [`Apache-2.0`](https://www.apache.org/licenses/LICENSE-2.0) | <https://www.piskelapp.com/> |

### Mock 数据来源 / Mock-Data Attribution

`packages/mock-town/src/*.ts` 的全部条目均由 **anime-agent-town team** 自制（`license: SELF`），未引用任何第三方现实人物 / 真实账号 / 商业 IP。视频流 / 漫展 / 同人 / 题库 / 搭子 mock 中的姓名、口头禅、城市、漫展名称、漫画文案均为虚构创作。详细的素材采购 TODO 矩阵（含每条目的 Source URL / License / 当前状态）见 [`assets/PROCUREMENT.md`](./assets/PROCUREMENT.md)。

### Fonts 落盘速查表

| 文件 | 字体 | 作者 | 许可证 | 来源 |
|---|---|---|---|---|
| `assets/fonts/pixel_zh.ttf`（**当前为 `.PLACEHOLDER`**） | Vonwaon Bitmap Font（中文像素字体，12px / 16px） | Haoyu Qiu ([@timothyqiu](https://timothyqiu.itch.io)) | [`CC0-1.0`](https://creativecommons.org/publicdomain/zero/1.0/)（公有领域，无署名义务） | <https://timothyqiu.itch.io/vonwaon-bitmap> |
| `assets/fonts/pixel_zh.ttf` _(备选)_ | Zpix 最像素（CN+JP，全字符集） | [SolidZORO](https://github.com/SolidZORO) | [`OFL-1.1`](https://openfontlicense.org) | <https://github.com/SolidZORO/zpix-pixel-font> |
| `assets/fonts/pixel_en_romaji.ttf` | Ark Pixel Font 12px Proportional（Latin / 罗马音） | [TakWolf](https://takwolf.com) ([@TakWolf](https://github.com/TakWolf)) | [`OFL-1.1`](https://openfontlicense.org) | <https://github.com/TakWolf/ark-pixel-font> |

> **字体注意事项**：
> - Vonwaon 仅在 itch.io 发布，浏览器交互式下载，未自动化拉取。当前仓库以 `pixel_zh.ttf.PLACEHOLDER` 占位，团队成员需手工下载并替换（详见占位文件内的步骤）。
> - 若 itch.io 无法访问，使用 Zpix 作为备选方案（一键 `Invoke-WebRequest` 即可）。
> - Ark Pixel 已自动下载到位（latin 变体覆盖英文 + 罗马音；如需日文假名，可改用同一 release 中的 `ark-pixel-12px-proportional-ja.ttf`）。
> - 关联需求：R29.35（中文像素字体覆盖 GB2312）、R29.36（英文/罗马音像素字体）。
