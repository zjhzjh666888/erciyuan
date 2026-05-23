/**
 * PostCSS pipeline for Next.js + Tailwind v3.4.x.
 * Tailwind v3 explicitly does NOT use Lightning CSS (that's v4 territory).
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
