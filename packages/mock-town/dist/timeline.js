// ─── Demo 角色 ID（与 Mock-Town 全局保持一致） ───────────────────────────────
const ID_DOG = 'mock_char_dog_social_alpha';
const ID_FOX = 'mock_char_fox_create_alpha';
const ID_HAM = 'mock_char_hamster_hoard_alpha';
/** 时间轴起点（demo 录制窗口 2026-08-15 12:00:00 UTC，固定让 round-trip 可重现）。 */
const T0 = 1_755_244_800_000;
/** 工具：根据 at_seconds 计算 UNIX ms 时间戳。 */
const tsAt = (at) => T0 + Math.round(at * 1000);
/** 工具：构造一个 pos 事件。 */
function pos(at, charId, x, y, frame) {
    const msg = { type: 'pos', char_id: charId, x, y, frame, ts: tsAt(at) };
    return { at_seconds: at, msg };
}
/** 工具：构造一个 speech 事件（≤ 80 字符 — design.md §1.4）。 */
function speech(at, charId, text) {
    const msg = { type: 'speech', char_id: charId, text, ts: tsAt(at) };
    return { at_seconds: at, msg };
}
/** 工具：构造一个 action_label 事件（label=null 时清除）。 */
function actionLabel(at, charId, label) {
    const msg = { type: 'action_label', char_id: charId, label, ts: tsAt(at) };
    return { at_seconds: at, msg };
}
/** 工具：构造一个 thought 事件（仪表盘订阅，design.md §3）。 */
function thought(at, charId, trace) {
    const msg = { type: 'thought', char_id: charId, trace };
    return { at_seconds: at, msg };
}
/**
 * 90 秒预录事件流。事件按 `at_seconds` 严格非降序排列；MockTownRuntime 直接
 * 迭代这个数组并通过 `setTimeout` 调度即可让画面"活起来"。
 */
