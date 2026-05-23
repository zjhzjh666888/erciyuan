'use client'

/**
 * Art Preview — 临时素材审阅页（不进 BentoGrid 主仪表盘）
 *
 * 把 `apps/web/public/assets/art-preview/art-01..10.{png,jpg}` 全部展示出来，
 * 每张配一个 caption + 我猜的用途（让用户一眼能纠正"哪张其实是小镇 / UI"）。
 *
 * 这个页面只为采购对齐用，正式仪表盘 (`/`) 不动。
 */

const ASSETS = [
  { id: 1, ext: 'png', size: '1448×1086 / 2551KB', guess: '小镇全景等距大图（首选 TownStage 背景）' },
  { id: 2, ext: 'png', size: '1086×1448 / 897KB', guess: 'UI 卡 — 玩家槽位 / 进度条 / icon' },
  { id: 3, ext: 'png', size: '1254×1254 / 1251KB', guess: '多卡网格 chibi 角色头像缩略图' },
  { id: 4, ext: 'jpg', size: 'JPG / 234KB', guess: '墙纸 / 整页背景纹理' },
  { id: 5, ext: 'png', size: '1254×1254 / 1903KB', guess: '痛房 / 房间内饰大图' },
  { id: 6, ext: 'png', size: '1086×1448 / 1201KB', guess: 'UI 资源条 / 头像粉色 — 我的 Agent 卡' },
  { id: 7, ext: 'png', size: '1086×1448 / 1071KB', guess: '控制面板 UI / 按钮 / 装备槽' },
  { id: 8, ext: 'png', size: '1254×1254 / 1655KB', guess: '店铺立面（深紫木屋）' },
  { id: 9, ext: 'jpg', size: 'JPG / 307KB', guess: '像素 UI 套件（按钮/icon/进度条/装备格）' },
  { id: 10, ext: 'png', size: '1448×1086 / 1208KB', guess: '顶部 nav bar 像素版' },
]

export default function ArtPreviewPage(): JSX.Element {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 24,
        background: '#0E1018',
        color: '#F5F5F7',
        fontFamily: 'Inter, "霞鹜文楷", sans-serif',
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>素材预览 · art-01..10</h1>
        <p style={{ color: 'rgba(245,245,247,0.65)', marginTop: 8 }}>
          请告诉我这 10 张图分别是什么：哪张是小镇全景？哪张是 UI 套件？哪张是顶 nav？
          我会按你纠正后的归类做接下来的产品壳重构。
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 16,
        }}
      >
        {ASSETS.map((a) => (
          <figure
            key={a.id}
            style={{
              margin: 0,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              padding: 12,
              backdropFilter: 'blur(12px)',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '4/3',
                background: '#1a1d29',
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: 12,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/assets/art-preview/art-${String(a.id).padStart(2, '0')}.${a.ext}`}
                alt={`art-${a.id}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  imageRendering: 'pixelated',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  background: 'rgba(0,0,0,0.7)',
                  color: '#FFF',
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                art-{String(a.id).padStart(2, '0')}
              </span>
            </div>
            <figcaption>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(245,245,247,0.55)',
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {a.size}
              </div>
              <div style={{ fontSize: 14, marginTop: 4, color: '#F5F5F7' }}>{a.guess}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  )
}
