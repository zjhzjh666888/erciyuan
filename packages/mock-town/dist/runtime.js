import { timeline } from './timeline.js';
/**
 * task 12.6：兜底链路的轮播节拍（毫秒）。1s 一拍是 design.md
 * §Mock-First Cookbook 给的"画面继续动但便宜"的下限——比 timeline
 * 慢得多，但比"白屏"好无穷倍。
 */
const FALLBACK_TICK_MS = 1000;
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
export function startRuntime(opts) {
    const { onEvent, loop = true, onError } = opts;
    const timers = new Set();
    /** 标记是否已 stop，避免 timeout 触发后再调度 loop。 */
    let stopped = false;
    /** task 12.6：处于兜底轮播状态时持有的 setInterval 句柄。 */
    let fallbackInterval = null;
    /** 兜底轮播的"游标"，每拍前进一步。 */
    let fallbackCursor = 0;
    /** 安全地把异常透给上层（onError 自身抛错也吞掉）。 */
    function notifyError(err) {
        if (!onError)
            return;
        try {
            onError(err);
        }
        catch {
            // 故意吞掉：onError 实现里再抛错不应该把 runtime 拖垮
        }
    }
    /**
     * 安排一遍完整时间轴：从 `fromSeconds` 开始，把 `at_seconds >= fromSeconds`
     * 的事件用相对延时调度。最后一条事件结束后若 `loop=true` 自动重新安排。
     *
     * task 12.6：整个函数包一层 try/catch —— 一旦 schedule 自身抛错（罕见，
     * 但在浏览器内存压力下 setTimeout 可能 throw），自动切到 fallback 轮播
     * 并通过 onError 把异常透给上层。
     */
    function schedule(fromSeconds) {
        if (stopped || fallbackInterval !== null)
            return;
        try {
            // 取出本轮要调度的事件（按 at_seconds 升序）。
            const remaining = timeline.filter((e) => e.at_seconds >= fromSeconds);
            if (remaining.length === 0) {
                // jumpTo 跳过了所有事件 —— 直接进入下一轮（loop）或停下。
                if (loop) {
                    const wrap = setTimeout(() => {
                        timers.delete(wrap);
                        schedule(0);
                    }, 0);
                    timers.add(wrap);
                }
                return;
            }
            const lastAt = remaining[remaining.length - 1].at_seconds;
            for (const evt of remaining) {
                const delayMs = Math.max(0, (evt.at_seconds - fromSeconds) * 1000);
                const t = setTimeout(() => {
                    timers.delete(t);
                    if (stopped || fallbackInterval !== null)
                        return;
                    try {
                        onEvent(evt.msg);
                    }
                    catch {
                        // onEvent 错误不阻塞 timeline，下一条照常发射
                    }
                }, delayMs);
                timers.add(t);
            }
            // 末尾事件后续 loop。统一 +200ms 缓冲让 Render_Engine 收尾。
            if (loop) {
                const wrapDelay = Math.max(0, (lastAt - fromSeconds) * 1000) + 200;
                const wrap = setTimeout(() => {
                    timers.delete(wrap);
                    if (stopped || fallbackInterval !== null)
                        return;
                    schedule(0);
                }, wrapDelay);
                timers.add(wrap);
            }
        }
        catch (err) {
            // setTimeout 抛错 / filter 抛错 / 枚举出 ServerMsg 时崩溃 —— 都视为
            // 致命错误：透给上层 + 自动切兜底轮播，画面不停。
            notifyError(err);
            forceFallback('schedule-threw');
        }
    }
    function clearAll() {
        for (const t of timers)
            clearTimeout(t);
        timers.clear();
        if (fallbackInterval !== null) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
        }
    }
    /**
     * task 12.6：硬降级到"setInterval 1s 一拍循环轮播 timeline"。
     *
     * 与正常 schedule() 的区别：
     *   - 抛弃精确的 at_seconds 时序，每秒只发**一条**事件（按数组顺序循环）
     *   - 不再依赖 setTimeout 链；只持有一个 setInterval 句柄
     *   - onEvent 抛错仍然吞掉，单条坏事件不会让 fallback 死循环卡住
     *
     * 这条路径的本意不是"还原"，而是"**至少别白屏**" —— 画面继续动、气泡继续
     * 出，路演员有时间手动 ?domfallback=1 切 DOM，或刷新换 LIVE。
     */
    function forceFallback(reason = 'manual') {
        if (stopped)
            return;
        if (fallbackInterval !== null)
            return; // 已经在兜底里了，幂等
        // 清空现有 setTimeout 链 —— 必须先清，否则等到 lastAt+200ms 时 loop
        // wrap 还会触发一次 schedule(0) 跟 fallback 抢节奏。
        for (const t of timers)
            clearTimeout(t);
        timers.clear();
        fallbackCursor = 0;
        // 立刻发一条，让画面在 1s tick 之前就有反应。
        tickFallback();
        fallbackInterval = setInterval(tickFallback, FALLBACK_TICK_MS);
        // 标签 `reason` 仅供 console / 测试断言查看，不暴露在句柄上。
        void reason;
    }
    /** 兜底 tick：吐一条事件 + 推进游标。 */
    function tickFallback() {
        if (stopped)
            return;
        if (timeline.length === 0)
            return;
        const evt = timeline[fallbackCursor % timeline.length];
        fallbackCursor = (fallbackCursor + 1) % timeline.length;
        try {
            onEvent(evt.msg);
        }
        catch {
            // 单条坏事件吞掉，下一拍继续
        }
    }
    // 初始：从 0s 开始第一轮。schedule 内部已自带 try/catch。
    schedule(0);
    const handle = {
        stop() {
            stopped = true;
            clearAll();
        },
        jumpTo(seconds) {
            if (stopped)
                return;
            if (!Number.isFinite(seconds))
                return;
            // 兜底状态下跳秒没有意义（fallback 是顺序循环，无 at_seconds 概念）；
            // 但 jumpTo 不应触发硬错误，静默 no-op 即可。
            if (fallbackInterval !== null)
                return;
            const target = Math.max(0, seconds);
            // 重新调度：清空现有定时器，从 target 开始重排剩余事件。
            clearAll();
            schedule(target);
        },
        _forceFallback(reason) {
            if (stopped)
                return;
            try {
                forceFallback(reason ?? 'external');
            }
            catch (err) {
                // 兜底自身崩溃（极端罕见）：记一次 onError，让上层至少知道 mock
                // 流彻底死了，可去切 DOM fallback。
                notifyError(err);
            }
        },
    };
    return handle;
}
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
export function getStaticTimeline() {
    return timeline.slice();
}
//# sourceMappingURL=runtime.js.map