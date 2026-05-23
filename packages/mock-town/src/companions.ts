/**
 * `companions.ts` — 搭子 NPC mock 卡片（task 9.4）。
 *
 * **契约（requirements.md R29.18–20 + R24.3）：**
 *   - ≥ 20 个搭子 NPC
 *   - 7 类 mascot_type 各 ≥ 2 个
 *   - 每张卡片含 R24.3 全部字段：mascot_avatar / mascot_type / display_name /
 *     common_interests / match_score / target_convention_id /
 *     wanted_companion_types / ice_breaker
 *   - 每张 mock 与类别 C 的 NPC sprite **一一关联**（npc_sprite_path）
 *
 * **NPC sprite 路径规范**（design.md §Asset Pipeline §1）：
 *     `assets/npc/{persona_tag}/{slot:02d}/idle.png`
 *
 * 这里 persona_tag 与卡片视觉风格挂钩（不直接显示给用户，只是 sprite 索引）：
 *   - cat_lore     → tennen / sanmu     （内向 / 文静）
 *   - dog_social   → tsundere / chuuni  （外向 / 闹腾）
 *   - hamster_hoard→ tennen / hara_guro （囤囤 / 心机）
 *   - fox_create   → chuuni / sanmu     （艺术 / 沉默）
 *   - slime_newbie → tennen              （懵懂）
 *   - wolf_limited → hara_guro / yandere（执念）
 *   - pigeon_buzz  → tsundere / chuuni  （八卦 / 中二）
 *
 * 卡片中的 `target_convention_id` 引用 {@link conventions} 集合的 ID。
 */
import type { CompanionCard } from '@erciyuan/types'

/**
 * 搭子 NPC mock 集合（22 个，超过 R29.18 下限）。
 *
 * 7 类 mascot_type 分布：
 *   - cat_lore       × 3
 *   - dog_social     × 4
 *   - hamster_hoard  × 3
 *   - fox_create     × 3
 *   - slime_newbie   × 3
 *   - wolf_limited   × 3
 *   - pigeon_buzz    × 3
 */
