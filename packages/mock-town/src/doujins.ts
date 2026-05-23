/**
 * `doujins.ts` — 同人 mock 作品（task 9.7）。
 *
 * **契约（requirements.md R29.37–38 + R11）：**
 *   - ≥ 5 篇同人作品
 *   - 4 篇 4-koma（恰好 4 个 panel，每格 caption ≤ 30 字符）
 *   - 1 篇短小说（text 长度 ≤ 400 字符）
 *   - 全部通过 R11 round-trip property（serialize/deserialize 后语义等价）
 *
 * **图片 URL 来源**：本地素材图片，存放在 public/assets/doujin/ 目录下。
 *
 * **CP / 联动主题**（task 上下文指定）：
 *   1. 钟离 × 黄泉（原神 × 崩铁联动梗）
 *   2. 葛饰北斋 × 阿尔托利亚（FGO 内部 CP）
 *   3. 五条悟 × 伊地知（咒术回战师徒梗）
 *   4. 玛奇玛 × 阿丽塔（女王之间相遇）
 *   5. 短小说：芙莉莲与海尔的酒馆夜谈（葬送的芙莉莲 + 路人原创联动）
 */
import type { Doujin } from '@erciyuan/types'

/**
 * 同人作品 mock 集合。
 *
 * 5 篇全部带 `created_at`，时间戳来自一段固定的 demo 录制窗口
 * （2026-08-15 上海 CCG 漫展期间）以保证 round-trip 测试的可重现。
 */
export const doujins: Doujin[] = [
  // ─── 1. 钟离 × 黄泉（原神 × 崩铁） ──────────────────────────────────────
  {
    doujin_id: 'doujin_zhongli_huangquan_001',
    characters: ['char_genshin_zhongli', 'char_hsr_huangquan'],
    kind: 'comic_4koma',
    payload: {
      kind: 'comic_4koma',
      panels: [
        {
          image_url: '/assets/doujin/02607c46070b166e7665306eea239adf.png',
          caption: '钟离：摩拉，又涨价了。',
        },
        {
          image_url: '/assets/doujin/0293911a32a6135ef7171cd395f5f30b.jpg',
          caption: '黄泉：可惜本姑娘只收灵子。',
        },
        {
          image_url: '/assets/doujin/08e60b159e820a1e652cb968bd6477b4.png',
          caption: '钟离掏出了岩王帝君的板砖。',
        },
        {
          image_url: '/assets/doujin/14a892a4a4ecdf92a4cc85e6b6ca3ac6.jpg',
          caption: '黄泉：……换算下来三毛二。',
        },
      ],
    },
    watermark: '次元小镇 · @erciyuan-doujin',
    created_at: 1755244800000, // 2026-08-15 12:00:00 UTC
  },

  // ─── 2. 葛饰北斋 × 阿尔托利亚（FGO） ────────────────────────────────────
  {
    doujin_id: 'doujin_hokusai_artoria_002',
    characters: ['char_fgo_hokusai', 'char_fgo_artoria'],
    kind: 'comic_4koma',
    payload: {
      kind: 'comic_4koma',
      panels: [
        {
          image_url: '/assets/doujin/3323ef486e62e1df4a774064f2233205.png',
          caption: '北斋：师匠借王の财宝一用。',
        },
        {
          image_url: '/assets/doujin/3f7f0ffa5e2f6818aaa935d5db077222.jpg',
          caption: '阿尔托利亚：那是金闪闪的。',
        },
        {
          image_url: '/assets/doujin/41a947e7dc07dede84d537367237f289.png',
          caption: '北斋：那借石中剑总行了？',
        },
        {
          image_url: '/assets/doujin/50cd5be37edd2022acb7b7eb30f8ce1b.png',
          caption: '阿尔托利亚：你画神奈川啊。',
        },
      ],
    },
    watermark: '次元小镇 · @erciyuan-doujin',
    created_at: 1755253800000, // 2026-08-15 14:30:00 UTC
  },

  // ─── 3. 五条悟 × 伊地知（咒术回战师徒梗） ───────────────────────────────
  {
    doujin_id: 'doujin_gojo_ijichi_003',
    characters: ['char_jjk_gojo', 'char_jjk_ijichi'],
    kind: 'comic_4koma',
    payload: {
      kind: 'comic_4koma',
      panels: [
        {
          image_url: '/assets/doujin/5219f15d6defa7072fc75f83f340436e.jpg',
          caption: '伊地知：老师，加班费。',
        },
        {
          image_url: '/assets/doujin/747126ede1ecd8927ec74eced3cc5fe6.jpg',
          caption: '五条：用六眼看了，没钱。',
        },
        {
          image_url: '/assets/doujin/7f2964a7d26131f089e63c00c3e85501.jpg',
          caption: '伊地知掏出了辞职信。',
        },
        {
          image_url: '/assets/doujin/88b9f22cbcdbb002878199abb1699467.png',
          caption: '五条：发，我马上发。',
        },
      ],
    },
    watermark: '次元小镇 · @erciyuan-doujin',
    created_at: 1755262800000, // 2026-08-15 17:00:00 UTC
  },

  // ─── 4. 玛奇玛 × 阿丽塔（女王对话） ─────────────────────────────────────
  {
    doujin_id: 'doujin_makima_alita_004',
    characters: ['char_csm_makima', 'char_alita'],
    kind: 'comic_4koma',
    payload: {
      kind: 'comic_4koma',
      panels: [
        {
          image_url: '/assets/doujin/89106a5553331e6c29b2b7fc014e4e80.jpg',
          caption: '玛奇玛：当我的狗吗？',
        },
        {
          image_url: '/assets/doujin/8b1bf364faaac6e6c4786bce266375f2.png',
          caption: '阿丽塔：我是机械天使。',
        },
        {
          image_url: '/assets/doujin/9860364be1c545e989941729d670809f.jpg',
          caption: '玛奇玛微笑递出狗绳。',
        },
        {
          image_url: '/assets/doujin/a31e53e19bcd60aa83165eeba7297399.jpg',
          caption: '阿丽塔：那么，开战。',
        },
      ],
    },
    watermark: '次元小镇 · @erciyuan-doujin',
    created_at: 1755271800000, // 2026-08-15 19:30:00 UTC
  },

  // ─── 5. 短小说：芙莉莲的酒馆夜谈 ────────────────────────────────────────
  {
    doujin_id: 'doujin_frieren_novel_005',
    characters: ['char_frieren', 'char_heiter'],
    kind: 'novel_short',
    payload: {
      kind: 'novel_short',
      text:
        '酒馆灯火将熄。芙莉莲坐在窗边，杯中麦酒已浅。' +
        '海塔尔推门进来，肩上落了夜露。「你又在数星星？」他问。' +
        '芙莉莲没有回头。「是数被遗忘的人。」' +
        '海塔尔把酒杯轻轻放在她面前，那是她从未喝完的那一杯。' +
        '「那今晚，先把我数进去吧。」他说。' +
        '芙莉莲终于笑了一下。八十年后她会在墓前再笑一次，' +
        '但今晚她什么都没说，只是把酒喝完。',
    },
    watermark: '次元小镇 · @erciyuan-doujin',
    created_at: 1755280800000, // 2026-08-15 22:00:00 UTC
  },
]