export const timeline = [
    // ─── 0–5s: 3 只萌宠在各自分区入口 spawn ───────────────────────────────
    pos(0.0, ID_DOG, 32, 32, 'idle'), // dog_social 在 Convention_Plaza 中央喷泉
    pos(0.5, ID_FOX, 15, 45, 'idle'), // fox_create 在 Doujin_Atelier 入口
    pos(1.0, ID_HAM, 48, 24, 'idle'), // hamster_hoard 在 Goods_Bazaar 入口
    speech(2.0, ID_DOG, '早上好~ 今天又抢到限定了!!'),
    speech(3.5, ID_FOX, '找搭子拼桌!'),
    speech(4.5, ID_HAM, '今天来盘点新进货~'),
    // ─── 5–20s: 三只萌宠各自走向地标（按时间严格排序，三人交错） ────────
    actionLabel(5.0, ID_DOG, 'is heading to Cos Studio'),
    actionLabel(5.5, ID_FOX, 'is heading to Cos Studio'),
    pos(6.0, ID_DOG, 30, 30, 'walk_left_01'),
    actionLabel(6.0, ID_HAM, 'is heading to goods shelf'),
    pos(7.0, ID_FOX, 15, 40, 'walk_up_01'),
    pos(7.0, ID_HAM, 48, 22, 'walk_up_01'),
    pos(8.0, ID_DOG, 26, 26, 'walk_left_02'),
    pos(9.0, ID_FOX, 16, 33, 'walk_up_02'),
    pos(9.0, ID_HAM, 49, 20, 'walk_up_02'),
    pos(10.0, ID_DOG, 22, 22, 'walk_left_03'),
    pos(11.0, ID_FOX, 16, 26, 'walk_up_03'),
    pos(11.0, ID_HAM, 50, 18, 'idle'),
    actionLabel(11.1, ID_HAM, null),
    pos(12.0, ID_DOG, 18, 18, 'walk_left_04'),
    speech(12.0, ID_HAM, '限定吧唧 6 折！整套带走~'),
    pos(13.0, ID_FOX, 17, 20, 'walk_up_04'),
    pos(13.5, ID_DOG, 16, 16, 'idle'),
    actionLabel(13.6, ID_DOG, null),
    speech(14.0, ID_DOG, '等到你了~ 反光板支起来了!'),
    pos(15.0, ID_FOX, 17, 17, 'idle'),
    actionLabel(15.1, ID_FOX, null),
    speech(16.0, ID_FOX, '今天主题：黄泉×钟离 4-koma'),
    speech(18.0, ID_HAM, '黄泉立牌 *5 入库！'),
    // ─── 20–60s: dog_social × fox_create 在 Cos_Studio 的 4 行 meet-up ─────
    actionLabel(20.0, ID_DOG, 'is taking photos with Fox'),
    actionLabel(20.5, ID_FOX, 'is sketching at the studio'),
    speech(22.0, ID_DOG, '镜头我来扛~ 你站光圈中心!'),
    pos(24.0, ID_DOG, 17, 16, 'walk_right_01'),
    pos(26.0, ID_DOG, 18, 16, 'idle'),
    speech(27.0, ID_FOX, '我把构图分镜画好了，看!'),
    pos(29.0, ID_FOX, 17, 18, 'walk_down_01'),
    pos(30.5, ID_FOX, 17, 18, 'idle'),
    speech(33.0, ID_DOG, '逆光这一帧 + 反光板补脸~'),
    pos(36.0, ID_DOG, 19, 17, 'walk_right_02'),
    pos(38.0, ID_DOG, 19, 17, 'idle'),
    speech(40.0, ID_FOX, '出片就靠你了。三、二、一!'),
    pos(45.0, ID_DOG, 18, 18, 'idle'),
    pos(47.0, ID_FOX, 17, 17, 'idle'),
    speech(50.0, ID_DOG, '这张绝对能上 #漫展搭子 热搜!'),
    speech(55.0, ID_FOX, '回去就剪 AMV~'),
    actionLabel(58.0, ID_DOG, null),
    actionLabel(58.5, ID_FOX, null),
    // ─── 60–85s: hamster_hoard 在 Goods_Bazaar 数吧唧 ─────────────────────
    actionLabel(60.0, ID_HAM, 'is counting bookmarks'),
    speech(62.0, ID_HAM, '1, 2, 3 …… 28 个原神吧唧!'),
    pos(64.0, ID_HAM, 50, 19, 'walk_down_01'),
    pos(65.5, ID_HAM, 50, 19, 'idle'),
    speech(68.0, ID_HAM, '崩铁全套 32，少一张希儿……'),
    pos(72.0, ID_HAM, 51, 19, 'walk_right_01'),
    pos(73.5, ID_HAM, 51, 19, 'idle'),
    actionLabel(75.0, ID_HAM, 'is sorting acrylic standees'),
    speech(78.0, ID_HAM, '全部归我~ 全部归我~'),
    speech(82.0, ID_HAM, '今晚还要 0 点抢 CP29 限定!'),
    actionLabel(84.5, ID_HAM, null),
    // ─── 85–90s: dog_social 一条完整 thought_trace 推送仪表盘 ─────────────
    thought(85.0, ID_DOG, {
        trace_id: 'trace_demo_dog_001',
        character_id: ID_DOG,
        ts: tsAt(85.0),
        observation: 'I just finished a 4-line photoshoot exchange with fox_create at Cos_Studio. Lighting was good, partner seemed satisfied.',
        plan: 'Edit the best 3 frames into a duet draft → tag #次元小镇 → push to Content_Publishing_Funnel.',
        next_action: { kind: 'speak', target_char: ID_FOX, text: '今天的合拍稿我先剪一版~' },
        speech: '今天的合拍稿我先剪一版~',
    }),
    speech(86.5, ID_DOG, '今天的合拍稿我先剪一版~'),
    speech(88.0, ID_FOX, '我去画 thumbnail!'),
    speech(89.5, ID_HAM, '下次见~ 别忘抢限定!'),
];
//# sourceMappingURL=timeline.js.map