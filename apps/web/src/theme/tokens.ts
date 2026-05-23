/**
 * Design tokens for 次元萌宠小镇 / Anime Agent Town.
 *
 * Single Source of Truth lives in `./tokens.json` so that both this TS module
 * AND the CommonJS `tailwind.config.js` can consume the exact same values
 * without drift. Tailwind reads the JSON via `require()`; Next.js / TS code
 * reads it via `import` thanks to `resolveJsonModule: true`.
 *
 * Reference: design.md §2.2 (Glassmorphism Design Tokens) + §2.3 (24-color
 * palette) + Requirement R15.5 ("不超过 24 个主色").
 *
 * The 24-color palette is grouped intentionally:
 *   - 7 mascot accents — one per `mascot_type` (R19.1)
 *   - 5 zone tints     — one per major town zone (R25.1)
 *   - 5 neutrals       — surface tones for Glassmorphism layering
 *   - 4 semantics      — success / warn / danger / info
 *   - 3 brand stops    — primary / secondary / tertiary gradient stops
 * Total: 7 + 5 + 5 + 4 + 3 = 24 named hex tokens.
 *
 * Glassmorphism `surfaces` / `borders` (task 13.2) layer rgba-white tints on
 * top of those 24 hues — they're alpha modulations, NOT additional palette
 * entries, so the 24-color cap (R15.5) still holds.
 */
import rawTokens from './tokens.json'

/** ----------------------------------------------------------------------------
 * Palette — exactly 24 named hex tokens (R15.5).
 * Each comment lines up with design.md §2.3 grouping + the mascot/zone/spec
 * pages that consume the color downstream.
 * --------------------------------------------------------------------------- */
export const palette = {
  // 7 mascot accents (one per mascot_type — sourced from packages/mock-town/src/mascots.ts so cards, sprites, and tokens never drift)
  mascotCatLore:      '#A78BFA', // 考据猫 / cool blue-violet — 资料馆主色
  mascotDogSocial:    '#FFA864', // 扩列犬 / kuudere-friendly amber — 漫展拱门主色
  mascotHamsterHoard: '#D8C5A8', // 囤囤鼠 / warm beige — 谷子货架主色
  mascotFoxCreate:    '#F0DCC8', // 太太狐 / cream — 创作阁主色
  mascotSlimeNewbie:  '#A8D8FF', // 云仔 / soft sky — 新人指引主色
  mascotWolfLimited:  '#325082', // 限定狼 / 夜行 dark navy-violet — 狙击塔主色
  mascotPigeonBuzz:   '#FFC8DC', // 咕咕鸽 / 萌 sakura pink — 情报广场主色

  // 5 zone tints (drawn around each anchor mascot, slightly desaturated for tile overlays)
  zonePlaza:          '#FFE4F0', // 中央广场 / pastel pink wash
  zoneCosStudio:      '#FFD9A8', // Cos 工坊 / 阳光 amber
  zoneGoodsBazaar:    '#FFF4D4', // 谷子集市 / 收藏 emerald-cream blend
  zoneDoujinAtelier:  '#D8A8FF', // 创作阁 / 创作 magenta
  zoneBuzzSquare:     '#D4F4FF', // 情报广场 / cool icy blue

  // 5 neutrals — Glassmorphism surface stack
  neutralDeepNavy:    '#0E1018', // app background (design.md §2.2 `bg`)
  neutralMidnight:    '#1A1D29', // card surface (design.md §2.2 `surface` solid fallback)
  neutralSoftSlate:   '#241827', // accent surface (Trend / War cards)
  neutralGlassWhite:  '#F5F5F7', // primary text on dark / glass tint base
  neutralHighlight:   '#FFFFFF', // pure highlight & speech-bubble fill (Smallville §1.4)

  // 4 semantics — status feedback
  semanticSuccess:    '#B6FF6F', // goal_completed / accentLime
  semanticWarn:       '#FFB86F', // memory unstable amber
  semanticDanger:     '#FF6F6F', // DEGRADED MODE 红条 (design.md §2.8)
  semanticInfo:       '#7AE7FF', // accentCyan / move action label

  // 3 brand gradient stops — used for hero gradients & isekai transition
  brandPrimary:       '#FF6FB7', // 二次元粉 (R25 主品牌)
  brandSecondary:     '#7AE7FF', // 二次元青
  brandTertiary:      '#B6FF6F', // 二次元绿
} as const satisfies Readonly<Record<string, string>>

export type PaletteToken = keyof typeof palette

/** ----------------------------------------------------------------------------
 * Glass surfaces — rgba-white tints layered on top of the dark canvas. These
 * are the canonical fills for `<GlassCard>` (task 13.2) and any other
 * Glassmorphism surface. They do NOT count against R15.5's 24-color cap
 * because they're alpha modulations of `neutralHighlight`, not new hues.
 * --------------------------------------------------------------------------- */
export const surfaces = {
  glassPrimary:     'rgba(255, 255, 255, 0.12)', // default Bento card fill
  glassSecondary:   'rgba(255, 255, 255, 0.06)', // quieter / inner panels
  glassTranslucent: 'rgba(255, 255, 255, 0.04)', // floating overlays / popovers
} as const satisfies Readonly<Record<string, string>>

export type SurfaceToken = keyof typeof surfaces

/** ----------------------------------------------------------------------------
 * Borders — pre-composed `1px solid …` strings so consumers can drop the
 * value straight into a CSS `border` shorthand without repeating `1px solid`.
 * --------------------------------------------------------------------------- */
