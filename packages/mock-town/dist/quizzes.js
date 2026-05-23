/**
 * 工具：把仅含部分 mascot_type 的对象补全为完整 7 类权重，未指定的填 0。
 * 让后续 49 个权重的字面量写起来更紧凑而不丢类型安全。
 */
function w(partial) {
    return {
        cat_lore: partial.cat_lore ?? 0,
        dog_social: partial.dog_social ?? 0,
        hamster_hoard: partial.hamster_hoard ?? 0,
        fox_create: partial.fox_create ?? 0,
        slime_newbie: partial.slime_newbie ?? 0,
        wolf_limited: partial.wolf_limited ?? 0,
        pigeon_buzz: partial.pigeon_buzz ?? 0,
    };
}
/** 工具：把 7 个选项装进 QuizQuestion 所要求的 fixed-tuple 形态。 */
function opts(list) {
    if (list.length !== 7) {
        throw new Error(`[mock-town/quizzes] 每题必须恰好 7 个选项，收到 ${list.length}`);
    }
    const made = list.map(([key, text, weights]) => ({ key, text, weights }));
    return made;
}
/**
 * 题库集合（共 15 题；前 3 道为 R29.14 / R18 指定的「路演必跑」示例题）。
 */
export const quizzes = [
    // ─── Q1 must_run · 角色第一反应 ─────────────────────────────────────────
    {
        question_id: 'q_first_reaction',
        prompt: '看到本命角色出场的瞬间，你的第一反应是？',
        must_run: true,
        is_dynamic: false,
        options: opts([
            ['A', '马上打开维基逐帧考据 Ta 的台词', w({ cat_lore: 0.95, fox_create: 0.2 })],
            ['B', '截屏发到三个群里安利！', w({ dog_social: 0.9, pigeon_buzz: 0.6 })],
            ['C', '查一下 Ta 的周边什么时候发售', w({ hamster_hoard: 0.95, wolf_limited: 0.5 })],
            ['D', '打开画板想画一张同人', w({ fox_create: 0.95, cat_lore: 0.2 })],
            ['E', '愣住，这是谁？我也想入', w({ slime_newbie: 0.9 })],
            ['F', '盯紧今晚限定吧唧抢购链接', w({ wolf_limited: 0.95, hamster_hoard: 0.4 })],
            ['G', '冲到广场跟所有人聊这一帧', w({ pigeon_buzz: 0.95, dog_social: 0.4 })],
        ]),
    },
    // ─── Q2 must_run · 漫展想做什么 ─────────────────────────────────────────
    {
        question_id: 'q_convention_first_move',
        prompt: '走进漫展第一件想做的事是？',
        must_run: true,
        is_dynamic: false,
        options: opts([
            ['A', '去考据展区翻设定集', w({ cat_lore: 0.9, fox_create: 0.2 })],
            ['B', '给同好刷脸扩列发名片', w({ dog_social: 0.95, pigeon_buzz: 0.5 })],
            ['C', '冲到立牌区先排谷子队', w({ hamster_hoard: 0.95, wolf_limited: 0.5 })],
            ['D', '找 Cos 摄影位约拍出片', w({ fox_create: 0.85, dog_social: 0.4 })],
            ['E', '跟着指引牌慢慢逛', w({ slime_newbie: 0.95 })],
            ['F', '直奔限定首发狙一波', w({ wolf_limited: 0.95, hamster_hoard: 0.5 })],
            ['G', '现场围观 cos 走秀蹲热搜', w({ pigeon_buzz: 0.95, dog_social: 0.3 })],
        ]),
    },
    // ─── Q3 must_run · 想找哪种搭子 ─────────────────────────────────────────
    {
        question_id: 'q_companion_type_pref',
        prompt: '你最想找一个怎样的二次元搭子？',
        must_run: true,
        is_dynamic: false,
        options: opts([
            ['A', '能跟我聊原著时间线考据的', w({ cat_lore: 0.95, fox_create: 0.2 })],
            ['B', '一起在漫展拍立得扩列的', w({ dog_social: 0.95, pigeon_buzz: 0.4 })],
            ['C', '能拼吧唧整套谷子的', w({ hamster_hoard: 0.95, wolf_limited: 0.4 })],
            ['D', '画本子能合作的太太', w({ fox_create: 0.95 })],
            ['E', '能带我入坑的萌新友好型', w({ slime_newbie: 0.95, dog_social: 0.2 })],
            ['F', '能熬夜陪我抢限定的战友', w({ wolf_limited: 0.95, hamster_hoard: 0.4 })],
            ['G', '同好聊天总有新瓜的', w({ pigeon_buzz: 0.95, dog_social: 0.3 })],
        ]),
    },
    // ─── Q4 · 看到限量谷子的反应 ────────────────────────────────────────────
    {
        question_id: 'q_limited_goods_reaction',
        prompt: '官方上架了限量 200 套的本命徽章，你？',
        must_run: false,
        is_dynamic: false,
        options: opts([
            ['A', '先研究图案是不是动画原画师亲签', w({ cat_lore: 0.85, fox_create: 0.2 })],
            ['B', '群里喊话组团拼单', w({ dog_social: 0.7, hamster_hoard: 0.6 })],
            ['C', '一次买全套放进收藏柜', w({ hamster_hoard: 0.95 })],
            ['D', '画一张同人当售空补偿', w({ fox_create: 0.8 })],
            ['E', '观望，不太懂算不算贵', w({ slime_newbie: 0.95 })],
            ['F', '设三个备用号 0 点开抢', w({ wolf_limited: 0.95 })],
            ['G', '马上发抖音播报上架', w({ pigeon_buzz: 0.85 })],
        ]),
    },
    // ─── Q5 · 周末理想的二次元活动 ──────────────────────────────────────────
    {
        question_id: 'q_weekend_ideal',
        prompt: '理想的周末二次元活动是？',
        must_run: false,
        is_dynamic: false,
        options: opts([
            ['A', '关灯重看 EVA 旧剧场版做笔记', w({ cat_lore: 0.95 })],
            ['B', '约 5 个同好去咖啡馆扩列', w({ dog_social: 0.95 })],
            ['C', '去吧唧专卖店把货架翻一遍', w({ hamster_hoard: 0.9 })],
            ['D', '宅家画 8 小时同人本', w({ fox_create: 0.95 })],
            ['E', '随便刷刷看大家在做什么', w({ slime_newbie: 0.95 })],
            ['F', '蹲二级市场捡稀有谷子', w({ wolf_limited: 0.85, hamster_hoard: 0.4 })],
            ['G', '直播解说本周番剧 TOP 10', w({ pigeon_buzz: 0.95 })],
        ]),
    },
    // ─── Q6 · 看新番时的关注点 ──────────────────────────────────────────────
    {
        question_id: 'q_new_anime_focus',
        prompt: '看新番时你最先关注的是？',
        must_run: false,
        is_dynamic: false,
        options: opts([
            ['A', '原作章节对应、改编忠实度', w({ cat_lore: 0.95 })],
            ['B', '哪个角色能拉群讨论', w({ dog_social: 0.85, pigeon_buzz: 0.4 })],
            ['C', '会不会出谷子', w({ hamster_hoard: 0.9 })],
            ['D', 'CP 党争空间，画本子的潜力', w({ fox_create: 0.9 })],
            ['E', '需要补几集前情才看得懂', w({ slime_newbie: 0.95 })],
            ['F', '会不会出限定 BD 套装', w({ wolf_limited: 0.85 })],
            ['G', '今晚弹幕和热搜话题', w({ pigeon_buzz: 0.95 })],
        ]),
    },
    // ─── Q7 · 同人创作偏好 ──────────────────────────────────────────────────
    {
        question_id: 'q_doujin_pref',
        prompt: '在同人创作中，你最在乎的是？',
        must_run: false,
        is_dynamic: false,
        options: opts([
            ['A', '人物关系符合原作', w({ cat_lore: 0.85, fox_create: 0.5 })],
            ['B', '能不能在群里收获鼓励', w({ dog_social: 0.8, fox_create: 0.4 })],
            ['C', '能不能印成本子卖', w({ hamster_hoard: 0.7, fox_create: 0.5 })],
            ['D', '画风/分镜的实验性', w({ fox_create: 0.95 })],
            ['E', '我从没创作过，求带', w({ slime_newbie: 0.9 })],
            ['F', '初版限量发售的稀缺性', w({ wolf_limited: 0.7, hamster_hoard: 0.5 })],
            ['G', '能不能搭上当下热搜', w({ pigeon_buzz: 0.9 })],
        ]),
    },
    // ─── Q8 · 在线社群中的角色 ──────────────────────────────────────────────
    {
        question_id: 'q_community_role',
        prompt: '在二次元社群里你扮演的角色更像？',
        must_run: false,
        is_dynamic: false,
        options: opts([
            ['A', '资料库管理员，纠错型选手', w({ cat_lore: 0.95 })],
            ['B', '群里最爱发表情包的扩列王', w({ dog_social: 0.95 })],
            ['C', '群文件里的拼单组织者', w({ hamster_hoard: 0.85 })],
            ['D', '画师/写手，定期发摸鱼', w({ fox_create: 0.9 })],
            ['E', '潜水围观，偶尔冒泡问问题', w({ slime_newbie: 0.95 })],
            ['F', '抢票群专员，蹲回血代抢', w({ wolf_limited: 0.9 })],
            ['G', '信息搬运工，第一时间转情报', w({ pigeon_buzz: 0.95 })],
        ]),
    },
    // ─── Q9 · OOC 态度 ──────────────────────────────────────────────────────
    {
        question_id: 'q_ooc_attitude',
        prompt: '别人写了 OOC 的同人，你的态度？',
        must_run: false,
        is_dynamic: false,
        options: opts([
            ['A', '不能忍，私信原作要修', w({ cat_lore: 0.9 })],
            ['B', '不喜欢就跳过，群里聊别的', w({ dog_social: 0.6, slime_newbie: 0.4 })],
            ['C', 'OOC 也能出周边就不亏', w({ hamster_hoard: 0.6 })],
            ['D', 'OOC 有时反而打开新维度', w({ fox_create: 0.9 })],
            ['E', '我都看不出来 OOC 在哪', w({ slime_newbie: 0.95 })],
            ['F', '收藏向：限定 OOC 版可以入', w({ wolf_limited: 0.6, hamster_hoard: 0.4 })],
            ['G', '打开吐槽贴大家一起评', w({ pigeon_buzz: 0.9 })],
        ]),
    },
    // ─── Q10 · 看到本命角色 cos ─────────────────────────────────────────────
    {
        question_id: 'q_see_oshi_cos',
        prompt: '在漫展看到本命角色高完成度 Cos，你？',
        must_run: false,
        is_dynamic: false,
        options: opts([
            ['A', '从妆造到武器逐项考据复刻度', w({ cat_lore: 0.95 })],
            ['B', '冲过去要联系方式扩列', w({ dog_social: 0.95 })],
            ['C', '问 Ta 周边在哪买的', w({ hamster_hoard: 0.85 })],
            ['D', '约 Ta 一起拍同人构图', w({ fox_create: 0.9, dog_social: 0.4 })],
            ['E', '紧张到只敢偷看', w({ slime_newbie: 0.95 })],
            ['F', '问限定服装是不是首批入手', w({ wolf_limited: 0.85 })],
            ['G', '拍下来当晚发热搜', w({ pigeon_buzz: 0.95 })],
        ]),
    },
    // ─── Q11 · 漫展现场迷路 ────────────────────────────────────────────────
    {
        question_id: 'q_lost_in_convention',
        prompt: '漫展现场你在 A 馆迷路了，怎么办？',
        must_run: false,
        is_dynamic: false,
        options: opts([
            ['A', '掏出展会手册照路线核对', w({ cat_lore: 0.85 })],
            ['B', '随便找个 cos 大佬扩列搭路', w({ dog_social: 0.95 })],
            ['C', '先去最近的谷子摊补血', w({ hamster_hoard: 0.85 })],
            ['D', '在原地速写一张迷路同人', w({ fox_create: 0.85 })],
            ['E', '哭哭，求路过萌新带我', w({ slime_newbie: 0.95 })],
            ['F', '查抢限定的最优路径再走', w({ wolf_limited: 0.85 })],
            ['G', '发条动态求路况广播', w({ pigeon_buzz: 0.9 })],
        ]),
    },
    // ─── Q12 · cos 本命角色 ────────────────────────────────────────────────
    {
        question_id: 'q_cos_my_oshi',
        prompt: '你 cos 自己本命角色时，最在意？',
        must_run: false,
        is_dynamic: false,
        options: opts([
            ['A', '细节是否 100% 还原原作', w({ cat_lore: 0.95 })],
            ['B', '能不能现场和同好合影', w({ dog_social: 0.9 })],
            ['C', '配饰道具是不是官方周边', w({ hamster_hoard: 0.85 })],
            ['D', '出片角度和后期空间', w({ fox_create: 0.9 })],
            ['E', '能不能不出戏不被识破菜', w({ slime_newbie: 0.95 })],
            ['F', '是不是限定首发版本', w({ wolf_limited: 0.85 })],
            ['G', '能不能上当天热搜话题', w({ pigeon_buzz: 0.9 })],
        ]),
    },
    // ─── Q13 · 同好群讨论 ──────────────────────────────────────────────────
    {
        question_id: 'q_group_discussion',
        prompt: '同好群里突然炸开一个话题，你？',
        must_run: false,
        is_dynamic: false,
        options: opts([
            ['A', '考据原典，给出权威结论', w({ cat_lore: 0.95 })],
            ['B', '在群里发 100 个表情包参与', w({ dog_social: 0.9, pigeon_buzz: 0.4 })],
            ['C', '默默截图存进谷子素材库', w({ hamster_hoard: 0.7 })],
            ['D', '把话题画成四格漫画', w({ fox_create: 0.9 })],
            ['E', '谨慎围观，怕说错被嘲', w({ slime_newbie: 0.95 })],
            ['F', '迅速判断有没有限定的可能', w({ wolf_limited: 0.6 })],
            ['G', '复制一份转发到三个群', w({ pigeon_buzz: 0.95 })],
        ]),
    },
    // ─── Q14 · 痛包搭配偏好 ────────────────────────────────────────────────
    {
        question_id: 'q_itasha_style',
        prompt: '关于痛包/痛屋陈列，你的风格更偏？',
        must_run: false,
        is_dynamic: false,
        options: opts([
            ['A', '严格按原作时间线分区陈列', w({ cat_lore: 0.95 })],
            ['B', '朋友送的应援徽章占主位', w({ dog_social: 0.85 })],
            ['C', '一墙立牌严丝合缝排列', w({ hamster_hoard: 0.95 })],
            ['D', '挂自己画的同人海报', w({ fox_create: 0.9 })],
            ['E', '只有一两个本命，但很爱', w({ slime_newbie: 0.85 })],
            ['F', '每件都是限定首发版本', w({ wolf_limited: 0.95 })],
            ['G', '当下最热的角色一律上墙', w({ pigeon_buzz: 0.85 })],
        ]),
    },
    // ─── Q15 · 想去的漫展类型 ──────────────────────────────────────────────
    {
        question_id: 'q_dream_convention',
        prompt: '你最想参加的漫展类型是？',
        must_run: false,
        is_dynamic: false,
        options: opts([
            ['A', '原作官方设定展，看一手资料', w({ cat_lore: 0.95 })],
            ['B', '人最多最热闹的大型联展', w({ dog_social: 0.85, pigeon_buzz: 0.4 })],
            ['C', '只卖谷子的同人即售会', w({ hamster_hoard: 0.95 })],
            ['D', '同人志专场 Comitia', w({ fox_create: 0.95 })],
            ['E', '本地小型新人友好场', w({ slime_newbie: 0.95 })],
            ['F', '限定首发独占的特别展', w({ wolf_limited: 0.95 })],
            ['G', '直播覆盖到的话题热度王', w({ pigeon_buzz: 0.95 })],
        ]),
    },
];
//# sourceMappingURL=quizzes.js.map