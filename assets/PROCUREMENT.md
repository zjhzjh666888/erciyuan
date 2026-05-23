# Asset Procurement Checklist

> 本文档是 **Wave 3 资产采购批次** 的人类操作清单。
> 所有「外部下载」「在线工具」「自绘」类任务的最终交付物登记表。
> Kiro 已为每个产物写入 **占位文件**（PNG / SVG / TMJ / TXT），让
> `npm run check:assets` 当前能跑通。团队按本表逐项替换为真实素材。
>
> **Wave 4 升级（脚本 `scripts/_generate-real-assets.mjs`）已经把全部「视觉」类
> 资产从「单色块占位」升级为「程序化生成的结构化像素艺术」**：64 种独立 Tile 的
> tileset、64×64 多分区 Tilemap、7 张地标精灵、7 类 × ≥ 22 帧萌宠、6 personas ×
> 5 NPCs × 17 帧 NPC sprite、Smallville 风气泡 + DEGRADED 红条 + 7 萌宠 SVG +
> 11 搭子 SVG、Glass 卡片底纹、3 张 isekai 粒子。这些资产是 demo 现场的有效底
> 牌；团队仍可按本表的 Source URL 下载真实素材进一步替换以提升画面观感。

## 总览

| 类别 | Pre-Slice 任务 | 本表条目数 | 当前状态 |
| --- | --- | --- | --- |
| Tilemap & 主 tileset | 2.1 / 2.2 / 2.3 / 2.4 / 2.5 | 6 | procedurally generated · upgrade-or-replace optional |
| 萌宠 sprite 基底 | 4.1 / 4.2 / 4.3 / 4.4 | 3 + 1 工具 | procedurally generated · upgrade-or-replace optional |
| NPC sprite 筛选 | 5.1 / 5.3 | 1 + N | procedurally generated · upgrade-or-replace optional |
| UI pack | 6.1 / 6.2 / 6.3–6.8 | 2 | procedurally generated · upgrade-or-replace optional |
| 音效 / BGM | 7.1 / 7.2 / 7.3 / 7.4 | 6 | **pending — 必须人工下载（音频不可程序化生成）** |
| 字体 | 7.5 / 7.6 | 2 | 7.5 placeholder（Vonwaon 待下载） · 7.6 done（Ark Pixel） |
| 异常场景 / fallback | 8.1 / 8.2 / 8.3 / 8.4 | 4 | placeholder（视觉 + 静态截图，可在 Slice 0 后替换） |

## 替换流程（每条目通用）

1. 按 `Source URL` 列下载文件，解压（如有）到 `assets/_raw/<pack>/`（已 gitignore，可放心放原包）。
2. 按 `Output Path` 列把目标文件复制到指定位置，**覆盖**当前的 placeholder。
3. 编辑 `assets/MANIFEST.yaml` 对应条目：
   - 重新计算 `hash`（`sha256:<hex>`）和 `size_kb`
   - 把 `license` 改为真实 license（CC0 / CC-BY-SA / Pixabay 等）
   - 把 `source_url` 填上真实 URL
   - 把 `author` 改为真实作者署名
   - 删掉或更新 `notes` 字段（占位字样应移除）
4. 跑 `node node_modules/tsx/dist/cli.mjs scripts/check-assets.ts` 确认通过。
5. CC-BY / CC-BY-SA 资产同步在 `README#Credits` 段补署名（任务 10.5）。
6. 把 Status 列从 `pending` / `placeholder` 改为 `done`。

## 类别 A — Tilemap & 主 tileset（任务 2.x）

### 2.1 Kenney RPG Urban Kit