export const borders = {
  subtle: '1px solid rgba(255, 255, 255, 0.12)', // resting state
  glow:   '1px solid rgba(255, 255, 255, 0.28)', // hover / focus
} as const satisfies Readonly<Record<string, string>>

export type BorderToken = keyof typeof borders

/** ----------------------------------------------------------------------------
 * Typography — pixel-style for body, sans for prose (Smallville §1.4 + R15.4).
 * Font files are NOT yet on disk; the @font-face blocks land in task 11.4.
 * --------------------------------------------------------------------------- */
export const typography = {
  fontFamily: {
    pixelZh: 'Vonwaon, sans-serif',
    pixelEn: 'Ark Pixel, monospace',
    sans:    'Inter, "霞鹜文楷", sans-serif',
    mono:    '"JetBrains Mono", "Fira Code", monospace',
  },
  fontSize: {
    xs:    '0.75rem',
    sm:    '0.875rem',
    base:  '1rem',
    lg:    '1.125rem',
    xl:    '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
} as const

/** ----------------------------------------------------------------------------
 * Spacing — 4-pt grid. Tailwind already ships a default spacing scale; we
 * add SEMANTIC aliases on top of it (xs / sm / md / lg / xl / 2xl) so card
 * paddings stay consistent with the Bento Grid §2.1 specs.
 * --------------------------------------------------------------------------- */
export const spacing = {
  xs:    '4px',
  sm:    '8px',
  md:    '16px',
  lg:    '24px',
  xl:    '32px',
  '2xl': '48px',
} as const

/** ----------------------------------------------------------------------------
 * Border radii. `card` / `cardSmall` (task 13.2) are aliases consumed by
 * `<GlassCard>` and its sub-components — keeping them as named tokens lets
 * us retune the Bento Grid corner roundness in one place later.
 * --------------------------------------------------------------------------- */
export const radii = {
  sm:        '4px',
  md:        '8px',
  lg:        '16px',
  xl:        '24px',
  card:      '16px',
  cardSmall: '8px',
  pill:      '9999px',
} as const

/** ----------------------------------------------------------------------------
 * Box shadows — `glass` is the canonical Glassmorphism elevation, `glassDeep`
 * is the deeper drop used by floating cards on dark backgrounds, `card` /
 * `cardHover` are the resting / hover pair for Bento Grid cells (task 13.2),
 * `glow` is for accent halos.
 * --------------------------------------------------------------------------- */
export const shadows = {
  glass:     '0 8px 32px rgba(31, 38, 135, 0.37)',
  glassDeep: '0 20px 48px rgba(0, 0, 0, 0.40)',
  glow:      '0 0 20px rgba(255, 255, 255, 0.30)',
  card:      '0 4px 12px rgba(0, 0, 0, 0.15)',
  cardHover: '0 8px 24px rgba(0, 0, 0, 0.25)',
} as const

/** ----------------------------------------------------------------------------
 * Backdrop blur — paired with a glass surface for frosted cards. `glass`
 * is the canonical filter strength used by `<GlassCard>` (task 13.2).
 * --------------------------------------------------------------------------- */
export const blur = {
  sm:    '4px',
  md:    '12px',
  lg:    '24px',
  glass: '12px',
} as const

/** ----------------------------------------------------------------------------
 * Motion — durations + canonical anime easing curve (used by Framer Motion
 * for bubble pop-in, card layout shifts, isekai transition fades).
 * --------------------------------------------------------------------------- */
export const motion = {
  duration: {
    fast:   '120ms',
    normal: '200ms',
    slow:   '320ms',
  },
  easing: {
    easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
} as const

/** ----------------------------------------------------------------------------
 * Aggregated default export — convenient for `tailwind.config.js` style
 * consumers (though the CJS config goes through `tokens.json` directly).
 * --------------------------------------------------------------------------- */
export const tokens = {
  palette,
  surfaces,
  borders,
  typography,
  spacing,
  radii,
  shadows,
  blur,
  motion,
} as const

export default tokens

/** ----------------------------------------------------------------------------
 * Drift guards — assert at module-load time that the typed objects stay in
 * sync with the JSON SSOT consumed by `tailwind.config.js`. If somebody
 * edits one but forgets the other, this throws on first import.
 * --------------------------------------------------------------------------- */
function assertGroupInSync<T extends Record<string, string>>(
  groupName: string,
  tsGroup: T,
  jsonGroup: Record<string, string>,
): void {
  const tsKeys = Object.keys(tsGroup).sort().join(',')
  const jsonKeys = Object.keys(jsonGroup).sort().join(',')
  if (tsKeys !== jsonKeys) {
    throw new Error(
      `[tokens] ${groupName} drift detected between tokens.ts and tokens.json:\n  ts:   ${tsKeys}\n  json: ${jsonKeys}`,
    )
  }
  for (const key of Object.keys(tsGroup)) {
    const jsonValue = jsonGroup[key]
    const tsValue = tsGroup[key]
    if (jsonValue !== tsValue) {
      throw new Error(
        `[tokens] ${groupName} value drift for "${key}": ts=${tsValue} json=${jsonValue}`,
      )
    }
  }
}

assertGroupInSync('palette', palette, rawTokens.palette as Record<string, string>)
assertGroupInSync('surfaces', surfaces, rawTokens.surfaces as Record<string, string>)
assertGroupInSync('borders', borders, rawTokens.borders as Record<string, string>)
