// ─── helper: 生成 sprite_path（保证与 companions.ts 命名严格一致） ────────
function spritePath(persona, idx) {
    const nn = String(idx).padStart(2, '0');
    return `assets/npc/${persona}/${nn}/idle.png`;
}
/**
 * 30 个 NPC 数据（6 类 × 5 个）。
 *
 * 命名风格按 persona_tag 区分气质：
 *   - tsundere（傲娇）   ：御坂 / 凉宫 / 朝比奈 系
 *   - yandere（病娇）    ：由乃 / 雪穗 / 暗夜系
 *   - tennen（天然呆）   ：天子 / 阿国 / 软糯系
 *   - chuuni（中二病）   ：六花 / 闇夜 / 漆黑之翼系
 *   - sanmu（三无）      ：绫波 / 长门 / 冷静淡漠系
 *   - hara_guro（腹黑）  ：神乐 / 麻奇玛 / 表柔实危
 */
export const npcs = [
    // ── 傲娇 tsundere × 5 ────────────────────────────────────────────────────
    {
        npc_id: 'npc_tsundere_01',
        persona_tag: 'tsundere',
        npc_index: 1,
        name: '小冰 こおり',
        catchphrase: '才……才不是为你做的呢！别误会！',
        sprite_path: spritePath('tsundere', 1),
    },
    {
        npc_id: 'npc_tsundere_02',
        persona_tag: 'tsundere',
        npc_index: 2,
        name: '凉风 すずか',
        catchphrase: '哼！区区这种程度，谁都做得到吧？',
        sprite_path: spritePath('tsundere', 2),
    },
    {
        npc_id: 'npc_tsundere_03',
        persona_tag: 'tsundere',
        npc_index: 3,
        name: '朝比 あさひ',
        catchphrase: '别、别看着我！我才没紧张！',
        sprite_path: spritePath('tsundere', 3),
    },
    {
        npc_id: 'npc_tsundere_04',
        persona_tag: 'tsundere',
        npc_index: 4,
        name: '红羽 べに',
        catchphrase: '笨蛋！这种小事我自己能搞定！',
        sprite_path: spritePath('tsundere', 4),
    },
    {
        npc_id: 'npc_tsundere_05',
        persona_tag: 'tsundere',
        npc_index: 5,
        name: '美琴 みこと',
        catchphrase: '想求我帮忙的话——先把表情收一收！',
        sprite_path: spritePath('tsundere', 5),
    },
    // ── 病娇 yandere × 5 ─────────────────────────────────────────────────────
    {
        npc_id: 'npc_yandere_01',
        persona_tag: 'yandere',
        npc_index: 1,
        name: '由乃 ゆの',
        catchphrase: '你只能看着我哦~只能看着我一个人哦~',
        sprite_path: spritePath('yandere', 1),
    },
    {
        npc_id: 'npc_yandere_02',
        persona_tag: 'yandere',
        npc_index: 2,
        name: '雪穗 ゆきほ',
        catchphrase: '不要离开我……我会很难过的，真的。',
        sprite_path: spritePath('yandere', 2),
    },
    {
        npc_id: 'npc_yandere_03',
        persona_tag: 'yandere',
        npc_index: 3,
        name: '暗音 やみね',
        catchphrase: '今天和谁说话了？……一个一个告诉我。',
        sprite_path: spritePath('yandere', 3),
    },
    {
        npc_id: 'npc_yandere_04',
        persona_tag: 'yandere',
        npc_index: 4,
        name: '茜夜 あかね',
        catchphrase: '你的位置是我的座标——别想走开。',
        sprite_path: spritePath('yandere', 4),
    },
    {
        npc_id: 'npc_yandere_05',
        persona_tag: 'yandere',
        npc_index: 5,
        name: '黑姫 くろひめ',
        catchphrase: '永远——永远，对吧？答应过我的呢。',
        sprite_path: spritePath('yandere', 5),
    },
    // ── 天然呆 tennen × 5 ────────────────────────────────────────────────────
    {
        npc_id: 'npc_tennen_01',
        persona_tag: 'tennen',
        npc_index: 1,
        name: '阿国 おくに',
        catchphrase: '嗯？是这样的吗？我以为是那样的呢~',
        sprite_path: spritePath('tennen', 1),
    },
    {
        npc_id: 'npc_tennen_02',
        persona_tag: 'tennen',
        npc_index: 2,
        name: '小白 こはく',
        catchphrase: '咦——刚刚说到哪儿了来着？嘿嘿~',
        sprite_path: spritePath('tennen', 2),
    },
    {
        npc_id: 'npc_tennen_03',
        persona_tag: 'tennen',
        npc_index: 3,
        name: '天子 てんし',
        catchphrase: '哇啊——这个软软的、真的好治愈呀！',
        sprite_path: spritePath('tennen', 3),
    },
    {
        npc_id: 'npc_tennen_04',
        persona_tag: 'tennen',
        npc_index: 4,
        name: '柚奈 ゆな',
        catchphrase: '诶？！原来漫展是要排队的吗……',
        sprite_path: spritePath('tennen', 4),
    },
    {
        npc_id: 'npc_tennen_05',
        persona_tag: 'tennen',
        npc_index: 5,
        name: '小桃 もも',
        catchphrase: '今天的天空——是布丁的颜色呢！',
        sprite_path: spritePath('tennen', 5),
    },
    // ── 中二病 chuuni × 5 ────────────────────────────────────────────────────
    {
        npc_id: 'npc_chuuni_01',
        persona_tag: 'chuuni',
        npc_index: 1,
        name: '六花 りっか',
        catchphrase: '我的右手——正在燃烧！封印解除！',
        sprite_path: spritePath('chuuni', 1),
    },
    {
        npc_id: 'npc_chuuni_02',
        persona_tag: 'chuuni',
        npc_index: 2,
        name: '闇夜 やみよ',
        catchphrase: '黑炎之翼，听从于我——展开！',
        sprite_path: spritePath('chuuni', 2),
    },
    {
        npc_id: 'npc_chuuni_03',
        persona_tag: 'chuuni',
        npc_index: 3,
        name: '深红 しんく',
        catchphrase: '愚者啊——见识真正的混沌之力吧！',
        sprite_path: spritePath('chuuni', 3),
    },
    {
        npc_id: 'npc_chuuni_04',
        persona_tag: 'chuuni',
        npc_index: 4,
        name: '苍月 そうげつ',
        catchphrase: '真名是不能被随便念出口的——啧。',
        sprite_path: spritePath('chuuni', 4),
    },
    {
        npc_id: 'npc_chuuni_05',
        persona_tag: 'chuuni',
        npc_index: 5,
        name: '漆黑 しっこく',
        catchphrase: '这个世界——是为了我而存在的舞台！',
        sprite_path: spritePath('chuuni', 5),
    },
    // ── 三无 sanmu × 5 ───────────────────────────────────────────────────────
    {
        npc_id: 'npc_sanmu_01',
        persona_tag: 'sanmu',
        npc_index: 1,
        name: '绫凪 あやなぎ',
        catchphrase: '……嗯。',
        sprite_path: spritePath('sanmu', 1),
    },
    {
        npc_id: 'npc_sanmu_02',
        persona_tag: 'sanmu',
        npc_index: 2,
        name: '长月 ながつき',
        catchphrase: '没必要回答，问题本身就不成立。',
        sprite_path: spritePath('sanmu', 2),
    },
    {
        npc_id: 'npc_sanmu_03',
        persona_tag: 'sanmu',
        npc_index: 3,
        name: '雾子 きりこ',
        catchphrase: '……（沉默地点了点头）',
        sprite_path: spritePath('sanmu', 3),
    },
    {
        npc_id: 'npc_sanmu_04',
        persona_tag: 'sanmu',
        npc_index: 4,
        name: '冷音 れいね',
        catchphrase: '感情？我没有这个数据。',
        sprite_path: spritePath('sanmu', 4),
    },
    {
        npc_id: 'npc_sanmu_05',
        persona_tag: 'sanmu',
        npc_index: 5,
        name: '静波 しずな',
        catchphrase: '……请讲。我在听。',
        sprite_path: spritePath('sanmu', 5),
    },
    // ── 腹黑 hara_guro × 5 ───────────────────────────────────────────────────
    {
        npc_id: 'npc_hara_guro_01',
        persona_tag: 'hara_guro',
        npc_index: 1,
        name: '神乐 かぐら',
        catchphrase: '你猜我会不会，真的杀了你呢~？',
        sprite_path: spritePath('hara_guro', 1),
    },
    {
        npc_id: 'npc_hara_guro_02',
        persona_tag: 'hara_guro',
        npc_index: 2,
        name: '麻吉 まきま',
        catchphrase: '听话哦——不然，你知道会怎样的。',
        sprite_path: spritePath('hara_guro', 2),
    },
    {
        npc_id: 'npc_hara_guro_03',
        persona_tag: 'hara_guro',
        npc_index: 3,
        name: '紫苑 しおん',
        catchphrase: '诶？我可没说哦。是你自己听到的嘛~',
        sprite_path: spritePath('hara_guro', 3),
    },
    {
        npc_id: 'npc_hara_guro_04',
        persona_tag: 'hara_guro',
        npc_index: 4,
        name: '夜露 よつゆ',
        catchphrase: '微笑哦——表面看起来温柔就够了。',
        sprite_path: spritePath('hara_guro', 4),
    },
    {
        npc_id: 'npc_hara_guro_05',
        persona_tag: 'hara_guro',
        npc_index: 5,
        name: '白蛇 はくじゃ',
        catchphrase: '所有人都被我算进去了——包括你。',
        sprite_path: spritePath('hara_guro', 5),
    },
];
//# sourceMappingURL=npcs.js.map