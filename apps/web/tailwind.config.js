/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Tailwind CSS v3.4.x configuration for 次元萌宠小镇.
 *
 * Reads design tokens from `src/theme/tokens.json` (Single Source of Truth).
 * The TypeScript module `src/theme/tokens.ts` mirrors the same JSON, so
 * Tailwind utilities and TS code are guaranteed to never drift.
 *
 * Reference: design.md §2.2 (Glassmorphism tokens) + §2.3 (24-color palette)
 * + Requirement R15.5.
 */
const tokens = require('./src/theme/tokens.json')

const { palette, typography, spacing, radii, shadows, blur, motion } = tokens

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 7 mascot accents
        mascotCatLore:      palette.mascotCatLore,
        mascotDogSocial:    palette.mascotDogSocial,
        mascotHamsterHoard: palette.mascotHamsterHoard,
        mascotFoxCreate:    palette.mascotFoxCreate,
        mascotSlimeNewbie:  palette.mascotSlimeNewbie,
        mascotWolfLimited:  palette.mascotWolfLimited,
        mascotPigeonBuzz:   palette.mascotPigeonBuzz,

        // 5 zone tints
        zonePlaza:          palette.zonePlaza,
        zoneCosStudio:      palette.zoneCosStudio,
        zoneGoodsBazaar:    palette.zoneGoodsBazaar,
        zoneDoujinAtelier:  palette.zoneDoujinAtelier,
        zoneBuzzSquare:     palette.zoneBuzzSquare,

        // 5 neutrals — short aliases keep utility names readable (`bg-deepNavy`, `bg-glassWhite/70`)
        deepNavy:           palette.neutralDeepNavy,
        midnight:           palette.neutralMidnight,
        softSlate:          palette.neutralSoftSlate,
        glassWhite:         palette.neutralGlassWhite,
        highlight:          palette.neutralHighlight,

        // 4 semantics
        success:            palette.semanticSuccess,
        warn:               palette.semanticWarn,
        danger:             palette.semanticDanger,
        info:               palette.semanticInfo,

        // 3 brand stops
        brandPrimary:       palette.brandPrimary,
        brandSecondary:     palette.brandSecondary,
        brandTertiary:      palette.brandTertiary,
      },
      fontFamily: {
        pixelZh: typography.fontFamily.pixelZh.split(/,\s*/),
        pixelEn: typography.fontFamily.pixelEn.split(/,\s*/),
        sans:    typography.fontFamily.sans.split(/,\s*/),
        mono:    typography.fontFamily.mono.split(/,\s*/),
      },
      fontSize: typography.fontSize,
      spacing: spacing,
      borderRadius: radii,
      boxShadow: shadows,
      backdropBlur: blur,
      transitionDuration: motion.duration,
      transitionTimingFunction: {
        easeOut: motion.easing.easeOut,
      },
    },
  },
  plugins: [],
}
