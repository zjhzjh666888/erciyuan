# Requirements Document

## Introduction

### 产品定位扩展（次元萌宠小镇 / 抖音黑客松赛道 1）

本项目对外名称为 **「次元萌宠小镇」**（内部代号 anime-agent-town 不变），定位为**抖音黑客松赛道 1「AI 体验：刷到懂你的瞬间」** 的参赛作品。在原有像素小镇技术架构之上，叠加产品价值层：以 AI 测一测人格识别 + 7 类萌宠人格 + 个性化二次元内容/漫展推荐 + 同好搭子匹配 + AI 引导内容发布的完整闭环，让"刷到 → 测一测 → 召唤萌宠 → 进小镇 → 匹配搭子 → 发布内容"成为一条可量化的产品主链路。

产品同时支持两条并存的入口路径：

- **扫码 QR 入口**（保留 R1）：海报、线下物料、打印物 → 扫码进入小镇，偏线下/路演场景
- **抖音视频流掉落弹框入口**（新增 R17）：用户在抖音内容流刷到二次元视频时弹出"测一测领萌宠"，偏抖音内嵌/真实流量场景

两条入口最终汇入"测一测 / 萌宠生成 / 进入小镇 / 搭子匹配 / 内容发布"统一闭环。本次需求增量（R17–R28）**不替换**原有 R1–R16，而是在其之上追加产品价值层。

### Compatibility Notes（与既有需求的冲突协调）

为避免新增 R17–R28 与原 R1–R16 的语义冲突，本节明确以下兼容性约定：

- **R1（扫码 QR 入口）与 R17（抖音视频流弹框入口）并存**：两条入口最终汇入 R3（执念赋予）/ R18（测一测）二选一或并行；扫码入口偏线下海报 demo，弹框入口偏抖音内嵌 demo
- **R10（虚拟谷子与痛房）= R25 中的"谷子交换区"实体化**：R25 谷子交换区是 R10 的小镇空间载体，二者共享 Goods_System 与 Itasha_System
- **R11（同人二创自动生成）= R25 中的"创作阁"NPC 行为 + R27 内容发布的素材源**：R11 自动生成的同人作品可作为 R27 闭环中的内容草稿来源
- **R12（托梦 / 空投）兼容 R26 轻互动破冰**：托梦是用户单向行为（仅对自己角色），轻互动是搭子之间双向行为，二者互不替代
- **R9（厨力打榜）兼容 R25 中的"情报广场"+ R23 的视频热度榜**：厨力打榜的人气分可作为情报广场榜单与漫展视频热度榜的输入信号之一
- **R15（Smallville UI 还原度）必须在 R25 的 7 大分区中继续遵守**：俯视 45° + Tile 32×32 + 白底气泡 + 角色细节卡 + 24 主色板，分区数量增加但视觉规范不变
- **character.persona_tag（6 类二次元角色性格：傲娇/病娇/天然呆/中二病/三无/腹黑）保持不变**，与 R19 新增的 mascot_type（7 类萌宠人格）是同一行 character 表的两个独立维度：persona_tag 表征"小镇里 NPC 的戏路"，mascot_type 表征"用户作为玩家的二次元身份"

「二次元 AI 智能体小镇」（Anime Agent Town）是一个由二维码入口驱动的多智能体像素小镇 Web 应用。用户扫码进入后，可在浏览器中生成专属二次元角色，赋予其"执念"目标，将其投放到 2D 像素小镇中观察其自主行为、与其他智能体的对话与社交，并通过仪表盘实时审计角色的思维链。系统在斯坦福 Generative Agents 与 a16z AI Town 的范式之上，叠加"二次元厨力文化"（角色打榜、虚拟谷子/痛房、同人二创自动生成）作为差异化爆点。

本文档为黑客松交付场景编写，采用 **[MVP]**（48 小时内必做、构成 demo 主链路）与 **[Stretch]**（加分项，时间允许时实现）标签，明确范围边界。

### MVP Demo 关键原则（必读）

经团队对齐，**当前阶段 demo 不强制接入真实大语言模型**。MVP 的首要目标是**完全复刻 Stanford Smallville（Generative Agents）的视觉与交互范式**，并在此基础上叠加二次元主题美术，做到"评委一眼认出 Smallville 同款、并觉得画面特别顶"。这意味着：

- MVP 阶段，Agent_Core 的 Thought_Trace 可由**预录脚本、状态机、模板填充**驱动，输出格式与节奏需与真实 LLM 输出不可区分
- LLM 真实接入归类为 **[Stretch]**，由特性开关控制，不影响 demo 主链路
- 视觉与 UI 还原度（Tile 美术、角色精灵、思维气泡、控制台仪表盘排版）是 MVP 的硬指标，与真实 LLM 决策同等重要

## Glossary

- **Town_System**：小镇整体后端系统，统一调度智能体、地图、同步与持久化
- **Entry_Service**：处理二维码生成、扫码进入、Web 会话初始化的入口服务
- **Character_Generator**：基于关键词/性格标签/参考图片生成二次元像素角色的服务
- **Agent_Core**：智能体的"大脑"层，由大语言模型驱动，负责意图理解、规划、对话生成
- **Pathfinding_Engine**：智能体的"小脑"层，负责像素地图寻路、动作执行、碰撞检测的轻量模块
- **Memory_System**：基于本地 SQLite + 向量索引的记忆流系统，支持 Observation/Reflection/长期记忆三层
- **MCP_Tool_Gateway**：基于 Model Context Protocol 暴露小镇内可交互对象（咖啡机、公告板、门、谷子货架等）的工具网关
- **Render_Engine**：前端基于 Tile 的 2D 像素渲染引擎（Canvas 或 Phaser.js 实现）
- **Sync_Service**：基于 WebSocket 的实时状态同步服务，广播坐标、动作、对话事件
- **Ranking_System**：角色人气榜与"厨力打榜"玩法子系统
- **Itasha_System**：用户专属"虚拟痛房"系统，承载虚拟谷子陈列与个性化展示
- **Goods_System**：虚拟谷子（徽章/立牌/抱枕）的发行、解锁、交易子系统
- **Doujin_Generator**：基于角色相遇事件自动生成四格漫画/轻小说的同人二创子系统
- **Intervention_Interface**：用户向 AI 角色"托梦"、"空投道具"等干预通道
- **Observation_Dashboard**：上帝模式仪表盘，展示思维链、对话流、角色状态、热搜榜
- **Sandbox**：智能体工具调用与代码执行的隔离环境
- **Persona_Module**：可插拔的二次元性格模组（傲娇/病娇/天然呆/中二病等）
- **Thought_Trace**：智能体单步推理的结构化日志，包含 Observation/Plan/Action/Speech 字段
- **Mascot_System**：7 类萌宠人格（cat_lore / dog_social / hamster_hoard / fox_create / slime_newbie / wolf_limited / pigeon_buzz）的注册、查询、推荐子系统（R19 新增）
- **Quiz_Service**：3–5 题轻量人格测试服务，输出 mascot_type 主/次标签（R18 新增）
- **Recommendation_Engine**：基于 mascot_type + 上下文 + 位置的内容推荐子系统（R21 新增）
- **Convention_Service**：附近漫展/同城活动推荐与漫展详情页服务（R22/R23 新增）
- **Companion_Match**：同好搭子匹配子系统，输出匹配度评分与破冰建议（R24 新增）
- **Lite_Interaction**：轻互动破冰子系统（点赞/邀请卡/共同兴趣点亮等）（R26 新增）
- **Content_Publishing_Funnel**：AI 引导发布 Cos 视频/漫展 vlog/二创内容的闭环子系统（R27 新增）
- **Douyin_Stream_Hook**：抖音视频流二次元内容识别与"测一测领萌宠"弹框入口（R17 新增）
- **mascot_type**：用户萌宠人格类型字段（与 character.persona_tag 是 character 表上的两个独立维度，分别表征"用户身份"与"NPC 戏路"）
- **contextual_intent**：从触发弹框的视频提取的上下文意图（视频标签、作品 IP、Cos 角色名等），用于动态生成测一测题目与个性化推荐
- **Asset_Manifest**：assets/MANIFEST.yaml 文件，登记全部资产的 path / category / hash / license / source_url / author / required_for_demo 字段，作为启动校验与版权审计的单一事实来源
- **Pre-Slice**：在所有 Vertical Slice 之前的"零号 Slice"，专门用于资产准备与基础脚手架，必须先于 Slice 0 在 design.md 与 tasks.md 中显式列出
- **Mock-Town Package**：独立 npm 包 @erciyuan/mock-town，承载全部 demo 用 mock 数据（视频流、漫展、搭子、题库、内容模板、同人作品 mock），前端与 Sync_Service 共享同一份 schema 与 TypeScript 类型导出

