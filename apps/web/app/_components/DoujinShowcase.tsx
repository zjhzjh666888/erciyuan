'use client'

/**
 * DoujinShowcase — 底部「同人小剧场（AI 自动生成）」
 *
 * 复刻图1 底部 4 格漫画卡片横排：每张卡片 = 一篇 doujin 的 4 panel 缩略
 * 图（来自 mock-town `doujins.ts` 的 Unsplash 图床），底下挂 caption。
 *
 * Slice 1 阶段静态展示前 4 篇 4-koma；Slice 7+（task 19.1 Doujin_Generator）
 * 接入 LLM 实时生成时改成 streaming feed。
 */

import { mockTown } from '@erciyuan/mock-town'

const TITLES = ['1 相遇', '2 同行', '3 党争', '4 二创']

export function DoujinShowcase(): JSX.Element {
  // 取前 4 篇 4-koma；mock-town 共 5 篇，前 4 篇都是 comic_4koma 类型
  const items = mockTown.doujins
    .filter((d) => d.kind === 'comic_4koma')
    .slice(0, 4)

  return (
    <section
      aria-label="同人小剧场（AI 自动生成）"
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        borderRadius: 16,
        border: '1px solid rgba(179, 136, 255, 0.30)',
        background:
          'linear-gradient(180deg, rgba(15, 12, 35, 0.92) 0%, rgba(28, 14, 50, 0.92) 100%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#B388FF',
              boxShadow: '0 0 6px rgba(179, 136, 255, 0.8)',
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'var(--font-pixel-zh, sans-serif)',
            }}
          >
            ✨ 同人小剧场（AI 自动生成）
          </span>
        </div>
        <button
          type="button"
          style={{
            padding: '4px 12px',
            borderRadius: 999,
            border: '1px solid rgba(179, 136, 255, 0.45)',
            background: 'linear-gradient(135deg, #B388FF 0%, #FF6FB7 100%)',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-pixel-zh, sans-serif)',
            boxShadow: '0 4px 12px rgba(179, 136, 255, 0.35)',
          }}
        >
          我要投稿二创
        </button>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          flex: 1,
          minHeight: 0,
        }}
      >
        {items.map((doujin, idx) => {
          const panels =
            doujin.payload.kind === 'comic_4koma' ? doujin.payload.panels : []
          return (
            <article
              key={doujin.doujin_id}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: 8,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 6,
                  left: 6,
                  zIndex: 1,
                  background: 'linear-gradient(135deg, #FF6FB7 0%, #B388FF 100%)',
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontFamily: 'monospace',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                }}
              >
                {TITLES[idx] ?? `${idx + 1}`}
              </div>
              {/* 4 格漫画 2×2 grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gridTemplateRows: '1fr 1fr',
                  gap: 2,
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: '#1a1027',
                }}
              >
                {panels.slice(0, 4).map((panel, pIdx) => (
                  <div
                    key={pIdx}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      background: '#1a1027',
                      overflow: 'hidden',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={panel.image_url}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'saturate(1.2) hue-rotate(-10deg)',
                      }}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: 2,
                        right: 2,
                        bottom: 2,
                        background: 'rgba(0, 0, 0, 0.65)',
                        color: '#FFFFFF',
                        fontSize: 8,
                        lineHeight: 1.2,
                        padding: '2px 4px',
                        borderRadius: 3,
                        fontFamily: 'var(--font-pixel-zh, sans-serif)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {panel.caption}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(245, 245, 247, 0.65)',
                  fontFamily: 'var(--font-pixel-zh, sans-serif)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={panels[0]?.caption ?? ''}
              >
                {panels[0]?.caption ?? ''}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default DoujinShowcase