export const companions: CompanionCard[] = [
  // ── cat_lore × 3 ─────────────────────────────────────────────────────────
  {
    companion_id: 'cmp_cat_001',
    mascot_avatar: 'assets/mascots/cat_lore/portrait_64.png',
    mascot_type: 'cat_lore',
    display_name: '考据酱·凛',
    common_interests: ['芙莉莲时间线', '原著党', '世界设定'],
    match_score: 92,
    target_convention_id: 'conv_cdcc_2026',
    wanted_companion_types: ['same_ip', 'doujin'],
    ice_breaker: '听说你也在追芙莉莲的时间线？我整理了一份按章节的考据笔记~',
    is_npc: true,
    npc_sprite_path: 'assets/npc/sanmu/01/idle.png',
  },
  {
    companion_id: 'cmp_cat_002',
    mascot_avatar: 'assets/mascots/cat_lore/portrait_64.png',
    mascot_type: 'cat_lore',
    display_name: '原典派·夜白',
    common_interests: ['EVA 解读', '末日感', '设定集收藏'],
    match_score: 87,
    wanted_companion_types: ['same_ip', 'doujin'],
    ice_breaker: 'EVA 新剧场版 24 话的镜头我能逐帧讲三小时，要听吗？',
    is_npc: true,
    npc_sprite_path: 'assets/npc/tennen/01/idle.png',
  },
  {
    companion_id: 'cmp_cat_003',
    mascot_avatar: 'assets/mascots/cat_lore/portrait_64.png',
    mascot_type: 'cat_lore',
    display_name: '资料库管理员',
    common_interests: ['Fate 系谱', 'Type-Moon', '英灵考据'],
    match_score: 81,
    target_convention_id: 'conv_cdcc_2026',
    wanted_companion_types: ['same_ip', 'photo'],
    ice_breaker: '阿尔托利亚 vs 葛饰北斋你站谁？我能列十条理由解释为什么是后者。',
    is_npc: true,
    npc_sprite_path: 'assets/npc/sanmu/02/idle.png',
  },

  // ── dog_social × 4 ───────────────────────────────────────────────────────
  {
    companion_id: 'cmp_dog_001',
    mascot_avatar: 'assets/mascots/dog_social/portrait_64.png',
    mascot_type: 'dog_social',
    display_name: '扩列犬·阿汪',
    common_interests: ['漫展 vlog', '同城聚会', '咒术回战'],
    match_score: 95,
    target_convention_id: 'conv_ido_2026_summer',
    wanted_companion_types: ['convention', 'cos', 'same_city'],
    ice_breaker: 'IDO 我要去三天，第二天五条悟联谊摊见？带名片！',
    is_npc: true,
    npc_sprite_path: 'assets/npc/tsundere/01/idle.png',
  },
  {
    companion_id: 'cmp_dog_002',
    mascot_avatar: 'assets/mascots/dog_social/portrait_64.png',
    mascot_type: 'dog_social',
    display_name: '社交达人·小桃',
    common_interests: ['同人志摊主', '炭治郎 cos', '拍立得'],
    match_score: 90,
    target_convention_id: 'conv_ccg_2026_winter',
    wanted_companion_types: ['photo', 'duet', 'cos'],
    ice_breaker: '跨年夜一起拍炭治郎×祢豆子双人合拍呗！我有反光板！',
    is_npc: true,
    npc_sprite_path: 'assets/npc/chuuni/01/idle.png',
  },
  {
    companion_id: 'cmp_dog_003',
    mascot_avatar: 'assets/mascots/dog_social/portrait_64.png',
    mascot_type: 'dog_social',
    display_name: '热场担当·麻里',
    common_interests: ['LoveLive', '应援团', '现场打 call'],
    match_score: 88,
    target_convention_id: 'conv_ido_2026_summer',
    wanted_companion_types: ['duet', 'convention', 'newbie'],
    ice_breaker: '带新人入坑 LL 是我的乐趣，要一起练 Snow halation 的应援吗？',
    is_npc: true,
    npc_sprite_path: 'assets/npc/tsundere/02/idle.png',
  },
  {
    companion_id: 'cmp_dog_004',
    mascot_avatar: 'assets/mascots/dog_social/portrait_64.png',
    mascot_type: 'dog_social',
    display_name: '广场之王·豆豆',
    common_interests: ['漫展场控', '看 cos 走秀', '同好聚餐'],
    match_score: 84,
    target_convention_id: 'conv_firefly_gz_2026',
    wanted_companion_types: ['convention', 'same_city', 'photo'],
    ice_breaker: '萤火虫第二天我组了 10 人聚餐，差你一个！',
    is_npc: true,
    npc_sprite_path: 'assets/npc/chuuni/02/idle.png',
  },

  // ── hamster_hoard × 3 ────────────────────────────────────────────────────
  {
    companion_id: 'cmp_ham_001',
    mascot_avatar: 'assets/mascots/hamster_hoard/portrait_64.png',
    mascot_type: 'hamster_hoard',
    display_name: '囤囤鼠·小米',
    common_interests: ['吧唧收集', '黄泉痛包', '原神限定'],
    match_score: 96,
    target_convention_id: 'conv_cp_hz_2026',
    wanted_companion_types: ['goods', 'limited', 'booth'],
    ice_breaker: 'CP29 黄泉吧唧我组了一个 10 人拼单，余 1 位~',
    is_npc: true,
    npc_sprite_path: 'assets/npc/tennen/03/idle.png',
  },
  {
    companion_id: 'cmp_ham_002',
    mascot_avatar: 'assets/mascots/hamster_hoard/portrait_64.png',
    mascot_type: 'hamster_hoard',
    display_name: '谷子守护者',
    common_interests: ['立牌排列癖', '海贼王手办', '便携痛包'],
    match_score: 89,
    target_convention_id: 'conv_ccg_2026',
    wanted_companion_types: ['goods', 'booth', 'same_ip'],
    ice_breaker: 'CCG 限定立牌我画了排队最优路线图，要不要看？',
    is_npc: true,
    npc_sprite_path: 'assets/npc/hara_guro/01/idle.png',
  },
  {
    companion_id: 'cmp_ham_003',
    mascot_avatar: 'assets/mascots/hamster_hoard/portrait_64.png',
    mascot_type: 'hamster_hoard',
    display_name: '徽章帝·阿橡',
    common_interests: ['火影徽章', '复古谷子', '怀旧 IP'],
    match_score: 82,
    wanted_companion_types: ['goods', 'doujin'],
    ice_breaker: '我有 2008 年的初版鸣人徽章，想交换菲伦立牌可以聊~',
    is_npc: true,
    npc_sprite_path: 'assets/npc/tennen/04/idle.png',
  },

  // ── fox_create × 3 ───────────────────────────────────────────────────────
  {
    companion_id: 'cmp_fox_001',
    mascot_avatar: 'assets/mascots/fox_create/portrait_64.png',
    mascot_type: 'fox_create',
    display_name: '太太狐·墨狐',
    common_interests: ['四格漫画', '钟离×黄泉', '同人本'],
    match_score: 94,
    target_convention_id: 'conv_cdcc_2026',
    wanted_companion_types: ['doujin', 'same_ip'],
    ice_breaker: '我开了一本钟离×黄泉的本子，差一个上色搭子！',
    is_npc: true,
    npc_sprite_path: 'assets/npc/chuuni/03/idle.png',
  },
  {
    companion_id: 'cmp_fox_002',
    mascot_avatar: 'assets/mascots/fox_create/portrait_64.png',
    mascot_type: 'fox_create',
    display_name: '画板狐·苍墨',
    common_interests: ['Cos 摄影', '逆光打光', '咒术回战二创'],
    match_score: 91,
    target_convention_id: 'conv_ido_2026_summer',
    wanted_companion_types: ['photo', 'doujin', 'cos'],
    ice_breaker: '五条悟逆光打光我有一套构图模板，要不要试拍？',
    is_npc: true,
    npc_sprite_path: 'assets/npc/sanmu/03/idle.png',
  },
  {
    companion_id: 'cmp_fox_003',
    mascot_avatar: 'assets/mascots/fox_create/portrait_64.png',
    mascot_type: 'fox_create',
    display_name: '剧本狐·夜墨',
    common_interests: ['剧情同人', '玛奇玛 OOC', 'AMV 剪辑'],
    match_score: 86,
    wanted_companion_types: ['doujin', 'duet'],
    ice_breaker: '我写了一段玛奇玛×阿丽塔的女王对话，要不要给配个 AMV？',
    is_npc: true,
    npc_sprite_path: 'assets/npc/chuuni/04/idle.png',
  },

  // ── slime_newbie × 3 ─────────────────────────────────────────────────────
  {
    companion_id: 'cmp_slime_001',
    mascot_avatar: 'assets/mascots/slime_newbie/portrait_64.png',
    mascot_type: 'slime_newbie',
    display_name: '云仔·咕嘟',
    common_interests: ['第一次逛漫展', '萌新求带', '阿尼亚'],
    match_score: 78,
    target_convention_id: 'conv_firefly_gz_2026',
    wanted_companion_types: ['newbie', 'same_city'],
    ice_breaker: '我第一次去漫展，紧张到睡不着……可以求带吗？',
    is_npc: true,
    npc_sprite_path: 'assets/npc/tennen/05/idle.png',
  },
  {
    companion_id: 'cmp_slime_002',
    mascot_avatar: 'assets/mascots/slime_newbie/portrait_64.png',
    mascot_type: 'slime_newbie',
    display_name: '果冻·小蓝',
    common_interests: ['萌新友好', '间谍过家家', '初次 cos'],
    match_score: 80,
    target_convention_id: 'conv_ccg_2026_winter',
    wanted_companion_types: ['newbie', 'cos'],
    ice_breaker: '想 cos 阿尼亚但发型贴片不会贴…在线求救！',
    is_npc: true,
    npc_sprite_path: 'assets/npc/tennen/02/idle.png',
  },
  {
    companion_id: 'cmp_slime_003',
    mascot_avatar: 'assets/mascots/slime_newbie/portrait_64.png',
    mascot_type: 'slime_newbie',
    display_name: '萌新云仔·豆乳',
    common_interests: ['初心者', 'lovelive 入坑', '同城接引'],
    match_score: 75,
    wanted_companion_types: ['newbie', 'duet'],
    ice_breaker: '想入 LL 不知道从哪一代开始？请神带~',
    is_npc: true,
    npc_sprite_path: 'assets/npc/tennen/01/idle.png',
  },

  // ── wolf_limited × 3 ─────────────────────────────────────────────────────
  {
    companion_id: 'cmp_wolf_001',
    mascot_avatar: 'assets/mascots/wolf_limited/portrait_64.png',
    mascot_type: 'wolf_limited',
    display_name: '限定狼·孤狙',
    common_interests: ['限定狙击', '抢票黄牛战', '崩铁全套'],
    match_score: 93,
    target_convention_id: 'conv_cp_hz_2026',
    wanted_companion_types: ['limited', 'goods'],
    ice_breaker: 'CP29 黄泉立牌我盯了三周，组队抢有信心 0 漏？',
    is_npc: true,
    npc_sprite_path: 'assets/npc/hara_guro/02/idle.png',
  },
  {
    companion_id: 'cmp_wolf_002',
    mascot_avatar: 'assets/mascots/wolf_limited/portrait_64.png',
    mascot_type: 'wolf_limited',
    display_name: '夜行狼·影刃',
    common_interests: ['抢票', '黄牛对线', '海贼王限定'],
    match_score: 85,
    target_convention_id: 'conv_ccg_2026',
    wanted_companion_types: ['limited', 'convention'],
    ice_breaker: 'CCG 三天票我蹲到了首发窗口，要不要分一张？',
    is_npc: true,
    npc_sprite_path: 'assets/npc/yandere/01/idle.png',
  },
  {
    companion_id: 'cmp_wolf_003',
    mascot_avatar: 'assets/mascots/wolf_limited/portrait_64.png',
    mascot_type: 'wolf_limited',
    display_name: '独行狼·寒霜',
    common_interests: ['周边二级市场', '价格趋势', '稀有度排行'],
    match_score: 79,
    wanted_companion_types: ['limited', 'goods'],
    ice_breaker: '我建了一个稀有度趋势表 Excel，要不要一起追？',
    is_npc: true,
    npc_sprite_path: 'assets/npc/hara_guro/03/idle.png',
  },

  // ── pigeon_buzz × 3 ──────────────────────────────────────────────────────
  {
    companion_id: 'cmp_pigeon_001',
    mascot_avatar: 'assets/mascots/pigeon_buzz/portrait_64.png',
    mascot_type: 'pigeon_buzz',
    display_name: '咕咕鸽·情报',
    common_interests: ['情报广场', '同人圈八卦', '新番速报'],
    match_score: 88,
    target_convention_id: 'conv_ido_2026_summer',
    wanted_companion_types: ['duet', 'doujin'],
    ice_breaker: '今天 IDO 现场 CP 联谊摊有大瓜，要一起去围观吗？',
    is_npc: true,
    npc_sprite_path: 'assets/npc/tsundere/03/idle.png',
  },
  {
    companion_id: 'cmp_pigeon_002',
    mascot_avatar: 'assets/mascots/pigeon_buzz/portrait_64.png',
    mascot_type: 'pigeon_buzz',
    display_name: '麦克风鸽·咕咕',
    common_interests: ['现场播报', 'cos 走秀解说', '热搜榜单'],
    match_score: 83,
    target_convention_id: 'conv_firefly_gz_2026',
    wanted_companion_types: ['duet', 'convention'],
    ice_breaker: '萤火虫走秀我会带麦做现场解说，缺一个搭档主播~',
    is_npc: true,
    npc_sprite_path: 'assets/npc/chuuni/05/idle.png',
  },
  {
    companion_id: 'cmp_pigeon_003',
    mascot_avatar: 'assets/mascots/pigeon_buzz/portrait_64.png',
    mascot_type: 'pigeon_buzz',
    display_name: '热搜鸽·咕喵',
    common_interests: ['番剧排行榜', '我推的孩子', '吐槽大会'],
    match_score: 77,
    wanted_companion_types: ['duet', 'same_ip'],
    ice_breaker: '我推第二季最新一话你看了吗？我有十条爆点想讨论！',
    is_npc: true,
    npc_sprite_path: 'assets/npc/tsundere/04/idle.png',
  },
]