## Requirements

---

### Requirement 1: 二维码入口与会话初始化 [MVP]

**User Story:** 作为一名展会评委或观众，我想通过手机扫描海报上的二维码直接进入 Web 端小镇，以便无需安装任何应用即可在 30 秒内开始体验。

#### Acceptance Criteria

1. THE Entry_Service SHALL 在小镇主控制台暴露一个生成入场二维码的接口，二维码内容指向带唯一会话令牌的 Web URL
2. WHEN 一个新设备打开带有效会话令牌的 URL，THE Entry_Service SHALL 在 3 秒内为该设备创建一个用户会话并返回前端首页
3. WHEN 一个新会话被创建，THE Entry_Service SHALL 在 Memory_System 中持久化该会话的 user_id、创建时间、设备指纹
4. IF 会话令牌已过期或不合法，THEN THE Entry_Service SHALL 返回错误码 401 并展示"会话已失效，请重新扫码"提示页
5. WHILE 用户处于已登录会话状态，THE Entry_Service SHALL 在每个页面响应中携带该会话的 user_id
6. THE Entry_Service SHALL 支持同一时刻至少 50 个并发会话（黑客松现场展示规模）

---

### Requirement 2: 二次元角色生成（The Hook）[MVP]

**User Story:** 作为一名扫码进入的用户，我想通过输入关键词或上传一张参考图片快速生成一个独一无二的二次元像素角色，以便获得"异世界转生"的仪式感开场体验。

#### Acceptance Criteria

1. THE Character_Generator SHALL 提供一个表单接口，接受三类输入：自由文本关键词、预设性格标签（傲娇/病娇/天然呆/中二病/三无/腹黑）、可选的参考图片
2. WHEN 用户提交角色生成请求且仅包含文本/标签输入，THE Character_Generator SHALL 在 15 秒内返回一个像素化角色资产，包含 32×32 立绘、4 方向行走帧、姓名、性格画像 JSON
3. WHEN 用户上传参考图片，THE Character_Generator SHALL 基于图片生成保留主要发色、瞳色、服饰色调的像素角色
4. THE Character_Generator SHALL 为每个生成的角色分配全局唯一的 character_id 并写入 Memory_System
5. WHILE 角色生成正在进行，THE Render_Engine SHALL 在前端播放"异世界转生"动画（持续不少于 3 秒、不超过 8 秒），用于覆盖生成延迟
6. IF 角色生成请求超过 30 秒未返回，THEN THE Character_Generator SHALL 返回降级结果（从预制角色池中随机选择并标记 fallback=true）
7. THE Character_Generator SHALL 在生成完成后将角色绑定到当前会话的 user_id，使该用户成为角色的"主人"

---

### Requirement 3: 角色目标与执念赋予 [MVP]

**User Story:** 作为角色的主人，我想给我的角色下达一个初始执念（如"去广场推销代码"、"为本命角色拉票"），以便后续观察智能体如何自主拆解并执行该目标。

#### Acceptance Criteria

1. THE Town_System SHALL 在角色生成完成后引导用户输入一段不超过 200 字符的初始目标文本
2. WHEN 用户提交初始目标，THE Agent_Core SHALL 将该文本解析为结构化的 goal 对象，包含 intent、success_criteria、priority 三个字段
3. THE Town_System SHALL 允许用户在角色已投放后追加最多 3 条次级目标，每条同样不超过 200 字符
4. IF 用户提交的目标文本为空或仅包含空白字符，THEN THE Town_System SHALL 拒绝该请求并返回错误信息"执念不能为空"
5. THE Agent_Core SHALL 将解析后的 goal 写入对应角色的长期记忆，作为后续 Plan 生成的最高优先级输入
6. WHEN 角色完成一个 goal 的 success_criteria，THE Agent_Core SHALL 在 Thought_Trace 中标记该 goal 为 completed 并广播一条 goal_completed 事件

---

### Requirement 4: 智能体行为内核（Brain-Cerebellum 分层）[MVP for scripted pipeline; Stretch for live LLM]

**User Story:** 作为系统设计者，我想智能体由"大脑层"负责意图与对话、"小脑层"负责寻路与动作，并且大脑层在 MVP 阶段允许由脚本/状态机驱动以保证 demo 现场稳定性。

#### Acceptance Criteria

1. THE Agent_Core SHALL 在每个智能体的决策循环中产出包含 observation、plan、next_action、speech 四个字段的 Thought_Trace 记录，输出格式 SHALL 与真实大模型输出在结构上完全一致 *[MVP]*
2. WHERE LLM 实时接入特性关闭，THE Agent_Core SHALL 使用基于 Persona_Module 的脚本/有限状态机/模板填充策略生成 Thought_Trace，且单次生成耗时不超过 200 毫秒 *[MVP]*
3. WHERE LLM 实时接入特性启用，THE Agent_Core SHALL 调用配置的大语言模型生成 Thought_Trace，并限制单个智能体调用频率不超过每 10 秒一次 *[Stretch]*
4. WHEN Agent_Core 产出一个 next_action 为移动类型，THE Pathfinding_Engine SHALL 接管执行，使用 A* 或同等算法在 Tile 地图上规划路径 *[MVP]*
5. THE Pathfinding_Engine SHALL 在不调用大语言模型的前提下完成寻路、避障、动作帧切换，单次寻路计算耗时 SHALL 严格小于 50 毫秒 *[MVP]*
6. WHEN 多个智能体处于同一格子且发生交互意图，THE Agent_Core SHALL 仲裁出唯一发起对话的智能体，避免对话冲突 *[MVP]*
7. IF Agent_Core 在 LLM 启用模式下调用大模型超时或返回不可解析内容，THEN THE Agent_Core SHALL 自动降级到脚本模式生成本轮 Thought_Trace，并将异常写入 error 字段 *[Stretch fallback path]*

---

### Requirement 5: 记忆流与反思机制 [MVP for Observation+Memory; Stretch for Reflection]

**User Story:** 作为系统设计者，我想智能体的所有观察、对话、动作都被结构化记录并支持向量检索，以便后续 Plan 阶段可以召回相关历史，复现 Generative Agents 范式。

#### Acceptance Criteria

1. THE Memory_System SHALL 为每个智能体维护一个独立的记忆库，存储 observation、dialogue、action、reflection 四类条目，每条记录包含 timestamp、importance、embedding 三个公共字段 *[MVP]*
2. WHEN 一条新记忆被写入，THE Memory_System SHALL 同步生成其向量嵌入并写入向量索引 *[MVP]*
3. WHEN Agent_Core 进入新一轮决策循环，THE Memory_System SHALL 基于"近期性 + 重要性 + 相关性"三因子返回 Top-K 条相关记忆（K 默认为 8） *[MVP]*
4. WHERE 反思机制启用，THE Memory_System SHALL 在单个智能体累计未反思 importance 之和超过阈值（默认 150）时触发 Reflection，将多条 observation 浓缩为高层洞察 *[Stretch]*
5. THE Memory_System SHALL 保证单条记忆写入端到端延迟不超过 200 毫秒
6. IF Memory_System 单次写入失败，THEN THE Agent_Core SHALL 在 Thought_Trace 中记录 memory_write_failed 并继续执行当前决策循环
7. IF Memory_System 在最近 60 秒内连续写入失败次数超过 5 次或导致检索 P95 延迟超过 2 秒，THEN THE Town_System SHALL 暂停受影响智能体的决策循环并在 Observation_Dashboard 顶部展示存储不稳定告警