| 字段 | 值 |
| --- | --- |
| Source URL | <https://kenney-assets.itch.io/rpg-urban-kit> |
| License | CC0（公有领域，无署名义务） |
| Author | Kenney |
| Pack 解压目标 | `assets/_raw/kenney-rpg-urban-kit/` |
| 期望产物 | 合并到 `assets/tilemaps/tileset_main.png`（Tile ≥ 64 种 / ≤ 512 KB） |
| Status | **pending** |
| Notes | itch.io 网页下载，需手动点击「Download Now」选择 0 价。zip ~5 MB。 |

### 2.2 LPC RPG Pack base set

| 字段 | 值 |
| --- | --- |
| Source URL | <https://lpc.opengameart.org/content/rpg-pack-base-set> |
| License | CC-BY-SA 3.0 / GPL 3.0（必须署名，派生同许可证） |
| Author | LPC contributors |
| Pack 解压目标 | `assets/_raw/lpc-rpg-pack/` |
| 期望产物 | 合入 `assets/tilemaps/tileset_main.png` 与若干 sprite |
| Status | **pending** |
| Notes | 下载后必须在 `README#Credits` 登记 LPC 贡献者列表（CC-BY-SA 强约束）。 |

### 2.3 Tiny RPG Town & Exterior 32×32 Town tileset（兜底）

| 字段 | 值 |
| --- | --- |
| Source URL A | <https://ansimuz.itch.io/tiny-rpg-town> |
| Source URL B | <http://tempest.opengameart.org/content/exterior-32x32-town-tileset> |
| License | 商用免费（Tiny RPG Town） / CC-BY 3.0（Exterior 32×32） |
| Author | ansimuz / Tempest |
| Pack 解压目标 | `assets/_raw/tiny-rpg-town/` 与 `assets/_raw/exterior-32x32/` |
| 期望产物 | 兜底素材，主线选 Kenney + LPC，Tiny RPG 用于补缺 |
| Status | **pending** |
| Notes | 兜底用，主下载完成后可不下；team 时间紧时跳过此条。 |

### 2.4 / 2.5 Tiled 编辑产物（团队自制）

| 产物路径 | 说明 | Status |
| --- | --- | --- |
| `assets/tilemaps/tileset_main.png` | 256×256 程序化生成 PNG，8×8 网格、64 种独立 Tile（草地 / 土路 / 砖墙 / 石墙 / 屋顶 / 门窗 / 路灯路标 / 货架 / 灌木树木花朵 / 水沙 / 7 大区域标记） | **procedurally generated · upgrade-or-replace optional** |
| `assets/tilemaps/town_64x64.tmj` | 64×64 Tiled 1.10 schema：Ground + Decoration + Collision 三层；4 类原始功能区 + 7 大主题分区作为 map-level properties；40 个 Tile 标注 collide=true | **procedurally generated · upgrade-or-replace optional** |

> 团队可在 Tiled 中打开本 `.tmj` 文件继续手工调整布局；脚本 `scripts/_generate-real-assets.mjs` 是确定性的（seeded PRNG），重跑会覆盖手工改动，因此手工 fork 后请独立维护。

## 类别 B — 萌宠 sprite 基底（任务 4.x）

### 4.1 LPC Character Bases

| 字段 | 值 |
| --- | --- |
| Source URL | <https://dnd.opengameart.org/content/lpc-character-bases> |
| License | CC-BY-SA 3.0 / GPL 3.0 |
| Author | LPC contributors |
| Pack 解压目标 | `assets/_raw/lpc-character-bases/` |
| 期望产物 | 萌宠 sprite 基底，后续在 LibreSprite/Aseprite 中加发色/装饰 |
| Status | **pending** |
| Notes | 与 2.2 同源 LPC，署名共用一份。 |

### 4.2 PIPOYA FREE RPG Character Sprites 32×32

| 字段 | 值 |
| --- | --- |
| Source URL | <https://pipoya.itch.io/pipoya-free-rpg-character-sprites-32x32> |
| License | 商用免费（须保留作者署名 PIPOYA） |
| Author | PIPOYA |
| Pack 解压目标 | `assets/_raw/pipoya-32x32/` |
| 期望产物 | 64 角色 4 方向 walk 帧，作为萌宠/NPC 通用辅料 |
| Status | **pending** |
| Notes | itch.io 0 价下载；解压后约 200+ PNG。 |

