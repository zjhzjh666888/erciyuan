/**
 * `videos.ts` — A 链路 Page_VideoFeed 视频流 mock 数据（task 9.2）。
 *
 * **契约（requirements.md R29.11–12）：**
 *   - ≥ 12 条视频
 *   - 集合至少覆盖 9 类 video_tags（cosplay / convention_vlog / anime_review /
 *     character_analysis / goods_unboxing / figure / anime_outfit /
 *     local_convention / doujin_edit），每类至少 1 条
 *   - 每条卡片字段齐全：thumbnail（≥ 540×960，由 `?w=540&h=960&fit=crop` URL
 *     参数固定）、author_name、avatar、title、video_tags、contextual_intent、
 *     duration、play_count
 *
 * **缩略图来源**：Unsplash `images.unsplash.com/photo-{id}` 直接 URL（合法
 * 商用免费，详见 https://unsplash.com/license），按 cosplay/anime-cosplay/
 * comic-con 关键词挑选。
 *
 * **作品 IP 范围**：仅引用极广为人知的公共 IP 与角色名（原神、崩铁、鬼灭、
 * 链锯人、咒术回战、间谍过家家、葬送的芙莉莲、火影、海贼王、EVA、FATE、
 * lovelive、星穹铁道、蔚蓝档案、明日方舟），符合 R29.46「拒绝未授权 IP
 * 角色立绘」的边界（mock 卡片仅含 metadata，非角色立绘）。
 */
import type { MockVideoCard } from '@erciyuan/types'

/**
 * 视频流 mock 数据集合。
 *
 * 共 12 条，覆盖 9 类二次元 video_tags。每条卡片可被以下消费者使用：
 *   - Page_VideoFeed（task 14.1）→ 抖音风竖屏视频流
 *   - Douyin_Stream_Hook（task 14.2）→ 弹框 contextual_intent 来源
 *   - 漫展详情页（task 15.4）→ 通过 `video_id` 反向被
 *     {@link conventions.related_video_ids} 引用
 */
