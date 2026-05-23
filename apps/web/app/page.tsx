'use client'

import { useMemo } from 'react'

import { Header } from './_components/Header'
import { AgentProfileCard } from './_components/AgentProfileCard'
import { RankingPanel } from './_components/RankingPanel'
import { EventStream } from './_components/EventStream'
import { QuickActions } from './_components/QuickActions'
import { DoujinTheater } from './_components/DoujinTheater'
import { TownStageArt } from './_components/TownStageArt'
import { RenderEngine } from '@/render/RenderEngine'

export default function HomePage(): JSX.Element {
  const engine = useMemo(() => new RenderEngine(), [])

  return (
    <div className="anitown-layout">
      <Header />

      <div className="anitown-body">
        {/* Left Sidebar: Agent Profile */}
        <aside className="left-sidebar">
          <AgentProfileCard mascotType="dog_social" engine={engine} />
        </aside>

        {/* Center: Town Map — 使用素材图 + 动态气泡 + 樱花粒子 */}
        <main className="center-stage">
          <TownStageArt engine={engine} />
        </main>

        {/* Right Sidebar: Rankings + Events + Quick Actions */}
        <aside className="right-sidebar">
          <RankingPanel engine={engine} />
          <EventStream engine={engine} />
          <QuickActions />
        </aside>
      </div>

      {/* Bottom: Doujin Theater */}
      <footer className="bottom-strip">
        <DoujinTheater />
      </footer>

      {/* Footer badge */}
      <div className="anitown-footer-badge">
        本小镇由 AI 驱动，居民自主生活中...
      </div>
    </div>
  )
}