---

### Requirement 6: MCP 工具调用与小镇可交互对象 [MVP for 2 tools; Stretch for full set]

**User Story:** 作为系统设计者，我想小镇中的咖啡机、公告板、门、谷子货架等对象通过 Model Context Protocol 暴露为可调用工具，以便智能体能够以统一协议与世界交互，并向评委演示协议化架构。

#### Acceptance Criteria

1. THE MCP_Tool_Gateway SHALL 通过 MCP 协议向 Agent_Core 暴露至少以下两个工具，每个工具包含 name、description、input_schema 字段：coffee_machine.brew、bulletin_board.post *[MVP]*
2. WHEN Agent_Core 通过 MCP 协议调用一个工具，THE MCP_Tool_Gateway SHALL 在 1 秒内返回结构化结果，包含 status 与 payload 字段 *[MVP]*
3. WHERE 完整工具集启用，THE MCP_Tool_Gateway SHALL 额外暴露 door.open、shop.purchase、goods_shelf.inspect、ranking_board.vote、itasha.decorate 共 5 个工具 *[Stretch]*
4. IF 一次工具调用的输入未通过 input_schema 校验，THEN THE MCP_Tool_Gateway SHALL 返回 status="invalid_args" 并不修改任何世界状态
5. THE MCP_Tool_Gateway SHALL 将每次工具调用的入参、出参、调用方 character_id 写入 Memory_System，作为可审计的行为日志

---

### Requirement 7: 像素小镇地图渲染与实时同步 [MVP]

**User Story:** 作为旁观用户，我想在浏览器中看到一张二次元风格的 2D 像素小镇地图，所有角色的位置和动作实时同步刷新，以便获得"上帝视角观察活体世界"的沉浸感。

#### Acceptance Criteria

1. THE Render_Engine SHALL 加载一张不小于 64×64 个 Tile 的 2D 像素地图，包含至少 4 类功能区（广场、咖啡馆、公告栏区、住宅区）
2. WHEN Sync_Service 收到任一角色的 position 或 action 状态变更，THE Sync_Service SHALL 在 500 毫秒内通过 WebSocket 广播给所有订阅该房间的前端会话
3. THE Render_Engine SHALL 以不低于 24 FPS 渲染最多 20 个并发活跃角色（黑客松规模）
4. WHILE 一个前端会话保持 WebSocket 连接，THE Sync_Service SHALL 每 30 秒发送一次心跳包以保持连接活性
5. IF WebSocket 连接断开，THEN THE Render_Engine SHALL 自动以指数退避策略尝试最多 5 次重连，且 SHALL 仅在某次重连握手成功后才请求完整状态快照并将连接标记为已恢复
6. THE Render_Engine SHALL 为每个角色头顶展示其当前 speech 气泡（最近一条对话内容），并在气泡显示满 4 秒时立即从画面中移除（不使用淡出过渡）

---

### Requirement 8: 多智能体对话与社交行为 [MVP]

**User Story:** 作为旁观用户，我想看到不同智能体在小镇里相遇、自动展开对话、形成关系，以便见证"活的小镇"涌现行为。

#### Acceptance Criteria

1. WHEN 两个智能体进入彼此 3 格曼哈顿距离内并均处于 idle 状态，THE Agent_Core SHALL 依据 Persona_Module 与 goal 决定是否发起对话
2. WHEN 一个对话被发起，THE Agent_Core SHALL 生成不超过 6 轮的对话片段，每轮单条不超过 80 字符，并写入 Memory_System
3. THE Agent_Core SHALL 在对话结束后为参与双方更新一条关系条目，包含 relation_type（friend/rival/fan/neutral）与 affinity 数值
4. IF 对话生成失败或超时，THEN THE Agent_Core SHALL 让双方角色互相挥手 idle 后散开，不阻塞主循环
5. THE Sync_Service SHALL 将对话每一轮文本作为单独事件广播，前端按顺序展示气泡

---

### Requirement 9: 二次元角色排行榜与厨力打榜 [Stretch]

**User Story:** 作为厨力深厚的用户，我想我的角色能在小镇里自主帮"本命"拉票、说服其他 AI 转粉、引发党争，并在前端看到实时人气榜，以便复现同人圈的氛围。

#### Acceptance Criteria

1. WHERE 打榜玩法启用，THE Ranking_System SHALL 维护一个 character_id → popularity_score 的实时排行榜，分数变化在 2 秒内反映到前端
2. WHERE 打榜玩法启用，WHEN 智能体 A 在对话中成功"安利"智能体 B（通过情感分析判定 B 表达正向回应），THE Ranking_System SHALL 将 A 所支持本命的 popularity_score 增加 1 点
3. WHERE 打榜玩法启用，THE Ranking_System SHALL 在前端 Bento Grid 中以"小镇热搜榜"组件展示 Top 10 角色及其趋势变化
4. WHERE 打榜玩法启用，IF 同一对话对中安利动作在 5 分钟内重复发生超过 3 次，THEN THE Ranking_System SHALL 忽略后续打分，防止刷榜
5. WHERE 打榜玩法启用，THE Ranking_System SHALL 每 10 分钟生成一次"党争事件"快照（哪两位角色阵营对抗最激烈）并广播给所有前端

---

### Requirement 10: 虚拟谷子与痛房系统 [Stretch]

**User Story:** 作为吃谷玩家，我想我的小镇账号有一个专属虚拟痛房，并且角色能在小镇打工赚币、抢限量谷子，以便把"吃谷买周边"的快乐数字化。

#### Acceptance Criteria

1. WHERE 谷子玩法启用，THE Goods_System SHALL 预置至少 12 款虚拟谷子模型（徽章/立牌/抱枕至少各 4 款），每款包含 sku_id、稀有度、像素图
2. WHERE 谷子玩法启用，THE Town_System SHALL 为每个用户开通一间 8×8 Tile 的痛房房间，由 Itasha_System 负责陈列管理
3. WHERE 谷子玩法启用，WHEN 用户角色在工坊或咖啡馆完成一次打工动作，THE Goods_System SHALL 向用户钱包发放 1 至 5 枚虚拟代币
4. WHERE 谷子玩法启用，WHEN 用户在前端商店购买一件谷子且代币余额充足，THE Goods_System SHALL 扣除代币并将该谷子加入用户库存
5. WHERE 谷子玩法启用，THE Itasha_System SHALL 允许用户将库存中的谷子拖拽放置到自己痛房的指定 Tile，并对其他用户只读公开
6. WHERE 谷子玩法启用，IF 用户尝试购买已售罄的限量谷子，THEN THE Goods_System SHALL 返回 status="sold_out" 并不扣除代币

---

### Requirement 11: 同人二创自动生成 [Stretch]

**User Story:** 作为二次元厨力玩家，我想看到不同 IP 性格的角色相遇时自动生成四格漫画或短篇轻小说，并能一键分享到社交平台，以便制造扩散爆点。

#### Acceptance Criteria

1. WHERE 同人玩法启用，WHEN 一段对话中两位角色的 Persona_Module 跨越不同 IP 标签且 affinity 变化超过阈值（默认 5），THE Doujin_Generator SHALL 触发一次同人生成
2. WHERE 同人玩法启用，THE Doujin_Generator SHALL 在 20 秒内产出一份四格漫画（4 张拼接像素图 + 每格不超过 30 字符的对白）或一段不超过 400 字符的轻小说文本
3. WHERE 同人玩法启用，THE Doujin_Generator SHALL 为每篇同人作品分配 doujin_id 并存入 Memory_System，使该事件可被两位角色后续记忆调用
4. WHERE 同人玩法启用，THE Town_System SHALL 在前端提供"一键分享"按钮，将作品导出为带水印的图片或文本卡片
5. WHERE 同人玩法启用，IF 生成的同人内容触发内容安全过滤，THEN THE Doujin_Generator SHALL 丢弃该结果并记录 reason="content_filtered"

