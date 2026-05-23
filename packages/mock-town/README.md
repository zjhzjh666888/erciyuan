# @erciyuan/mock-town

> 「假小镇剧本」mock 数据包 — 让小镇在零后端依赖下"活起来"。

`@erciyuan/mock-town` 是 **次元萌宠小镇 / anime-agent-town** demo 体系的
**保命方案**。它承载视频流、漫展、搭子、题库、内容发布模板、同人作品
与 90 秒预录"小镇活着"事件流，前端只要 `import` 它就能跑通 Tier 0–1
画面（Smallville 风像素地图 + Bento Grid 仪表盘骨架），完全不依赖
Sync_Service / Agent_Core / SQLite / LLM。

> 设计参考：`design.md §Mock-First Demo Pipeline` + `tasks.md §9`
> 需求出处：`requirements.md R29.11–R29.41`、R28（5 页 demo 旅程契约）

## 关键约束

1. **零运行时依赖** — 本包**不依赖** Phaser / React / Node `fs`，
   仅依赖 `@erciyuan/types` 的类型导出。无论是浏览器、Node 测试，
   还是 Next.js SSR，都能直接消费。
2. **协议同源** — 发射的事件流（`ServerMsg`）与未来的 Sync_Service
   WebSocket Hub **逐字段一致**。`feature.mock_mode` 翻转 true → false
   时，Render_Engine 与 Observation_Dashboard 零改动。
3. **Tier 0 兜底** — 评委拔网线 / 笔记本飞行模式时，浏览器 `?mock=1`
   刷新，画面继续动；DEGRADED MODE 红条提示降级。

## 模块布局

```
src/
├── index.ts              # 统一导出 + 类型透传  (task 9.1 / 9.10)
├── videos.ts             # ≥ 12 视频 mock        (task 9.2)
├── conventions.ts        # ≥ 6 漫展 mock         (task 9.3)
├── companions.ts         # ≥ 20 搭子 mock        (task 9.4)
├── quizzes.ts            # ≥ 15 题题库           (task 9.5)
├── publish_templates.ts  # 视频脚本/文案/标签/合拍 (task 9.6)
├── doujins.ts            # ≥ 5 同人 mock         (task 9.7)
├── timeline.ts           # 90s 时间轴事件流       (task 9.8)
└── runtime.ts            # MockTownRuntime       (task 9.9)
```

当前（task 9.1）只完成包骨架与类型透传。集合默认空数组，`startRuntime()`
为占位实现，调用即抛错以暴露未填充路径。

## 用法（占位示例）

完成 task 9.2–9.9 后，消费者将这样使用：

```ts
// import { mockTown, type ServerMsg } from '@erciyuan/mock-town'
//
// // A 链路 Page_VideoFeed
// const cards = mockTown.videos
//
// // 90s 假小镇事件流
// const handle = mockTown.startRuntime({
//   onEvent: (msg: ServerMsg) => dataAdapter.dispatch(msg),
//   loop: true,
// })
//
// // demo 现场跳到精彩片段
// handle.jumpTo(42)
//
// // 演示结束
// handle.stop()
```

## Schema 演进

任何 schema 变更（新增必填字段 / 重命名 / 删字段）必须：

1. **同 PR 同步升级** `@erciyuan/types` + 本包的 `package.json`
   minor 版本（R29.58）；
2. 重新计算 `assets/MANIFEST.yaml` 中本包源文件的 hash（R29.59）；
3. `npm run check:assets` 通过；
4. front-end consumer 与 Sync_Service 同步升级，避免双份类型漂移。

## Build

```bash
npm run build  # tsc -b → dist/index.{js,d.ts}
npm run clean  # rimraf dist
```

通过根 workspace 的 `tsc -b` 自动构建；与 `@erciyuan/types` 的项目引用
在 `tsconfig.json#references` 中已声明。

## License

`SELF` — 次元萌宠小镇团队自制（mock 文案与时间轴脚本均为团队原创）。
缩略图字段引用的外部 URL 在各 mock 文件头部注明授权来源（task 9.2 起
逐文件登记到 `assets/MANIFEST.yaml#mock` 类别）。
