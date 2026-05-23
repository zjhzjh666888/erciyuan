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
import type { MockVideoCard } from '@erciyuan/types';
/**
 * 视频流 mock 数据集合。
 *
 * 共 12 条，覆盖 9 类二次元 video_tags。每条卡片可被以下消费者使用：
 *   - Page_VideoFeed（task 14.1）→ 抖音风竖屏视频流
 *   - Douyin_Stream_Hook（task 14.2）→ 弹框 contextual_intent 来源
 *   - 漫展详情页（task 15.4）→ 通过 `video_id` 反向被
 *     {@link conventions.related_video_ids} 引用
 */
export declare const videos: MockVideoCard[];
//# sourceMappingURL=videos.d.ts.map