#### Special Note: Round-Trip 要求

6. WHERE 同人玩法启用，THE Doujin_Generator SHALL 提供一个 serialize/deserialize 工具对，能够将四格漫画作品序列化为 JSON 并完整还原（用于跨会话分享与导入）
7. WHERE 同人玩法启用 AND serialize 与 deserialize 操作均成功完成，FOR ALL 合法 doujin 作品对象，先序列化再反序列化的结果 SHALL 与原对象语义等价（round-trip property）

---

### Requirement 12: 用户干预（托梦与空投道具）[Stretch]

**User Story:** 作为角色的主人，我想能从上帝视角向角色"托梦"提示或空投道具，以便制造剧情转折并增加策略博弈乐趣。

#### Acceptance Criteria

1. WHERE 干预玩法启用，THE Intervention_Interface SHALL 提供一个"托梦"接口，允许用户向自己拥有的角色注入一条不超过 100 字符的提示文本
2. WHERE 干预玩法启用，WHEN 一条托梦被注入，THE Memory_System SHALL 将其作为 importance=10 的记忆条目立即写入对应角色的记忆库
3. WHERE 干预玩法启用，THE Intervention_Interface SHALL 限制单个用户每分钟最多发送 3 次托梦，超过则返回 rate_limit_exceeded
4. WHERE 干预玩法启用，THE Intervention_Interface SHALL 提供一个"空投道具"接口，允许用户从其库存中选一件谷子投放到地图任意可达 Tile
5. WHERE 干预玩法启用，IF 用户尝试干预非自己拥有的角色，THEN THE Intervention_Interface SHALL 返回 status="forbidden" 并记录该尝试
6. WHERE 干预玩法启用，WHEN 一次空投发生，THE Sync_Service SHALL 立即向所有前端广播道具落点动画事件

---

### Requirement 13: 上帝模式可观察性仪表盘 [MVP]

**User Story:** 作为评委或观众，我想在前端看到一个"控制台"仪表盘，实时浏览每个角色的思维链、当前动作、最近对话，以便审计 AI 行为并欣赏涌现现象。

#### Acceptance Criteria

1. THE Observation_Dashboard SHALL 提供一个角色列表面板，按住所或人气排序，点击任一角色后切换到该角色的详情视图
2. WHEN 用户进入某角色详情视图，THE Observation_Dashboard SHALL 实时滚动展示该角色最近 50 条 Thought_Trace 条目，字段包括 timestamp、observation、plan、next_action、speech
3. THE Observation_Dashboard SHALL 提供一个"全镇对话流"侧边栏，按时间倒序展示最近 100 条跨角色对话事件
4. WHERE 打榜玩法启用，THE Observation_Dashboard SHALL 在 Bento Grid 中渲染"小镇热搜榜"与"角色人气墙"组件 *[Stretch]*
5. THE Observation_Dashboard SHALL 提供导出按钮，将当前选中角色的全部 Thought_Trace 序列化为 JSONL 文件下载
6. THE Observation_Dashboard SHALL 提供一个 JSONL/Markdown 反序列化导入接口，能够将导出的思维链文件还原为可视化记录
7. FOR ALL 合法 Thought_Trace 列表，先序列化为 JSONL 再反序列化的结果 SHALL 与原列表语义等价（round-trip property）

---

### Requirement 14: 沙盒隔离与本地优先 [MVP for basic isolation]

**User Story:** 作为系统设计者，我想智能体的工具调用与代码执行在隔离的沙盒中运行，以便向评委展示 Privacy-Preserving 与可控自治这两个卖点。

#### Acceptance Criteria

1. THE Sandbox SHALL 在独立进程或容器中执行所有 MCP_Tool_Gateway 工具调用，宿主进程不直接访问工具内部状态
2. THE Sandbox SHALL 限制单次工具调用的 CPU 时间不超过 2 秒、内存不超过 256 MB
3. IF 一次工具调用超出资源上限，THEN THE Sandbox SHALL 终止该调用并向 MCP_Tool_Gateway 返回 status="resource_exceeded"
4. THE Memory_System SHALL 默认使用本地 SQLite 文件存储，不在未经用户同意的情况下将记忆数据上传到外部服务
5. WHERE 用户开启"云同步"开关 AND 用户在弹出的同意对话框中显式点击"同意上传"，THE Memory_System SHALL 将记忆库加密后同步到配置的远端存储；任一条件未满足时 SHALL 拒绝同步 *[Stretch]*

---

### Requirement 15: Stanford Smallville UI 视觉还原度 [MVP]

**User Story:** 作为黑客松团队，我希望 demo 在前端视觉上让评委瞬间联想到 Stanford Smallville（Generative Agents）的经典演示，以便在 5 分钟陈述中借势认知锚点。

#### Acceptance Criteria

1. THE Render_Engine SHALL 采用与 Smallville 相同的俯视 45° 像素 Tile 风格，Tile 尺寸固定为 32×32 像素
2. THE Render_Engine SHALL 复刻 Smallville 标志性的镇广场、咖啡馆、住宅、公告栏四类场景的空间布局比例
3. THE Render_Engine SHALL 在每个角色头顶展示与 Smallville 同款式的圆角对话气泡（白底黑边、尾巴朝下），并在角色当前动作下方显示动作描述文本（例如 "is brewing coffee"）
4. THE Observation_Dashboard SHALL 在右侧面板复刻 Smallville 的"角色细节卡"排版：头像 + 当前活动 + Plan + Recent Memory 列表
5. THE Render_Engine SHALL 使用与二次元主题协调的统一色板（不超过 24 个主色），并保证整体明度与对比度通过基本可读性检查
6. WHEN 评委首次看到主画面，THE Render_Engine SHALL 在 2 秒内完成首屏 Tile 与至少 3 个智能体精灵的渲染，避免空白闪烁

---

### Requirement 16: 黑客松交付与性能约束 [MVP]

**User Story:** 作为黑客松团队负责人，我想系统在 demo 现场对评委的操作有可预期的响应时间，并具备故障降级能力，以便保证 5 分钟现场演示不翻车。

#### Acceptance Criteria

1. WHEN 一名评委从扫码到角色生成完成并出现在小镇，THE Town_System SHALL 在 95% 的请求中将端到端时间控制在 25 秒内
2. THE Town_System SHALL 在小镇并发活跃角色数达到 20 时仍维持 Sync_Service 广播延迟不超过 1 秒
3. WHERE LLM 实时接入特性启用 AND 大语言模型 API 不可用持续超过 30 秒，THE Agent_Core SHALL 切换到 Requirement 4 中定义的脚本行为模式，保证小镇视觉上不停摆
4. THE Observation_Dashboard SHALL 在前端加载完成后不晚于 5 秒首次拉到至少 1 个智能体的 Thought_Trace（5 秒为上限，不要求更紧）
5. WHILE 系统处于降级模式，THE Observation_Dashboard SHALL 在页面顶部展示一个明显的 "DEGRADED MODE" 提示条

---

### Requirement 17: 抖音视频流二次元内容识别与掉落弹框入口 [MVP]

**User Story:** 作为一名抖音用户，我想在刷到二次元视频时被自动弹出"测一测领萌宠"互动弹框，以便不离开内容流就能进入次元小镇的体验闭环。

#### Acceptance Criteria

