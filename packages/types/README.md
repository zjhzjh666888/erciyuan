# @erciyuan/types

Shared TypeScript type definitions for **次元萌宠小镇 / anime-agent-town**.

This package is the **single source of truth** for the shapes that flow
between the front-end (Next.js + React + Phaser), the back-end
(`Sync_Service` WebSocket Hub, `Town_System`, `Memory_System`, …) and the
mock data package (`@erciyuan/mock-town`). Keeping all of them on one
schema is what makes "flip a boolean to switch between mock and live"
viable as a demo-day fallback (design.md §Mock-First Demo Pipeline).

## Type categories

| Category | Examples | Used by |
|---|---|---|
| **Core enums** | `MascotType` (7 萌宠), `PersonaTag` (6 NPC 戏路), `ZoneId` (7 大主题分区), `CompanionType` (11 类搭子), `VideoTag` (9 类二次元) | front-end UI labels, mock data, Mascot_System |
| **World primitives** | `TilePos`, `SpriteManifest` | Render_Engine, Pathfinding_Engine |
| **Agent_Core** | `Action`, `ThoughtTrace` | Agent_Core, Observation_Dashboard, JSONL round-trip (Property 2) |
| **Character & goal** | `Character`, `GoalSpec`, `PersonaProfile`, `MascotProfile` | Character_Generator, Mascot_System |
| **Dialogue & social** | `DialogueLine`, `Dialogue`, `RelationType`, `HotTrend` | Town_System, Ranking_System |
| **Doujin (R11)** | `Doujin`, `DoujinPanel`, `DoujinPayload` | Doujin_Generator, Property 1 round-trip |
| **Sync protocol** | `ServerMsg`, `ClientMsg` | Sync_Service ↔ DataAdapter ↔ Render_Engine |
| **A 链路 mock** | `MockVideoCard`, `ConventionCard`, `CompanionCard`, `QuizQuestion`, `PublishTemplates` | `@erciyuan/mock-town`, Page_VideoFeed / Page_Quiz / Page_Recommend |
| **Mock-Town runtime** | `TimelineEvent`, `MockRuntimeHandle`, `StartRuntimeOptions` | `@erciyuan/mock-town` Runtime |
| **Feature flags** | `FeatureFlags` | Town_System, DataAdapter |
| **Goods / Itasha** | `ItashaTile`, `ItashaLayout` | Goods_System, Itasha_System (Stretch) |
| **Asset manifest** | `AssetEntry`, `AssetManifest`, `AssetCategory`, `LicenseType` | `scripts/check-assets.ts` (R29.50–52) |

## Consumers

- **`@erciyuan/mock-town`** — re-exports every public type from this
  package, so downstream code can `import { ServerMsg } from
  '@erciyuan/mock-town'` without depending on `@erciyuan/types` directly.
- **Next.js front-end** (added in Slice 0, task 11.1+) — `RenderEngine`
  and `Observation_Dashboard` consume `ServerMsg` and `ThoughtTrace`.
- **Sync_Service WebSocket Hub** (Slice 4, task 16.x) — the `ws` server
  must emit `ServerMsg` byte-for-byte identical to what `mock-town`
  emits.

## Versioning

Schema changes follow **R29.58**: any breaking field rename, removal,
or required-field addition bumps the **minor** version of both this
package and `@erciyuan/mock-town` in the same PR. The `@erciyuan/types`
package is intentionally headless (no runtime, no side effects), so
upgrades are additive in 99% of cases.

## Build

```bash
npm run build  # tsc -b → dist/index.{js,d.ts}
```

The package is wired into the root npm workspace (`packages/*`); the
root `tsc -b` build picks it up automatically.