### 4.3 Universal LPC Spritesheet Generator（在线工具）

| 字段 | 值 |
| --- | --- |
| Source URL A | <https://lpc.4wall.ai/> |
| Source URL B | <https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator> |
| License | CC-BY-SA 3.0（基于 LPC base） |
| 期望用途 | 在线合成 7 类萌宠的发色 / 瞳色 / 装饰，导出 sprite sheet |
| Status | **reference**（无下载产物，是工作流工具） |
| Notes | 团队用此工具做萌宠定制，输出仍是 PNG 文件，落到 `assets/sprites/mascots/{type}/`。 |

### 当前萌宠占位

| 路径 | 说明 | Status |
| --- | --- | --- |
| `assets/mascots/{cat_lore,dog_social,hamster_hoard,fox_create,slime_newbie,wolf_limited,pigeon_buzz}/` | 7 类 mascot_type 各 22 帧（idle + portrait_64 + 4 方向 walk × 4 + 2 brewing + 2 talking），程序化生成 32×32 像素艺术，按 mascot_type 配色与持征区分（猫耳/眼镜、狗朵耳/舌头、仓鼠腮鼓、狐狸尾、狼锐眼、史莱姆球身、鸽喙） | **procedurally generated · upgrade-or-replace optional** |

> 7 类 mascot_type（cat_lore / dog_social / hamster_hoard / fox_create / slime_newbie / wolf_limited / pigeon_buzz）
> 现已交付 22 帧/类（合计 154 帧），R29.6 要求的「≥ 26 帧」中余下 4 帧（如 sleeping/posting/waving 等可选动作帧）若后续需要可在脚本扩展或在 LibreSprite 内手绘。
> 命名遵循 `mascots/{type}/{frame}.png`，`scripts/_register-assets.mjs` 自动登记到 MANIFEST.yaml。

## 类别 C — NPC sprite 筛选（任务 5.1）

| 字段 | 值 |
| --- | --- |
| Source 候选 | PIPOYA 32×32（同 4.2）+ LPC Character Bases（同 4.1）+ <https://pixelyarn.itch.io/cute-anime-sprites-school-edition> |
| License | 商用免费 / CC-BY-SA / 视具体素材 |
| 任务量 | 从池中筛 ≥ 30 个 NPC，按 6 类 persona_tag 分组（每类 ≥ 5） |
| 期望产物 | `assets/sprites/npcs/{persona_tag}/{slot}/{frame}.png` |
| Status | **pending** |

### 当前 NPC 占位

| 路径 | 说明 | Status |
| --- | --- | --- |
| `assets/npc/{tsundere,yandere,tennen,chuuni,sanmu,hara_guro}/{01..05}/` | 6 类 persona × 5 NPC × 17 帧（idle + 4 方向 walk × 4），程序化生成 32×32 humanoid sprite；每个 persona 通过面部细节（傲娇粉颊、病娇半阖眼、天然呆呆毛、中二 X 眼、三无横线嘴 + 眼镜、腹黑斜笑）区分 | **procedurally generated · upgrade-or-replace optional** |

> 合计 6 × 5 × 17 = 510 帧；R29.8（≥ 30 NPC）/ R29.9（每个 ≥ 17 帧）满足。可按 PIPOYA / LPC 真实 sprite 替换以提升质感。

## 类别 I — UI pack（任务 6.1 / 6.2）

### 6.1 Pixel UI Pack（750 assets）