1. WHEN 一名用户在抖音内容流刷到属于二次元类目的视频（包含 Cos / 漫展 vlog / 动漫解说 / 角色分析 / 谷子开箱 / 手办 / 二次元穿搭 / 同城漫展 / 二创剪辑 至少 1 类）且观看时长达到阈值（默认 5 秒），THE Douyin_Stream_Hook SHALL 在该视频上掉落"测一测领萌宠"互动弹框
2. THE Douyin_Stream_Hook SHALL 从预定义文案池（不少于 3 套）随机选取弹框文案，且按钮文案 SHALL 包含"立即测一测"、"召唤我的萌宠"、"进入次元小镇"中的至少一个
3. WHILE 同一用户处于同一会话，THE Douyin_Stream_Hook SHALL 限制弹框出现频率为每 10 分钟最多 1 次
4. IF 当前用户已绑定的萌宠数量大于等于 1，THEN THE Douyin_Stream_Hook SHALL 将弹框切换为"已有萌宠的回访引导"形态，按钮文案 SHALL 包含"带 Ta 进小镇"或"看 Ta 今天在干什么"之一
5. THE Douyin_Stream_Hook SHALL 在弹框事件中携带触发该次弹框的视频 contextual_intent 字段（包含视频标签、作品 IP、Cos 角色名）以供 Quiz_Service 动态生成题目
6. WHEN 用户对弹框执行关闭、跳过或在 30 秒内未点击的行为，THE Douyin_Stream_Hook SHALL 将该行为以匿名事件写入 Memory_System 的 hook_event 表

---

### Requirement 18: AI 测一测人格识别 [MVP]

**User Story:** 作为一名点击弹框的用户，我想用不超过 1 分钟完成一组轻量测试得到自己的萌宠人格标签，以便快速进入个性化体验。

#### Acceptance Criteria

1. THE Quiz_Service SHALL 提供包含 3 至 5 道题的轻量测试，单题作答平均时长 SHALL 不超过 8 秒
2. THE Quiz_Service SHALL 同时使用题库静态题目与基于 R17 contextual_intent 动态生成的题目，且每次测试中动态生成题目的数量 SHALL 至少为 1 道
3. THE Quiz_Service SHALL 为每道题提供 7 个选项（A 至 G），每个选项 SHALL 映射到 7 类 mascot_type 的不同向量权重
4. WHEN 用户完成全部题目，THE Quiz_Service SHALL 在 2 秒内输出 mascot_type 主标签与次标签，其中次标签允许为空
5. THE Quiz_Service SHALL 将测试结果（题目 ID、答案、向量、推断 mascot_type）写入对应 user_session 的 quiz_result 字段
6. IF 用户在测试过程中关闭页面或退出应用，THEN THE Quiz_Service SHALL 将已答题结果持久化为草稿，并在 24 小时内允许用户从弹框继续作答

---

### Requirement 19: 7 类萌宠人格系统 [MVP]

**User Story:** 作为系统设计者，我想 Mascot_System 提供恰好 7 类萌宠人格的注册与查询能力，以便后续推荐、小镇分区、搭子匹配各模块基于统一人格枚举驱动。

#### Acceptance Criteria

1. THE Mascot_System SHALL 提供恰好 7 类萌宠人格枚举：cat_lore（考据猫 Neko-ko）、dog_social（扩列犬 Wan-kyun）、hamster_hoard（囤囤鼠 Ham-guu）、fox_create（太太狐 Fox-sensei）、slime_newbie（云仔 Slime-mo）、wolf_limited（限定狼 Lone-wolf）、pigeon_buzz（咕咕鸽 Pigeon-nya）
2. THE Mascot_System SHALL 为每类萌宠存储以下字段：mascot_type、display_name_zh、display_name_romaji、core_traits、recommended_zone、companion_types、catchphrase、core_functions、persona_color
3. THE Mascot_System SHALL 提供查询接口 getMascotProfile(mascot_type)，返回该类萌宠的全部 9 个字段
4. WHEN Quiz_Service 完成一次萌宠生成，THE Mascot_System SHALL 为该用户的小镇虚拟分身（character 实体）注入对应 mascot_type 标签，使该 character 同时持有 mascot_type 与原 persona_tag 两个独立字段
5. IF Quiz_Service 因向量近邻冲突未能稳定推断主标签，THEN THE Mascot_System SHALL 默认将 mascot_type 设置为 slime_newbie

---

### Requirement 20: 萌宠生成结果页 [MVP]

**User Story:** 作为完成测试的用户，我想立即看到自己的萌宠形象与人格画像，以便获得"AI 真的懂我"的仪式感并自然进入下一步。

#### Acceptance Criteria

1. THE Town_System SHALL 在测试完成后展示萌宠生成结果页，结果页 SHALL 包含：不少于 32×32 像素的萌宠形象与立绘、display_name、人格标签、不少于 3 个兴趣关键词、推荐内容方向、推荐小镇区域、推荐搭子类型、CTA 按钮"进入次元小镇"与"看看推荐内容"
2. WHEN 萌宠生成结果页开始渲染，THE Render_Engine SHALL 在转生动画结束后 2 秒内完成结果页首屏渲染
3. WHEN 用户在结果页停留时长达到 3 秒，THE Town_System SHALL 自动激活下一步推荐 Feed（参见 R21）
4. THE Town_System SHALL 在结果页提供"分享到抖音"按钮，点击后 SHALL 生成带水印的 PNG 卡片或视频卡片用于分享

---

### Requirement 21: 二次元内容个性化推荐 [MVP for top1; Stretch for full]

**User Story:** 作为生成了萌宠的用户，我想看到一组围绕我的人格量身定制的二次元内容推荐，以便感知 AI 的个性化能力并产生留存。

#### Acceptance Criteria

1. WHEN 萌宠生成结果页激活下一步推荐，THE Recommendation_Engine SHALL 展示推荐 Feed，且 Feed 中 SHALL 至少包含以下 6 类内容各 1 条：同风格 Cos 视频、同作品角色解说、二次元穿搭教程、谷子开箱、漫展 vlog、萌新入坑指南 *[MVP]*
2. THE Recommendation_Engine SHALL 使用 mascot_type 主标签、R17 contextual_intent、用户位置三个因子驱动推荐策略 *[MVP]*
3. THE Recommendation_Engine SHALL 为每条推荐内容卡片附带 reason_text，其长度 SHALL 不超过 30 字符 *[MVP]*
4. WHEN 用户点击任意推荐卡片，THE Town_System SHALL 将该点击事件作为 affinity 信号写入对应萌宠的 Memory_System 记忆库 *[MVP]*
5. WHERE 完整推荐策略启用，THE Recommendation_Engine SHALL 为 7 类 mascot_type 各自维护一份独立的推荐策略表（例如考据猫优先推剧情解析，限定狼优先推抢票信息）*[Stretch]*

---

### Requirement 22: 附近漫展与同城活动推荐 [MVP for list; Stretch for map]

**User Story:** 作为获得萌宠的用户，我想看到我所在城市或邻近城市未来一个月内的二次元活动，以便把线上体验延伸到线下。

#### Acceptance Criteria

1. THE Convention_Service SHALL 基于用户位置（精度不低于城市级）与 mascot_type 推荐至少 3 个起始时间在未来 30 天内、城市为同城或邻近城市的漫展或二次元活动 *[MVP]*
2. THE Convention_Service SHALL 为每个漫展卡片提供以下字段：name、time_range、city、venue、suitable_personas、hot_characters、recommended_outfit、recommended_companion_types、enter_town_cta、related_cosvids_count *[MVP]*
3. THE Convention_Service SHALL 在推荐理由文案中包含具体描述（例如"治愈系收藏风格"、"暗黑系 Cos"、"乙女向"），且禁止使用通用模板化句式 *[MVP]*
4. IF 用户拒绝授权位置 OR 同城与邻近城市在未来 30 天内无任何活动，THEN THE Convention_Service SHALL 退化为展示"全国热门漫展榜" *[MVP]*
5. WHERE 地图视图启用，THE Convention_Service SHALL 提供地图视图，将推荐漫展按地理位置标注在地图上 *[Stretch]*

