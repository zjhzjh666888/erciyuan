/**
 * scripts/check-assets-strict.ts
 *
 * 跨平台 strict 启动器：在 Windows / macOS / Linux 上一致地把
 * STRICT_HASH=true 注入子进程环境，再调用 scripts/check-assets.ts。
 *
 * 背景：
 *   原 npm 脚本 `STRICT_HASH=true tsx scripts/check-assets.ts` 是 POSIX
 *   shell 语法，在 Windows cmd / PowerShell 下会被解释为命令名而失败。
 *   常见解决方案 cross-env 需要新增 devDependency；此处采用零依赖
 *   wrapper：在当前 Node 进程内置环境变量后再 import 主校验脚本，
 *   以保持 package.json 依赖面最小且 Windows / CI 行为一致（R29.49–56）。
 */

process.env.STRICT_HASH = 'true'

// 动态 import 主脚本，使其在 STRICT_HASH 已被设置后再读取 process.env。
// 注意：主脚本会自行调用 process.exit()，因此 wrapper 无需额外收尾；
// 这里使用 .then 避免 top-level await（tsx 默认 cjs 输出不支持）。
void import('./check-assets.ts').catch((err: unknown) => {
  console.error('❌ check-assets-strict wrapper failed to load main script:', err)
  process.exit(1)
})
