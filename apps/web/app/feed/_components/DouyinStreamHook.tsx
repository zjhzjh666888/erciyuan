'use client'

/**
 * task 14.2 — Douyin_Stream_Hook 编排层（mount 在 Page_VideoFeed 里的薄包装）
 *
 * 职责：
 *   1. 用 IntersectionObserver 订阅 14.1 渲染的 `[data-video-id]` 元素，识别
 *      当前一屏视频（page.tsx 用 CSS scroll-snap 没把 currentVideo 提升到 React
 *      state，本编排层兜底解决；14.5+ 如果改成 prop 透传，这里直接用 prop）
 *   2. 把当前视频喂给 useDouyinStreamHook（业务逻辑：5s 阈值 + 10min 频控 +
 *      hook_event 写入 + R17.4 mascot_type_existing 判定）
 *   3. hookFired 时挂 HookPopup
 *
 * **真实业务逻辑全部移到** `apps/web/src/hooks/useDouyinStreamHook.ts` **和**
 * `./HookPopup.tsx`，本文件不重复实现，只做编排。
 *
 * 契约对齐：
 *   - R17.1 5s 阈值 → useDouyinStreamHook(thresholdMs=5000)
 *   - R17.3 10min 频控 → useDouyinStreamHook(cooldownMs=600000)
 *   - R17.5 contextual_intent → useDouyinStreamHook + HookPopup 都从 video 透传
 *   - R17.6 hook_event 写入 → useDouyinStreamHook 内部 appendHookEvent
 */

import { useEffect, useState } from 'react'

import type { MockVideoCard } from '@erciyuan/mock-town'

import {
  STORAGE_KEYS,
  readCurrentMascot,
  useDouyinStreamHook,
} from '@/hooks/useDouyinStreamHook'

import { HookPopup } from './HookPopup'

// ─── Props ─────────────────────────────────────────────────────────────────

export interface DouyinStreamHookProps {
  /**
   * 父组件（task 14.5+）显式传入的当前视频。如果未传，组件自己用
   * IntersectionObserver 订阅 `[data-video-id]` 识别当前视频。
   */
  currentVideo?: MockVideoCard | null
}

// ─── 内部：当前视频 IntersectionObserver ───────────────────────────────────

/**
 * 监听页面里所有 `[data-video-id]` 元素，返回当前视口可见度最高的那条
 * MockVideoCard（按 video_id 在 mock-town.videos 里反查）。
 */
function useCurrentVideoFromDom(
  enabled: boolean,
  videosById: Map<string, MockVideoCard>,
): MockVideoCard | null {
  const [current, setCurrent] = useState<MockVideoCard | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return

    let observer: IntersectionObserver | null = null
    let raf: number | null = null
    const ratios = new Map<string, number>()

    const wire = () => {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>('[data-video-id]'),
      )
      if (elements.length === 0) {
        // 父组件可能惰性挂载，下一帧再试
        raf = window.requestAnimationFrame(wire)
        return
      }

      observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const id = (e.target as HTMLElement).getAttribute('data-video-id')
            if (!id) continue
            ratios.set(id, e.intersectionRatio)
          }
          let bestId: string | null = null
          let bestRatio = 0
          for (const [id, r] of ratios) {
            if (r > bestRatio) {
              bestRatio = r
              bestId = id
            }
          }
          // 阈值 0.5：要"过半进入视口"才视为当前一屏；scroll-snap 已经把视频
          // 顶到屏顶，0.5 + threshold 均匀分布即可稳定识别
          if (bestId && bestRatio > 0.5) {
            const v = videosById.get(bestId)
            if (v) {
              setCurrent((prev) => (prev?.video_id === v.video_id ? prev : v))
            }
          }
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1.0] },
      )

      for (const el of elements) observer.observe(el)
    }

    wire()

    return () => {
      if (raf !== null) window.cancelAnimationFrame(raf)
      observer?.disconnect()
    }
  }, [enabled, videosById])

  return current
}

// ─── 内部：单视频 hook 编排（key={video_id} 让每条视频各自一份 hook 状态） ──

interface OrchestratorProps {
  video: MockVideoCard
}

function Orchestrator({ video }: OrchestratorProps): JSX.Element | null {
  const { start, stop, hookFired, dismissHookPopup } = useDouyinStreamHook(video)

  // 卡片当前正在视口内 → 立即 start；切走 / 卸载 → stop
  useEffect(() => {
    start()
    return () => {
      stop()
    }
  }, [start, stop])

  // R17.4：读已绑定萌宠（用 effect 防止 hydration mismatch）
  const [existingMascot, setExistingMascot] = useState<string | null>(null)
  useEffect(() => {
    if (!hookFired) return
    setExistingMascot(readCurrentMascot())
  }, [hookFired])

  if (!hookFired) return null

  return (
    <HookPopup
      video={video}
      existingMascot={existingMascot}
      onDismiss={dismissHookPopup}
    />
  )
}

// ─── 主组件：DouyinStreamHook ─────────────────────────────────────────────

export function DouyinStreamHook({ currentVideo }: DouyinStreamHookProps = {}): JSX.Element | null {
  // currentVideo 未传 → 自己 dynamic import videos 索引 + IntersectionObserver
  const [videosById, setVideosById] = useState<Map<string, MockVideoCard>>(
    () => new Map(),
  )
  useEffect(() => {
    if (currentVideo) return
    let cancelled = false
    void import('@erciyuan/mock-town').then((mod) => {
      if (cancelled) return
      const map = new Map<string, MockVideoCard>()
      for (const v of mod.videos) map.set(v.video_id, v)
      setVideosById(map)
    })
    return () => {
      cancelled = true
    }
  }, [currentVideo])

  const internalCurrent = useCurrentVideoFromDom(!currentVideo, videosById)
  const activeVideo: MockVideoCard | null = currentVideo ?? internalCurrent

  if (!activeVideo) return null

  // key=video_id → 每条视频一份独立 hook 状态（dwell 计时 / firedForThisVideo）
  return <Orchestrator key={activeVideo.video_id} video={activeVideo} />
}

export default DouyinStreamHook

// ─── 重新导出常量，方便 14.3 / 14.5 等下游消费 ───────────────────────────
export { STORAGE_KEYS }