---

### Requirement 23: 漫展详情页与 Cos 专场视频推荐 [MVP]

**User Story:** 作为对某个漫展感兴趣的用户，我想点开它就看到丰富的视频与攻略内容，以便决定是否参加并提前做好准备。

#### Acceptance Criteria

1. WHEN 用户点击漫展卡片，THE Convention_Service SHALL 在 1 秒内拉取并展示该漫展的详情页，详情页 SHALL 包含：往届视频集、同主题 Cos 视频、漫展 vlog、妆造教程、出片参考、拍摄模板、同城 Cos 用户视频、打卡点列表
2. THE Convention_Service SHALL 在漫展详情页提供"进入小镇该漫展专属广场"CTA，点击后 THE Town_System SHALL 把当前用户的萌宠投放到小镇"漫展广场"对应的漫展专题区
3. THE Convention_Service SHALL 在视频列表分页中支持基于 mascot_type 的"为我推荐"标签优先排序
4. IF 一个漫展不存在任何关联视频，THEN THE Convention_Service SHALL 在详情页展示"该漫展暂无视频，邀请你成为第一个发布者"CTA，点击后 SHALL 跳转到 R27 内容发布闭环

---

### Requirement 24: 同好搭子匹配 [MVP]

**User Story:** 作为想找同好的用户，我想 AI 帮我匹配兴趣相投的搭子并给出破冰建议，以便降低社交门槛。

#### Acceptance Criteria

1. THE Companion_Match SHALL 基于 mascot_type、兴趣关键词、点击行为、漫展意向、地理位置、社交偏好六个因子计算搭子匹配度
2. THE Companion_Match SHALL 在匹配输出中至少覆盖以下 11 类搭子类型：漫展搭子、Cos 搭子、拍照搭子、逛摊搭子、买谷搭子、同作品搭子、同城二次元搭子、视频合拍搭子、新手求带搭子、抢限定搭子、二创搭子
3. THE Companion_Match SHALL 在每张搭子卡片中包含：对方萌宠形象、对方 mascot_type 标签、至少 1 个共同兴趣点、匹配度百分比、（如有）想去的漫展、想找的搭子类型、推荐破冰方式
4. FOR ALL 相同的输入因子集合，THE Companion_Match 的匹配度计算结果 SHALL 是确定性的（相同输入产生相同输出），以便支持属性测试
5. IF 候选池中真实用户数量少于 5 人，THEN THE Companion_Match SHALL 用小镇 NPC 填充候选池，且每张 NPC 卡片 SHALL 标记 is_npc=true
6. WHEN 用户对某个搭子推荐执行"拒绝"操作，THE Companion_Match SHALL 在 7 天内不再向该用户推送该搭子

---

### Requirement 25: 小镇 7 大功能区扩展 [MVP for layout; Stretch for full interactions]

**User Story:** 作为进入小镇的用户，我想小镇的功能分区与 7 类萌宠人格对应，以便每个用户都有归属感与"主场"。

#### Acceptance Criteria

1. THE Town_System SHALL 在保留原 4 类分区（广场、咖啡馆、住宅、公告栏）的基础上扩展出 7 大主题分区，且每个主题分区 SHALL 与至少一类 mascot_type 形成主场对应关系：漫展广场（Convention_Plaza）对应 dog_social；Cos 摄影区（Cos_Studio）对应 fox_create 与 dog_social 共享；谷子交换区（Goods_Bazaar）对应 hamster_hoard；创作阁（Doujin_Atelier）对应 fox_create；新人接引区（Newbie_Lobby）对应 slime_newbie；限定情报屋（Limited_Info_House）对应 wolf_limited；情报广场（Buzz_Square）对应 pigeon_buzz，且 cat_lore 的"资料馆"作为情报广场的子区域或独立成第 8 区 *[MVP]*
2. THE Render_Engine SHALL 在保留 Smallville 风格俯视 45° Tilemap 的前提下，为 7 大主题分区各设计独特地标精灵（漫展拱门、Cos 反光板、谷子货架、画板、新人指引牌、限定狙击塔、电视墙）*[MVP]*
3. WHEN 用户在萌宠结果页选择"进入次元小镇"，THE Town_System SHALL 把该用户的 character 投放到其 mascot_type 对应的主场分区入口 *[MVP]*
4. THE Town_System SHALL 在 design.md 中明确划定 7 大分区的 Tile 坐标范围，且任意两个分区的 Tile 坐标范围 SHALL 不存在重叠 *[MVP]*
5. WHERE 完整分区交互启用，THE MCP_Tool_Gateway SHALL 为每个分区暴露独立的可交互对象（例如漫展拱门 → convention.checkin、谷子货架 → goods_shelf.inspect、画板 → doujin.draft）*[Stretch]*

---

### Requirement 26: 轻互动破冰系统 [MVP for 3 actions; Stretch for full]

**User Story:** 作为收到搭子推荐的用户，我想用最低社交成本和对方破冰，以便降低尴尬感并提升匹配成功率。

#### Acceptance Criteria

1. THE Lite_Interaction SHALL 提供至少 7 种轻互动方式：给对方萌宠点赞 *[MVP]*、点亮共同兴趣标签 *[MVP]*、发送漫展邀请卡 *[MVP]*、发送同角色合拍邀请 *[Stretch]*、发送买谷同行邀请 *[Stretch]*、收藏同一个漫展 *[MVP]*、一起完成小镇任务 *[Stretch]*
2. WHEN 用户发起一次轻互动，THE Lite_Interaction SHALL 自动生成基于双方共同点与 mascot_type 风格的破冰文案，文案长度 SHALL 在 1 至 80 字符之间
3. WHEN 用户发起一次轻互动，THE Lite_Interaction SHALL 在 1 秒内将事件推送给对方萌宠并写入 Memory_System
4. IF 对方萌宠的所有者已离线超过 24 小时，THEN THE Lite_Interaction SHALL 将邀请卡转为离线消息，且在 48 小时内对方回应仍 SHALL 视为有效
5. THE Lite_Interaction SHALL 限制同一用户对同一搭子每天发起轻互动的次数不超过 3 次
6. WHEN 双方在彼此之间累计完成的轻互动数量达到 2 次，THE Lite_Interaction SHALL 触发"匹配成功"事件并通知 R27 内容发布闭环

---

### Requirement 27: AI 引导内容发布闭环 [MVP for template; Stretch for video gen]

**User Story:** 作为完成搭子匹配的用户，我想 AI 引导我们一起产出一条 Cos 视频或漫展 vlog，以便把社交关系沉淀为可分享内容。

#### Acceptance Criteria

1. WHEN R26 触发"匹配成功"事件，THE Content_Publishing_Funnel SHALL 在仪表盘与小镇画面双侧同时弹出"一起去发个 Cos 视频吧"CTA *[MVP]*
2. WHEN 用户点击该 CTA，THE Content_Publishing_Funnel SHALL 在 3 秒内生成包含以下内容的发布草稿：视频标题、由开头/中间/结尾三段构成的视频脚本、拍摄模板（机位/景别/时长建议）、合拍模板、漫展打卡任务、发布文案、不少于 4 个话题标签且其中 SHALL 必含 #次元小镇 *[MVP]*
3. THE Content_Publishing_Funnel SHALL 在生成草稿中注入双方萌宠的视觉水印与共同 IP 标签 *[MVP]*
4. THE Content_Publishing_Funnel SHALL 提供"复制脚本到剪辑软件"与"导出为可分享卡片"两个一键操作 *[MVP]*
5. WHEN 内容发布闭环完成，THE Content_Publishing_Funnel SHALL 将"内容已发布"事件作为长期记忆回写到对应萌宠的 Memory_System，且后续该用户再访问小镇时小镇 NPC SHALL 主动谈论该事件 *[MVP]*
6. WHERE 视频模板引擎启用，THE Content_Publishing_Funnel SHALL 直接调用模板引擎生成时长不超过 30 秒的样片视频 *[Stretch]*
7. THE Content_Publishing_Funnel SHALL 在内容生成结果输出前通过既有内容安全过滤（参考 R11 第 5 条）；IF 生成内容触发安全过滤，THEN THE Content_Publishing_Funnel SHALL 丢弃该结果并记录 reason="content_filtered" *[MVP]*