| 字段 | 值 |
| --- | --- |
| Source URL | <https://opengameart.org/content/pixel-ui-pack-750-assets> |
| License | CC-BY 3.0 / CC-BY-SA 3.0（视具体资源） |
| Author | OpenGameArt 贡献者（下载页明示） |
| Pack 解压目标 | `assets/_raw/pixel-ui-pack/` |
| 期望产物 | 按钮 / 卡片 / 输入框等 UI 控件素材，导入 `assets/ui/` |
| Status | **pending** |

### 6.2 Kenney UI Pack（兜底）

| 字段 | 值 |
| --- | --- |
| Source URL | <https://kenney-assets.itch.io/ui-pack> |
| License | CC0 |
| Author | Kenney |
| Pack 解压目标 | `assets/_raw/kenney-ui-pack/` |
| 期望产物 | UI 兜底素材 |
| Status | **pending** |

### 当前 UI 占位（自绘 SVG / 程序化 PNG，已可用）

| 路径 | 说明 | Status |
| --- | --- | --- |
| `assets/ui/speech_bubble.svg` | Smallville 风白底气泡（含尾巴 + 阴影 filter） | **procedurally generated · upgrade-or-replace optional** |
| `assets/ui/degraded_banner.svg` | DEGRADED MODE 红 → 橙渐变红条 | **procedurally generated · upgrade-or-replace optional** |
| `assets/ui/icons_mascot/{7种}.svg` | 7 类萌宠图标，按 mascot_type 配色 + 特征装饰（眼镜 / 舌头 / 腮鼓 / 尾尖 / 星 / 雪光 / 喙） | **procedurally generated · upgrade-or-replace optional** |
| `assets/ui/icons_companion/{11种}.svg` | 11 类搭子类型图标（漫展 / Cos / 拍照 / 逛摊 / 买谷 / 同作品 / 同城 / 视频合拍 / 新手求带 / 抢限定 / 二创） | **procedurally generated · upgrade-or-replace optional** |
| `assets/ui/glass_card_bg.png` | 128×128 程序化 noise 纹理，配 Glassmorphism 卡片底 | **procedurally generated · upgrade-or-replace optional** |
| `assets/ui/isekai_particles/{p01..p03}.png` | 3 张转生粒子（4 角十字星 / 6 角星 / 径向渐变光球） | **procedurally generated · upgrade-or-replace optional** |

## 类别 J — 音效与字体（任务 7.x）

### ⚠ 这一组是 Wave 3 中唯一无法占位的：音频文件不能用「合法但内容空」的占位

下方 6 个文件的当前状态都是 **pending — must download**。
`assets/audio/.PROCUREMENT_PENDING` 已写入提示文件登记。

### 7.1 异世界转生主音效

| 字段 | 值 |
| --- | --- |
| Source URL | <https://pixabay.com/sound-effects/magic-sparkle-190030/> |
| License | Pixabay License（免费商用免署名） |
| Author | Pixabay 贡献者（详见下载页） |
| 输出路径 | `assets/audio/isekai_jingle.mp3` |
| 时长约束 | 3–8 秒（R2.5 / R29.31） |
| Status | **pending** |
| Notes | Pixabay 下载需登录免费账号，下载后剪辑到 3–8 秒。 |

### 7.2 弹框掉落 SFX

| 字段 | 值 |
| --- | --- |
| Source URL | <https://pixabay.com/sound-effects/cartoon-wink-magic-sparkle-6896/> |
| License | Pixabay License |
| 输出路径 | `assets/audio/popup_drop.mp3` |
| Status | **pending** |

### 7.3 点击 / 翻页 SFX ≥ 3 段

| 字段 | 值 |
| --- | --- |
| Source URL A | <https://pixabay.com/sound-effects/search/sparkle/> |
| Source URL B（兜底） | <https://kenney-assets.itch.io/ui-audio> |
| License | Pixabay License / CC0 |
| 输出路径 | `assets/audio/click_01.mp3`、`click_02.mp3`、`click_03.mp3` |
| Status | **pending** |
| Notes | Kenney UI Audio 是 zip 包含数十段，挑 3 段即可。 |

