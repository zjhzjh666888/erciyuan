/**
 * MockTimelineDriver — task 12.1
 *
 * 职责：
 *   1. 把 `@erciyuan/mock-town` 的 ServerMsg / MockRuntimeHandle 等类型 **原样
 *      re-export** 给 RenderEngine。这样 task 12.2 / Slice 5 把数据源从
 *      Mock 切到 LiveDataAdapter 时，RenderEngine 端只需换一个 import 来源即可
 *      （消费侧 schema 不动）。
 *   2. 暴露 `startMockTownRuntime` —— `@erciyuan/mock-town#startRuntime` 的
 *      命名空间稳定别名。RenderEngine 任何时候都不直接 import mock-town
 *      内部模块，只通过这个 driver。
 *   3. 提供 `resolveMascotTypeFromCharId()` 把 mock-town timeline 内置的
 *      `mock_char_{mascot_type}_{slot}` 命名约定还原成 mascot_type。
 *      ServerMsg `pos` 字段不携带 mascot_type，但 spawnSprite 需要它来选
 *      正确的 idle 贴图，因此 RenderEngine 在"首见 character_id"自动
 *      spawnSprite 时通过此 helper 解析。解析失败 → undefined →
 *      TownScene fallback 到 `sprite_default`，不白屏。
 *
 * 设计取舍：
 *   - 仅 re-export 协议层类型 + runtime 入口，**不再 wrap 一层 facade 类**。
 *     12.2 DataAdapter 在 mock | live 两端注入同一份 ServerMsg 时，希望
 *     RenderEngine 的消费代码完全不知道数据源是谁。
 *   - 严格按包名 import：`@erciyuan/mock-town`（npm workspace 已链接），
 *     不走相对路径，避免泄漏内部模块边界。
 */

export { startRuntime as startMockTownRuntime } from '@erciyuan/mock-town'

export type {
  MascotType,
  MockRuntimeHandle,
  ServerMsg,
  StartRuntimeOptions,
  ThoughtTrace,
  TimelineEvent,
} from '@erciyuan/mock-town'

import type { MascotType } from '@erciyuan/mock-town'

/**
 * mock-town `timeline.ts` 与 `companions.ts` 在使用同一套 mascot_type 枚举
 * （见 `@erciyuan/types#MascotType`）。这里复制一份只读集合用于 char_id
 * 解析校验，避免引入 mascotProfiles 的运行时依赖。
 *
 * 与 design.md §1.3 / requirements.md R19.1 的 7 类一一对应。
 */
const KNOWN_MASCOT_TYPES: ReadonlySet<MascotType> = new Set<MascotType>([
  'cat_lore',
  'dog_social',
  'hamster_hoard',
  'fox_create',
  'slime_newbie',
  'wolf_limited',
  'pigeon_buzz',
])

/**
 * 从 `mock_char_{mascot_type}_{slot}` 形态的 character_id 反推 mascot_type。
 *
 * - mascot_type 自身可能含一个下划线（如 `dog_social` / `hamster_hoard`），
 *   因此正则用贪婪 `(.+)` 匹配 mascot_type，末段 `[^_]+$` 吃掉 slot 后缀。
 * - 解析后再用 {@link KNOWN_MASCOT_TYPES} 校验枚举合法性，防止把任意字符串
 *   误传给 spawnSprite。
 *
 * @returns 解析成功返回 7 类之一；否则返回 undefined。
 */
export function resolveMascotTypeFromCharId(charId: string): MascotType | undefined {
  const matched = charId.match(/^mock_char_(.+)_[^_]+$/)
  if (!matched) return undefined
  const candidate = matched[1] as MascotType
  return KNOWN_MASCOT_TYPES.has(candidate) ? candidate : undefined
}
