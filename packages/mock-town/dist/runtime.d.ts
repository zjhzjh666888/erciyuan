/**
 * `runtime.ts` — MockTownRuntime（task 9.9 + 12.6）。
 *
 * **职责**：按 {@link timeline} 的 `at_seconds` 顺序，通过 `setTimeout` 调度发射
 * 每条 {@link ServerMsg}，让 Render_Engine + Observation_Dashboard 在零后端
 * 依赖的情况下"看起来活着"。
 *
 * **接口契约**（design.md §Mock-First Demo Pipeline）：
 *
 *     startRuntime({ onEvent, loop, onError }): MockRuntimeHandle
 *
 *   - `onEvent(msg)` 每发射一条 ServerMsg 调用一次，调用方将其转发给
 *     Phaser Scene 与 Bento Grid Dashboard
 *   - `loop=true`（默认）：90 秒末尾事件触发后，自动重新调度整段时间轴
 *   - `onError(err)`（task 12.6）：runtime 内部 catch 到非订阅者级别的致命
 *     错误时调用，让上层（RenderEngine）感知并切红条；本回调出错会被
 *     静默吞掉
 *   - 句柄 `stop()` 清空所有定时器
 *   - 句柄 `jumpTo(seconds)` 跳到给定秒，**跳过 at_seconds < seconds 的事件**，
 *     从指定时间继续调度（demo 现场可手动跳到精彩片段）
 *   - 句柄 `_forceFallback(reason?)`（task 12.6）：调用方（RenderEngine 或
 *     测试夹具）触发的"硬降级"通道。runtime 会停止 timeline scheduler，
 *     改用 `setInterval(fn, 1000)` 1s 一拍循环轮播全量事件，保证画面继续动
 *     不白屏（design.md §Mock-First Cookbook）
 *
 * **关键约束**：
 *   1. 不依赖 Node `setTimeout` 类型与 Browser `setTimeout` 类型差异 ——
 *      使用 `ReturnType<typeof setTimeout>` 以同时兼容两端
 *   2. 同一 timeline 数组不重复修改，避免 `loop` 时累积副作用
 *   3. `stop()` 之后再调 `jumpTo()` / `_forceFallback()` / 重复 `stop()`
 *      必须幂等无副作用
 *   4. onEvent 抛错被捕获，不影响后续事件；schedule 整体抛错走 onError
 *      并自动切到 `_forceFallback`，避免静态画面
 */
import type { MockRuntimeHandle, StartRuntimeOptions } from '@erciyuan/types';
import { timeline } from './timeline.js';
/**
 * 启动 90 秒循环的"假小镇"事件发射器。
 *
 * 使用方式：
 *
 *     const handle = startRuntime({
 *       onEvent: (msg) => syncBus.dispatch(msg),
 *       loop: true,
 *       onError: (err) => engine.setDegraded('mock-runtime-fallback'),
 *     })
 *     // 现场跳到 60s 数吧唧片段
 *     handle.jumpTo(60)
 *     // demo 结束清理
 *     handle.stop()
 *
 * @param opts 回放参数（onEvent 必填；loop 默认 true；onError 可选）
 * @returns 控制句柄
 */
export declare function startRuntime(opts: StartRuntimeOptions): MockRuntimeHandle;
/**
 * task 12.6：把 timeline 全量事件作为静态列表暴露给上层。
 *
 * **使用场景**（design.md §Mock-First Cookbook）：
 *   - `MockDataAdapter.ensureRuntimeStarted()` 启动失败时，前端可以直接
 *     `setInterval` 自己轮播这份列表，不依赖 runtime 句柄
 *   - 测试 / E2E 在没有真实 timer 的环境下做断言
 *
 * 返回的是 timeline 数组的浅拷贝，调用方可以安全地遍历，不会污染原始
 * 数据（runtime 仍然依赖原始数组保持引用稳定）。
 */
export declare function getStaticTimeline(): typeof timeline;
//# sourceMappingURL=runtime.d.ts.map