---

### Requirement 28: 5 页 MVP 用户旅程契约 [MVP - 路演必跑]

**User Story:** 作为黑客松路演讲者，我想 demo 链路被严格契约化为 5 个页面，以便保证 5 分钟现场陈述每一步都可预期。

#### Acceptance Criteria

1. THE Town_System SHALL 提供以下 5 个核心页面作为路演 demo 的硬性必跑链路：Page_VideoFeed（视频流弹框页，模拟抖音风格视频流与掉落弹框）、Page_Quiz（测一测页，承载 3 题轻量测试）、Page_MascotResult（萌宠结果页，含萌宠形象、标签、推荐入口）、Page_Recommend（内容/漫展推荐页，含 Feed 与漫展卡片）、Page_Town（次元小镇页，含 Smallville 风像素小镇、搭子卡片、邀请卡按钮、"去发 Cos 视频"按钮）
2. THE Town_System SHALL 在上述 5 个页面之间任意跳转的耗时控制在 1 秒以内，且任意跳转过程 SHALL 不出现白屏
3. THE Town_System SHALL 保证完整跑完 5 页一遍（含转生动画与扫码模式）的总耗时不超过 95 秒
4. THE Town_System SHALL 在 design.md 中为 5 个页面分别标记其对应的 Vertical Slice 与 Tier
5. IF 任意页面的后端依赖发生故障，THEN THE Town_System SHALL 自动将该页面切换到 Mock 数据继续展示，且 SHALL 在页面顶部展示 DEGRADED MODE 红条（与 R16 第 5 条一致）

---

### Requirement 29: 资产准备契约（Asset Pipeline & Inventory Contract）[MVP - 路演必跑]

**User Story:** 作为黑客松团队负责人，我想在写第一行业务代码之前就锁定"小镇所有可见素材"的最小集合、来源策略、授权状态与命名规范，以便避免在 demo 当天因缺图、缺音、缺数据而画面崩塌。

#### Acceptance Criteria

##### 类别 A：Tilemap 与地图素材

1. THE Town_System SHALL 至少提供 1 张 64×64 Tile 的小镇地图文件，文件格式 SHALL 为 .tmj 或语义等价的 JSON Tilemap 格式
2. THE Town_System SHALL 至少提供 1 张主 tileset 资产，单张文件大小 SHALL 不超过 512 KB，且 SHALL 包含不少于 64 种独立 Tile
3. THE Town_System SHALL 为 R25 定义的 7 大功能区（漫展广场、Cos 摄影区、谷子交换区、创作阁、新人接引区、限定情报屋、情报广场）各提供至少 1 个独立地标精灵资产（漫展拱门、Cos 反光板、谷子货架、画板、新人指引牌、限定狙击塔、电视墙）
4. THE Town_System SHALL 提供公用建筑 Tile（地砖、墙体、门、窗、街灯、路标、植物）的变体合计不少于 20 种
5. THE Town_System SHALL 在每张 Tile 的 properties 中标注 collide 字段（true 或 false），用以区分阻挡 Tile 与可行 Tile

##### 类别 B：7 类萌宠精灵与立绘

6. FOR ALL 7 类 mascot_type（cat_lore / dog_social / hamster_hoard / fox_create / slime_newbie / wolf_limited / pigeon_buzz），THE Mascot_System SHALL 提供完整资产集合，每类资产 SHALL 包含：idle 立绘 1 张（不小于 32×32 像素）、大头照 1 张（不小于 64×64 像素，用于结果页与搭子卡片）、4 方向行走帧（up / down / left / right）每方向 4 帧合计 16 帧、动作帧（brewing / talking / sleeping / posting / waving 中）至少 2 个、persona_color 主色十六进制值、catchphrase 中文文案与罗马音文案各 1 条、core_traits 文案不少于 3 条
7. THE Mascot_System SHALL 保证 7 类萌宠的资产文件命名遵循 `mascot_{mascot_type}_{frame}.png` 规范

##### 类别 C：B 链路用 NPC 精灵

8. FOR ALL 6 类 persona_tag（傲娇 / 病娇 / 天然呆 / 中二病 / 三无 / 腹黑），THE Town_System SHALL 提供预制 NPC sprite 各不少于 5 个，6 类合计不少于 30 个 NPC sprite
9. THE Town_System SHALL 为每个 NPC sprite 提供 idle 帧 1 张与 4 方向 walk 帧合计不少于 17 帧
10. THE Town_System SHALL 为每个 NPC 提供姓名文案与口头禅文案各不少于 1 条

##### 类别 D：A 链路 Page_VideoFeed 视频流 Mock 数据

11. THE Town_System SHALL 提供不少于 12 条二次元视频 mock 卡片，每条 mock 卡片 SHALL 包含字段：thumbnail（不小于 540×960 像素）、author_name、avatar、title、video_tags（不少于 1 个二次元类目）、contextual_intent、duration、play_count
12. THE Town_System SHALL 保证视频 mock 数据集合至少覆盖 9 类二次元类目：Cos、漫展 vlog、动漫解说、角色分析、谷子开箱、手办、二次元穿搭、同城漫展、二创剪辑

##### 类别 E：测一测题库（Quiz_Service）

13. THE Quiz_Service SHALL 维护静态题库不少于 15 道题，每道题 SHALL 提供 7 个选项（A 至 G），每个选项 SHALL 映射 7 类 mascot_type 的向量权重，权重值 SHALL 在 [0, 1] 区间内，单题权重总数为 7 × 7 = 49 个
14. THE Quiz_Service SHALL 在题库中包含 R18 给出的 3 道示例题（角色第一反应 / 漫展想做什么 / 想找哪种搭子），且这 3 道题 SHALL 在题库元数据中被标记为"路演必跑"

##### 类别 F：漫展 Mock 数据

15. THE Convention_Service SHALL 提供不少于 6 个漫展 mock 卡片，每个卡片 SHALL 包含 R22 第 2 条列出的全部 10 个字段（name、time_range、city、venue、suitable_personas、hot_characters、recommended_outfit、recommended_companion_types、enter_town_cta、related_cosvids_count）
16. THE Convention_Service SHALL 保证 6 个漫展 mock 至少覆盖 3 个不同城市
17. THE Convention_Service SHALL 为每个漫展 mock 关联不少于 3 个视频 ID，所关联的视频 ID SHALL 指向类别 D 的视频 mock 集合

##### 类别 G：搭子 Mock 数据

18. THE Companion_Match SHALL 提供不少于 20 个搭子 NPC mock 卡片，每张卡片 SHALL 包含 R24 第 3 条列出的全部字段
19. FOR ALL 7 类 mascot_type，THE Companion_Match SHALL 在搭子 mock 中保证每类 mascot_type 至少出现 2 张
20. THE Companion_Match SHALL 保证每张搭子 NPC mock 与类别 C 的 NPC sprite 一一关联

##### 类别 H：内容发布模板（Content_Publishing_Funnel）

21. THE Content_Publishing_Funnel SHALL 维护视频脚本模板不少于 5 套，每套 SHALL 包含开头、中间、结尾三段
22. THE Content_Publishing_Funnel SHALL 维护发布文案模板不少于 5 套
23. THE Content_Publishing_Funnel SHALL 维护固定话题标签库不少于 10 个，标签库 SHALL 必须包含 #次元小镇、#二次元搭子、#漫展搭子、#Cos搭子
24. THE Content_Publishing_Funnel SHALL 维护合拍模板不少于 3 套