export const videos: MockVideoCard[] = [
  {
    video_id: 'vid_001',
    thumbnail:
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=540&h=960&fit=crop',
    author_name: '雷电将军本电',
    avatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop',
    title: '【原神 Cos】雷电将军一刀斩 · 雷神之眼神还原',
    video_tags: ['cosplay'],
    contextual_intent: {
      ip: '原神',
      cos_character: '雷电将军',
      note: '武戏 Cos 高燃剪辑',
    },
    duration: 35,
    play_count: 1_240_000,
  },
  {
    video_id: 'vid_002',
    thumbnail:
      'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=540&h=960&fit=crop',
    author_name: '阿尼亚花生',
    avatar:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=128&h=128&fit=crop',
    title: '【间谍过家家】阿尼亚 waku waku 表情包 100 连',
    video_tags: ['cosplay', 'character_analysis'],
    contextual_intent: {
      ip: '间谍过家家',
      cos_character: '阿尼亚·福杰',
      note: '萌系日常向 Cos',
    },
    duration: 28,
    play_count: 3_580_000,
  },
  {
    video_id: 'vid_003',
    thumbnail:
      'https://images.unsplash.com/photo-1606814893907-c2e42943c91f?w=540&h=960&fit=crop',
    author_name: '上海 CCG 现场',
    avatar:
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=128&h=128&fit=crop',
    title: 'CCG EXPO 2026 vlog · 限定立牌排队 6 小时实录',
    video_tags: ['convention_vlog', 'local_convention'],
    contextual_intent: {
      ip: '原神',
      note: '上海新国际博览中心 · 抢限定纪实',
    },
    duration: 75,
    play_count: 890_000,
  },
  {
    video_id: 'vid_004',
    thumbnail:
      'https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=540&h=960&fit=crop',
    author_name: '北京 IDO 现场',
    avatar:
      'https://images.unsplash.com/photo-1599410096836-fb7c43ac827d?w=128&h=128&fit=crop',
    title: 'IDO 漫展逛吃 vlog · 国家会议中心一日游',
    video_tags: ['convention_vlog', 'local_convention'],
    contextual_intent: {
      ip: '咒术回战',
      cos_character: '五条悟',
      note: '北京 IDO 漫展同人 Cos 联动',
    },
    duration: 92,
    play_count: 612_000,
  },
  {
    video_id: 'vid_005',
    thumbnail:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=540&h=960&fit=crop',
    author_name: '考据狂魔小狮',
    avatar:
      'https://images.unsplash.com/photo-1614729375290-b2a429db839b?w=128&h=128&fit=crop',
    title: '【葬送的芙莉莲】芙莉莲到底活了几岁？时间线全梳理',
    video_tags: ['anime_review', 'character_analysis'],
    contextual_intent: {
      ip: '葬送的芙莉莲',
      cos_character: '芙莉莲',
      note: '深度时间线考据向解说',
    },
    duration: 480,
    play_count: 2_140_000,
  },
  {
    video_id: 'vid_006',
    thumbnail:
      'https://images.unsplash.com/photo-1633613286848-e6f43bbafb8d?w=540&h=960&fit=crop',
    author_name: '我推星野爱',
    avatar:
      'https://images.unsplash.com/photo-1611162616305-c69b3037c7bb?w=128&h=128&fit=crop',
    title: '【我推的孩子】星野爱第一集封神 7 分钟，看哭了',
    video_tags: ['anime_review'],
    contextual_intent: {
      ip: '我推的孩子',
      cos_character: '星野爱',
      note: '番剧名场面解说',
    },
    duration: 420,
    play_count: 1_780_000,
  },
  {
    video_id: 'vid_007',
    thumbnail:
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=540&h=960&fit=crop',
    author_name: '玛奇玛大小姐',
    avatar:
      'https://images.unsplash.com/photo-1612036781124-847f8939b154?w=128&h=128&fit=crop',
    title: '【链锯人】玛奇玛人物分析 · 她到底想要什么',
    video_tags: ['character_analysis'],
    contextual_intent: {
      ip: '链锯人',
      cos_character: '玛奇玛',
      note: '反派人物深度分析',
    },
    duration: 540,
    play_count: 1_320_000,
  },
  {
    video_id: 'vid_008',
    thumbnail:
      'https://images.unsplash.com/photo-1545987796-200677ee1011?w=540&h=960&fit=crop',
    author_name: '囤囤鼠日记',
    avatar:
      'https://images.unsplash.com/photo-1543076659-9380cdf10613?w=128&h=128&fit=crop',
    title: '【谷子开箱】CCG 限定徽章一整套 · 含黄泉立牌',
    video_tags: ['goods_unboxing'],
    contextual_intent: {
      ip: '崩坏：星穹铁道',
      cos_character: '黄泉',
      note: '吧唧痛包开箱',
    },
    duration: 240,
    play_count: 980_000,
  },
  {
    video_id: 'vid_009',
    thumbnail:
      'https://images.unsplash.com/photo-1583338917451-faae5e9b5727?w=540&h=960&fit=crop',
    author_name: 'Figure 收藏家阿宅',
    avatar:
      'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=128&h=128&fit=crop',
    title: '【手办开箱】GSC 黏土人 · 炭治郎 + 祢豆子双人套',
    video_tags: ['figure', 'goods_unboxing'],
    contextual_intent: {
      ip: '鬼灭之刃',
      cos_character: '炭治郎',
      note: '黏土人开箱测评',
    },
    duration: 360,
    play_count: 740_000,
  },
  {
    video_id: 'vid_010',
    thumbnail:
      'https://images.unsplash.com/photo-1599410096836-fb7c43ac827d?w=540&h=960&fit=crop',
    author_name: '蔚蓝档案穿搭',
    avatar:
      'https://images.unsplash.com/photo-1611042553484-d61f84d22784?w=128&h=128&fit=crop',
    title: '【二次元穿搭】学院风 JK · 蔚蓝档案私服灵感',
    video_tags: ['anime_outfit'],
    contextual_intent: {
      ip: '蔚蓝档案',
      note: 'JK 制服 + 周边搭子日常穿搭',
    },
    duration: 60,
    play_count: 540_000,
  },
  {
    video_id: 'vid_011',
    thumbnail:
      'https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=540&h=960&fit=crop',
    author_name: '广州萤火虫现场',
    avatar:
      'https://images.unsplash.com/photo-1582980637181-fbb2418fae6c?w=128&h=128&fit=crop',
    title: '【同城漫展】萤火虫漫展三天逛摊总攻略',
    video_tags: ['local_convention', 'convention_vlog'],
    contextual_intent: {
      ip: '明日方舟',
      cos_character: '阿米娅',
      note: '广州保利世贸 · 同城漫展攻略',
    },
    duration: 180,
    play_count: 460_000,
  },
  {
    video_id: 'vid_012',
    thumbnail:
      'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=540&h=960&fit=crop',
    author_name: '剪刀手太太',
    avatar:
      'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=128&h=128&fit=crop',
    title: '【二创剪辑】五条悟×伊地知 · 师徒名场面 AMV',
    video_tags: ['doujin_edit', 'character_analysis'],
    contextual_intent: {
      ip: '咒术回战',
      cos_character: '五条悟',
      note: '师徒情向二创剪辑',
    },
    duration: 96,
    play_count: 2_360_000,
  },
]