### 7.4 萌宠生成成功 BGM

| 字段 | 值 |
| --- | --- |
| Source URL | Pixabay 搜索 cute / cheerful / pixel |
| License | Pixabay License |
| 输出路径 | `assets/audio/mascot_born_bgm.mp3` |
| 时长约束 | ≥ 8 秒，便于结果页停留 3 秒后渐入 |
| Status | **pending** |

### 7.5 中文像素字体（Vonwaon Bitmap，CC0）

| 字段 | 值 |
| --- | --- |
| Source URL | <https://timothyqiu.itch.io/vonwaon-bitmap> |
| 备选 | Zpix（OFL）：<https://github.com/SolidZORO/zpix-pixel-font> |
| License | CC0 1.0（Vonwaon）/ OFL（Zpix） |
| Author | Timothy Qiu / SolidZORO |
| 输出路径 | `assets/fonts/pixel_zh.ttf` |
| Status | **placeholder（pixel_zh.ttf.PLACEHOLDER 标记，需人工下载替换）** |

### 7.6 英文 / 罗马音像素字体（Ark Pixel，OFL）

| 字段 | 值 |
| --- | --- |
| Source URL | <https://github.com/TakWolf/ark-pixel-font> |
| License | OFL 1.1 |
| Author | TakWolf |
| 输出路径 | `assets/fonts/pixel_en_romaji.ttf` |
| Status | **done**（Ark Pixel Font 12px 已落地，hash 与体积已登记到 MANIFEST.yaml） |

## 类别 L — 异常场景 / fallback（任务 8.x）

### 8.1 网络断开提示插画

| 字段 | 值 |
| --- | --- |
| 输出路径 | `assets/fallback/network_disconnected.png` |
| 期望尺寸 | ≥ 320×240，与 Glass 风设计 token 协调 |
| 来源 | 团队自绘（基于 Pixel UI Pack 二次绘制） |
| License | SELF |
| Status | **placeholder**（当前 320×240 橙色单色块） |

### 8.2 转生失败提示插画

| 字段 | 值 |
| --- | --- |
| 输出路径 | `assets/fallback/isekai_failed.png` |
| 期望尺寸 | ≥ 320×240 |
| 来源 | 团队自绘 |
| License | SELF |
| Status | **placeholder**（当前红色单色块） |

### 8.3 Fallback 像素角色（R2.6）

| 字段 | 值 |
| --- | --- |
| 输出路径 | `assets/fallback/fallback_character.png` |
| 期望尺寸 | 32×32 |
| 来源 | 从 PIPOYA 池挑一个憨憨角色（任务 5.1 完成后） |
| License | 跟随 PIPOYA |
| Status | **placeholder**（当前淡蓝色块） |

### 8.4 全镇静态截图（先占位，Slice 0 后用 Phaser 替换）

| 字段 | 值 |
| --- | --- |
| 输出路径 | `assets/fallback/town_static_snapshot.png` |
| 期望尺寸 | 1080×1920 或 1920×1080，覆盖整张小镇视图 |
| 来源 | Slice 0 跑通后从 Phaser canvas.toDataURL() 导出（任务 11.8） |
| License | SELF |
| Status | **placeholder**（当前 640×480 灰蓝 grid） |

## 完工 DoD

- [ ] 所有 `pending` 状态条目完成下载并填到对应 `Output Path`
- [ ] 所有 `placeholder` 状态条目替换为真实素材
- [ ] `assets/MANIFEST.yaml` 中每条对应 entry 的 `hash` / `size_kb` / `license` / `source_url` / `author` 已更新为真实值
- [ ] CC-BY / CC-BY-SA 资产已在 `README#Credits` 段署名
- [ ] `node node_modules/tsx/dist/cli.mjs scripts/check-assets.ts` 通过
- [ ] `STRICT_HASH=true` 模式（任务 10.1）也通过
