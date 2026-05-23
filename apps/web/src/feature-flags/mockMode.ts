/**
 * `mockMode.ts` — `feature.mock_mode` flag 解析（task 12.2）。
 *
 * 优先级（高 → 低）：
 *   1. URL `?mock=1` / `?mock=0`（仅浏览器侧）
 *   2. `localStorage.feature_mock_mode` `'true' | 'false'`（仅浏览器侧）
 *   3. 环境变量 `NEXT_PUBLIC_MOCK_MODE` `'true' | 'false'`（SSR + 浏览器都能读）
 *   4. 默认 `true`（design.md §Mock-First：UI-First 兜底，先确保画面活）
 *
 * **SSR 安全**：服务端渲染阶段没有 `window` / `document` / `localStorage`，因此
 * 服务端只读环境变量 + 默认值；浏览器侧才会去看 URL 与 localStorage。
 *
 * 调用方关心的契约：
 *   - `getMockModeFlag()` 同步返回 boolean，零副作用，可在任何渲染阶段调用
 *   - `setMockModeFlag(value)` 写入 localStorage，触发同源页面的 `storage`
 *     事件 + 自定义 `erciyuan:mock-mode-changed` 事件，便于 React 端监听刷新
 *
 * 不在这里做的事：
 *   - 不主动 navigator.reload —— 调用方决定是否重载（demo 现场允许只切 badge
 *     文案、保留 mock 流不打断）
 *   - 不与 RenderEngine / DataAdapter 直接耦合 —— 这两者只读取 flag 的当前值
 */

const STORAGE_KEY = 'feature_mock_mode'
const URL_PARAM_KEY = 'mock'
const ENV_KEY = 'NEXT_PUBLIC_MOCK_MODE'
const DEFAULT_VALUE = true

/** 自定义事件名 —— 同窗口内组件互相感知 flag 变化时使用。 */
export const MOCK_MODE_CHANGED_EVENT = 'erciyuan:mock-mode-changed'

/**
 * 把任意"flag 字符串"解释为 boolean。仅识别明确值，其它一律返回 null
 * 让上层继续走更低优先级的源。
 *
 *   '1' / 'true'  → true
 *   '0' / 'false' → false
 *   其它              → null
 */
function parseFlag(raw: string | null | undefined): boolean | null {
  if (raw === null || raw === undefined) return null
  const v = raw.trim().toLowerCase()
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false
  return null
}

/**
 * 浏览器侧从 URL 读取 `?mock=...`。SSR 时返回 null。
 */
function readFromUrl(): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    const params = new URLSearchParams(window.location.search)
    return parseFlag(params.get(URL_PARAM_KEY))
  } catch {
    return null
  }
}

/**
 * 浏览器侧从 localStorage 读取持久化的 flag。SSR 时返回 null。
 * 访问 localStorage 在某些隐私模式 / 跨域 iframe 内会抛错，必须 try/catch。
 */
function readFromStorage(): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    return parseFlag(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

/**
 * 从环境变量读取。SSR + 浏览器侧都可读（Next.js 在打包时把
 * `NEXT_PUBLIC_*` 注入到 client bundle）。
 */
function readFromEnv(): boolean | null {
  // 直接 `process.env.NEXT_PUBLIC_MOCK_MODE` 在 Node + Next.js 浏览器 bundle 都可工作；
  // 用方括号读取兼容某些极端打包配置。
  const raw =
    typeof process !== 'undefined' && process.env
      ? process.env[ENV_KEY]
      : undefined
  return parseFlag(raw)
}

/**
 * 解析当前 `feature.mock_mode`：URL > localStorage > env > 默认 true。
 */
export function getMockModeFlag(): boolean {
  const fromUrl = readFromUrl()
  if (fromUrl !== null) return fromUrl

  const fromStorage = readFromStorage()
  if (fromStorage !== null) return fromStorage

  const fromEnv = readFromEnv()
  if (fromEnv !== null) return fromEnv

  return DEFAULT_VALUE
}

/**
 * 写入持久化 flag（仅浏览器侧）。同时派发自定义事件，便于同窗口内的
 * 组件即时感知（localStorage 的 `storage` 事件只在跨标签页触发）。
 *
 * 注意：URL 上的 `?mock=...` 优先级高于 localStorage —— 如果用户当前 URL
 * 含 `?mock`，本函数仍写入 localStorage，但 `getMockModeFlag()` 仍会优先
 * 返回 URL 的值。调用方若要让设置立即生效，应当：
 *   1. 跳转到不带 `?mock` 的 URL，或
 *   2. 主动 `location.reload()`
 * 这是 design.md 设计的有意行为：URL 是路演现场最强的 override。
 */
export function setMockModeFlag(value: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
  } catch {
    // 隐私模式 / quota 满 → 静默失败；调用方无法恢复，能做的只是 console.warn
    // eslint-disable-next-line no-console
    console.warn('[mockMode] failed to persist flag to localStorage')
  }
  try {
    window.dispatchEvent(
      new CustomEvent(MOCK_MODE_CHANGED_EVENT, { detail: { value } }),
    )
  } catch {
    // CustomEvent 在极老浏览器不可用 —— 可忽略
  }
}

/**
 * 调试用：返回每条来源各自识别出的值，便于 demo runbook 排查"为什么 flag
 * 是这个值"。
 */
export function describeMockModeSources(): {
  resolved: boolean
  url: boolean | null
  storage: boolean | null
  env: boolean | null
  default: boolean
} {
  return {
    resolved: getMockModeFlag(),
    url: readFromUrl(),
    storage: readFromStorage(),
    env: readFromEnv(),
    default: DEFAULT_VALUE,
  }
}
