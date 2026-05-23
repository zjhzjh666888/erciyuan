/**
 * `publish_templates.ts` — 内容发布模板集合（task 9.6）。
 *
 * **契约（requirements.md R29.21–24 + R27.2）：**
 *   - 视频脚本 ≥ 5 套，每套含开头/中间/结尾三段
 *   - 发布文案 ≥ 5 套
 *   - 话题标签 ≥ 10 个，**必含** `#次元小镇 #二次元搭子 #漫展搭子 #Cos搭子`
 *   - 合拍模板 ≥ 3 套
 *
 * **占位符约定**：模板字符串中 `{mascot_name}` / `{convention_name}` /
 * `{ip}` / `{partner_name}` / `{cos_character}` 等占位符，由 task 18.6
 * 的 `Content_Publishing_Funnel` 在生成草稿时按上下文替换。
 */
import type { PublishTemplates } from '@erciyuan/types';
/**
 * 内容发布模板单一聚合常量。
 *
 * 由 `Content_Publishing_Funnel`（task 18.6）作为草稿生成的素材池消费。
 */
export declare const publishTemplates: PublishTemplates;
//# sourceMappingURL=publish_templates.d.ts.map