##### 类别 I：UI 视觉资源

25. THE Render_Engine SHALL 提供 Smallville 风格白底气泡 sprite 不少于 1 张，且 SHALL 包含尾巴朝下变体
26. THE Render_Engine SHALL 提供 DEGRADED MODE 红条样式 SVG 或 CSS 资源 1 套
27. THE Render_Engine SHALL 提供 7 类萌宠图标（用于 Bento Grid 标签）合计不少于 7 张
28. THE Render_Engine SHALL 提供 11 类搭子类型图标（漫展、Cos、拍照、逛摊、买谷、同作品、同城、视频合拍、新手求带、抢限定、二创）合计不少于 11 张
29. THE Render_Engine SHALL 提供 Glassmorphism 卡片背景纹理资源不少于 1 张
30. THE Render_Engine SHALL 提供异世界转生动画粒子贴图与背景图合计不少于 3 张

##### 类别 J：音效与字体

31. THE Render_Engine SHALL 提供异世界转生音效 1 段，时长 SHALL 在 3 至 8 秒之间（与 R2 第 5 条转生动画时长匹配）
32. THE Render_Engine SHALL 提供弹框掉落 SFX 1 段
33. THE Render_Engine SHALL 提供点击与翻页 SFX 合计不少于 3 段
34. THE Render_Engine SHALL 提供萌宠生成成功 BGM 1 段
35. THE Render_Engine SHALL 提供中文像素字体不少于 1 套，字符集 SHALL 覆盖常用 GB2312 字符
36. THE Render_Engine SHALL 提供英文像素字体或罗马音字体不少于 1 套

##### 类别 K：同人作品 Mock（R11 round-trip 测试用）

37. THE Doujin_Generator SHALL 提供同人 mock 作品不少于 5 篇，其中 4 篇 SHALL 为 4 格漫画（含拼接像素图与对白）、1 篇 SHALL 为短小说（不超过 400 字符）
38. FOR ALL 5 篇同人 mock 作品，先序列化再反序列化的结果 SHALL 与原作品语义等价（与 R11 第 7 条 round-trip property 一致）

##### 类别 L：异常场景资源（降级时必须可见）

39. THE Town_System SHALL 提供网络断开提示插画 1 张
40. THE Town_System SHALL 提供转生失败提示插画 1 张
41. THE Town_System SHALL 提供资源加载失败 fallback 像素角色 1 张，该 fallback 角色 SHALL 是 R2 第 6 条 fallback 池中的一员
42. THE Town_System SHALL 提供 DEGRADED MODE 整张静态小镇截图 1 张，用于 Phaser 完全跑不起来时的最终降级展示

##### 来源与授权

43. THE Town_System SHALL 优先选用 CC0、CC-BY、CC-BY-SA 三类许可证的非自制素材
44. FOR ALL 资产文件，THE Town_System SHALL 在 assets/MANIFEST.yaml 中登记 license、source_url、author 三个字段
45. IF 任意素材使用 CC-BY 或 CC-BY-SA 许可证，THEN 项目 README SHALL 在 Credits 段列出该素材的出处与作者
46. THE Town_System SHALL 拒绝使用未授权的 IP 角色直接立绘；角色名可被引用作 mascot 灵感，但 sprite SHALL 由团队自制或采用二创风格化形态

##### 来源策略（推荐优先级）

47. THE Town_System SHALL 按以下优先级顺序选取素材来源：自制（团队美术 / Aseprite / Piskel）、OpenGameArt（LPC / lpc-character-bases）、itch.io（CC0 像素 tileset）、Kenney.nl（公有领域素材）、AI 生图加像素化后处理（Stable Diffusion 配合 ControlNet pixel art LoRA）作为最后兜底

##### 命名规范

48. THE Town_System SHALL 对资产文件强制以下命名规范：Tile 资产 SHALL 命名为 `tile_{biome}_{layer}_{kind}_{variant}.png`；萌宠精灵 SHALL 命名为 `mascot_{mascot_type}_{frame}.png`；NPC 精灵 SHALL 命名为 `npc_{persona_tag}_{slot}_{frame}.png`；漫展卡片图 SHALL 命名为 `con_{city}_{slug}.png`；视频缩略图 SHALL 命名为 `vid_{category}_{slug}.png`；UI 图标 SHALL 命名为 `ui_{kind}_{variant}.svg`

##### Manifest 与启动校验

49. THE Town_System SHALL 在仓库根目录维护 assets/MANIFEST.yaml 文件，文件 SHALL 列出全部资产的 path、category、hash、license、source_url、author、required_for_demo 七个字段
50. WHEN 应用在开发模式或 demo 模式启动，THE Town_System SHALL 校验 MANIFEST.yaml 中所有 required_for_demo=true 的资产文件均存在于磁盘
51. IF 任何 required_for_demo=true 的资产文件缺失，THEN THE Town_System SHALL 中止启动流程并在标准错误流输出缺失资产清单，且 SHALL 不进入 silent fallback
52. THE Town_System SHALL 提供 npm 脚本 `npm run check:assets`，该脚本 SHALL 一键校验全部资产存在性与每条资产的 license 字段非空

##### 体积与性能

53. THE Town_System SHALL 限制单张资产文件大小不超过 1 MB
54. THE Town_System SHALL 限制主 tileset 文件大小不超过 512 KB
55. THE Town_System SHALL 限制萌宠 sprite sheet 单张文件大小不超过 256 KB
56. THE Town_System SHALL 限制全部素材打包后总体积不超过 50 MB

##### Mock 数据集与代码同步

57. THE Town_System SHALL 把类别 D、E、F、G、H、K 的全部 mock 数据打包为独立 npm 包 @erciyuan/mock-town
58. WHEN @erciyuan/mock-town 中任意 mock 数据 schema 发生变更，THE Town_System SHALL 升级该包的 minor 版本号；前端依赖 SHALL 固定到具体版本号
59. THE @erciyuan/mock-town SHALL 导出 TypeScript 类型定义，使前端在编译期即可校验字段完整性

##### 时间窗与责任人

60. THE Town_System SHALL 在 design.md 与 tasks.md 中将"资产准备"显式列为 Pre-Slice（先于 Slice 0 的零号 Slice），作为黑客松开局的第一组任务

---

## Notes — 双链路 Demo

本次新增需求 R17–R28 与既有 R1–R16 共同形成两条**并行的 demo 链路**，供 design.md 后续重排时作为 Slice 锚点：

- **A 链路（路演主线 / 抖音黑客松赛道 1 主推）**：Page_VideoFeed（R17 视频流弹框） → Page_Quiz（R18 测一测） → Page_MascotResult（R19/R20 萌宠生成与结果页） → Page_Recommend（R21/R22/R23 内容与漫展推荐） → Page_Town（R24/R25/R26/R27 小镇 + 搭子 + 内容发布闭环），即 R28 定义的 5 页契约
- **B 链路（小镇深度 / 原 Generative Agents 范式）**：扫码 QR（R1） → 角色生成（R2） → 执念赋予（R3） → 进入 Smallville 风小镇（R7/R15） → 智能体自治与对话（R4/R5/R6/R8） → 仪表盘审计（R13），即原 R1–R16 主链路

两条链路在以下层面共享底座：

- **小镇页面共享同一份 Render_Engine**：A 链路 Page_Town 与 B 链路 R7 渲染同一份 64×64 Tile 地图（在 R25 中扩展为 7 大分区），仅入口不同
- **萌宠 / 角色实体共享同一个 character 表**：mascot_type（R19）与 persona_tag（R2）是同一行 character 表的两个独立字段，分别表征"用户身份"与"NPC 戏路"
- **同一份 Mock 数据集驱动两条链路的降级路径**：当任一后端依赖故障时，两条链路均通过 R28 第 5 条与原 R16 第 5 条规定的 DEGRADED MODE 切回 Mock，画面不停摆
