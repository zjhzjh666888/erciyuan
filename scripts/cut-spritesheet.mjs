#!/usr/bin/env node
/**
 * cut-spritesheet.mjs
 *
 * Cuts the sprite sheet at 素材/d2685423870ff54944521a99f504a918.jpg (1536x1024)
 * into individual numbered PNG assets and saves them under
 * apps/web/public/assets/art/sprites/.
 *
 * Usage:
 *   node scripts/cut-spritesheet.mjs
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SRC_IMAGE = path.join(
  ROOT,
  '素材',
  'd2685423870ff54944521a99f504a918.jpg',
);

const OUT_DIR = path.join(
  ROOT,
  'apps',
  'web',
  'public',
  'assets',
  'art',
  'sprites',
);

/**
 * @typedef {Object} CutSpec
 * @property {string} name   Output filename (with .png extension)
 * @property {number} left
 * @property {number} top
 * @property {number} width
 * @property {number} height
 * @property {string} [note] Optional description for logging
 */

/** @type {CutSpec[]} */
const CUTS = [
  { name: 'ui_header.png',          left: 180, top: 78,  width: 385, height: 60,  note: 'Element 1 - header nav bar' },
  { name: 'ui_agent_card_ref.png',  left: 168, top: 148, width: 175, height: 170, note: 'Element 2 - agent card' },
  { name: 'ui_town_map.png',        left: 355, top: 88,  width: 310, height: 370, note: 'Element 4 - town map' },
  { name: 'ui_monitor.png',         left: 650, top: 88,  width: 230, height: 165, note: 'Element 5 - monitor panel' },
  { name: 'ui_ranking_ref.png',     left: 860, top: 88,  width: 260, height: 210, note: 'Element 8 - ranking panel' },
  { name: 'building_shop_pink.png', left: 650, top: 230, width: 210, height: 180, note: 'Element 7 - pink shop building' },
  { name: 'building_shop_dark.png', left: 650, top: 365, width: 210, height: 180, note: 'Element 8b - dark shop building' },
  { name: 'ui_dialog_panel.png',    left: 860, top: 305, width: 260, height: 140, note: 'Element 10 - dialog panel' },
  { name: 'char_pink.png',          left: 400, top: 538, width: 95,  height: 100, note: 'Element 23 - pink character' },
  { name: 'char_grey.png',          left: 500, top: 538, width: 95,  height: 100, note: 'Element 24 - grey character' },
  { name: 'char_purple.png',        left: 605, top: 538, width: 95,  height: 100, note: 'Element 25 - purple character' },
  { name: 'char_dark.png',          left: 705, top: 538, width: 95,  height: 100, note: 'Element 26 - dark character' },
  { name: 'prop_cherry_tree.png',   left: 825, top: 538, width: 150, height: 140, note: 'Element 27 - cherry tree' },
  { name: 'ui_portal.png',          left: 290, top: 540, width: 100, height: 100, note: 'Element 22 - magic circle / portal' },
];

const log = {
  info:  (msg) => console.log(`[INFO]  ${new Date().toISOString()} - ${msg}`),
  warn:  (msg) => console.warn(`[WARN]  ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
};

/**
 * Clamp a single extract region to be inside the source image.
 * sharp will throw if the region exceeds the canvas, so we defensively
 * adjust here in case the hardcoded coordinates round past the edges.
 */
function clampRegion(region, imgW, imgH) {
  const left = Math.max(0, Math.min(region.left, imgW - 1));
  const top = Math.max(0, Math.min(region.top, imgH - 1));
  const width = Math.max(1, Math.min(region.width, imgW - left));
  const height = Math.max(1, Math.min(region.height, imgH - top));
  return { left, top, width, height };
}

async function main() {
  log.info(`Source: ${SRC_IMAGE}`);
  log.info(`Output: ${OUT_DIR}`);

  // Confirm the source exists
  try {
    await fs.access(SRC_IMAGE);
  } catch (err) {
    log.error(`Source image not found: ${SRC_IMAGE}`);
    throw err;
  }

  // Make sure the output directory exists
  await fs.mkdir(OUT_DIR, { recursive: true });

  // Inspect the source so we can clamp safely
  const meta = await sharp(SRC_IMAGE).metadata();
  log.info(
    `Source metadata: ${meta.width}x${meta.height} format=${meta.format}`,
  );

  let success = 0;
  let failed = 0;

  for (const cut of CUTS) {
    const region = clampRegion(
      { left: cut.left, top: cut.top, width: cut.width, height: cut.height },
      meta.width ?? 1536,
      meta.height ?? 1024,
    );

    const outPath = path.join(OUT_DIR, cut.name);

    try {
      await sharp(SRC_IMAGE)
        .extract(region)
        .png({ compressionLevel: 9 })
        .toFile(outPath);

      success += 1;
      log.info(
        `OK  -> ${cut.name}  (${region.width}x${region.height} @ ${region.left},${region.top})  ${
          cut.note ?? ''
        }`,
      );
    } catch (err) {
      failed += 1;
      log.error(
        `FAIL -> ${cut.name}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  log.info(`Done. success=${success} failed=${failed} total=${CUTS.length}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  log.error(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
