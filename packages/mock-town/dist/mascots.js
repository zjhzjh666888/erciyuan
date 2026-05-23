/**
 * 7 类萌宠 → MascotProfile 的完整映射。
 *
 * 颜色对应 `_generate-real-assets.mjs` `MASCOT_COLORS[*].body` 的 RGB 值：
 *   - cat_lore       = rgb(167,139,250) = #A78BFA（紫，原作党气场）
 *   - dog_social     = rgb(255,168,100) = #FFA864（橙，社交热情）
 *   - hamster_hoard  = rgb(216,197,168) = #D8C5A8（米色，囤积温感）
 *   - fox_create     = rgb(240,220,200) = #F0DCC8（奶白，创作冷静）
 *   - slime_newbie   = rgb(168,216,255) = #A8D8FF（浅蓝，懵懂果冻）
 *   - wolf_limited   = rgb( 50, 80,130) = #325082（深蓝，狙击专注）
 *   - pigeon_buzz    = rgb(255,200,220) = #FFC8DC（粉，情报雀跃）
 */
export const mascotProfiles = {
    // ── 考据猫 Neko-ko（紫色 / 设定考据 / 原作党） ───────────────────────────
    cat_lore: {
        mascot_type: 'cat_lore',
        display_name_zh: '考据猫 ねこ・こ',
        display_name_romaji: 'Neko-ko',
        core_traits: ['原作党 / 设定考据', '时间线纠错员', '冷面吐槽 / 一针见血', '资料库小管家'],
        recommended_zone: 'Buzz_Square',
        companion_types: ['same_ip', 'doujin'],
        catchphrase: {
            zh: '原作里没有的设定一律不算！',
            romaji: 'Gensaku ni nai settei wa zen-bu nashi!',
        },
        core_functions: ['原作剧情解析', '角色考据 / 设定校对', '识别云玩家', '为同人党提供事实底座'],
        persona_color: '#A78BFA',
    },
    // ── 扩列犬 Wan-kyun（橙色 / 社交担当 / 漫展王者） ─────────────────────────
    dog_social: {
        mascot_type: 'dog_social',
        display_name_zh: '扩列犬 わん・くん',
        display_name_romaji: 'Wan-kyun',
        core_traits: ['热情外放 / 自来熟', '同好聚会发起人', '现场气氛担当', '名片堆成山'],
        recommended_zone: 'Convention_Plaza',
        companion_types: ['convention', 'cos', 'photo', 'same_city', 'duet'],
        catchphrase: {
            zh: '一起去漫展呀！我有名片！',
            romaji: 'Issho ni ibento iko-yo! Meishi aru-yo!',
        },
        core_functions: ['漫展同行匹配', '现场打 call / 场控', '同城聚会组织', '破冰文案撩同好'],
        persona_color: '#FFA864',
    },
    // ── 囤囤鼠 Ham-guu（米色 / 谷子收藏 / 拼单狂魔） ──────────────────────────
    hamster_hoard: {
        mascot_type: 'hamster_hoard',
        display_name_zh: '囤囤鼠 はむ・ぐう',
        display_name_romaji: 'Ham-guu',
        core_traits: ['吧唧立牌收集癖', '拼单狂魔', '稀有度雷达', '排队最优解决策师'],
        recommended_zone: 'Goods_Bazaar',
        companion_types: ['goods', 'booth', 'limited', 'same_ip'],
        catchphrase: {
            zh: '这个吧唧——必须囤！',
            romaji: 'Kono badge wa zettai gettoda!',
        },
        core_functions: ['谷子拼单组队', '排队最优路线规划', '稀有度趋势追踪', '痛包搭配建议'],
        persona_color: '#D8C5A8',
    },
    // ── 太太狐 Fox-sensei（奶白 / 二创灵魂 / 同人党） ────────────────────────
    fox_create: {
        mascot_type: 'fox_create',
        display_name_zh: '太太狐 きつね先生',
        display_name_romaji: 'Fox-sensei',
        core_traits: ['同人创作灵魂', '剧情脑洞王', '上色 / 分镜 / AMV 全能', 'OOC 雷达'],
        recommended_zone: 'Doujin_Atelier',
        companion_types: ['doujin', 'cos', 'photo', 'duet', 'same_ip'],
        catchphrase: {
            zh: '这对 CP——我先开本子了！',
            romaji: 'Kono CP, watashi ga hon o akeru!',
        },
        core_functions: ['四格漫画 / 短篇生成', '同人作品配图', 'Cos 分镜模板', 'AMV 剪辑灵感'],
        persona_color: '#F0DCC8',
    },
    // ── 云仔 Slime-mo（浅蓝 / 萌新接引 / 求带选手） ──────────────────────────
    slime_newbie: {
        mascot_type: 'slime_newbie',
        display_name_zh: '云仔 すらいむも',
        display_name_romaji: 'Slime-mo',
        core_traits: ['萌新友好', '求带学徒', '云玩家心态', '入坑指南收藏家'],
        recommended_zone: 'Newbie_Lobby',
        companion_types: ['newbie', 'same_ip', 'same_city'],
        catchphrase: {
            zh: '我第一次……请神带带我！',
            romaji: 'Hajimete nan da... onegai senpai!',
        },
        core_functions: ['入坑路线推荐', '萌新求带匹配', '安全友好的破冰文案', '兜底人格（向量冲突默认）'],
        persona_color: '#A8D8FF',
    },
    // ── 限定狼 Lone-wolf（深蓝 / 限定狙击 / 抢票之神） ───────────────────────
    wolf_limited: {
        mascot_type: 'wolf_limited',
        display_name_zh: '限定狼 ろーん・うるふ',
        display_name_romaji: 'Lone-wolf',
        core_traits: ['限定狙击专精', '黄牛对线选手', '冷酷 / 执念', '价格趋势分析师'],
        recommended_zone: 'Limited_Info_House',
        companion_types: ['limited', 'goods', 'convention'],
        catchphrase: {
            zh: '0:00 准时开抢，0 漏一个不留。',
            romaji: 'Reji-zero, mōrasanai, hitotsu mo.',
        },
        core_functions: ['限定情报推送', '抢票组队 / 多账号狙击', '二级市场行情', '稀有度排行表'],
        persona_color: '#325082',
    },
    // ── 咕咕鸽 Pigeon-nya（粉 / 情报八卦 / 现场播报） ────────────────────────
    pigeon_buzz: {
        mascot_type: 'pigeon_buzz',
        display_name_zh: '咕咕鸽 ぴじょん・にゃ',
        display_name_romaji: 'Pigeon-nya',
        core_traits: ['情报雷达', '同人圈八卦中心', '现场麦克风担当', '热搜榜搬运工'],
        recommended_zone: 'Buzz_Square',
        companion_types: ['duet', 'convention', 'same_ip'],
        catchphrase: {
            zh: '今天的瓜——咕咕已就绪！',
            romaji: 'Kyō no goshippu — gugu, junbi kanryō!',
        },
        core_functions: ['番剧热度速报', '现场 cos 走秀解说', '党争 / 党版动向追踪', '热搜榜单整理'],
        persona_color: '#FFC8DC',
    },
};
/**
 * 查询单个 mascot 的完整 9 字段档案（task 14.4 Mascot_System 直接转发）。
 *
 * @param mascot_type 7 类 mascot_type 之一
 * @returns 该 mascot 的完整档案
 */
export function getMascotProfile(mascot_type) {
    return mascotProfiles[mascot_type];
}
//# sourceMappingURL=mascots.js.map