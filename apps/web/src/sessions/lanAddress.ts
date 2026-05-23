/**
 * lanAddress.ts — 探测当前 dev server 在 LAN 中的可访问 URL。
 *
 * 黑客松现场：评委手机和你的笔记本必须在同一 WiFi。手机扫码后访问的
 * URL 不能是 `localhost:3000`（手机访问不到本机），必须是
 * `http://192.168.x.x:3000/scan/<token>`。
 *
 * 这里用 Node `os.networkInterfaces()` 找出第一条非内部 IPv4 地址，
 * 拼出可外部访问的 URL。如果环境变量 `ANITOWN_LAN_HOST` / `ANITOWN_PORT`
 * 设了就优先采用（路演笔电插了多张网卡时手动指定）。
 */

import { networkInterfaces } from 'node:os'

const DEFAULT_PORT = 3000

/** 找第一条非 internal 的 IPv4 地址；找不到返回 null。 */
export function detectLanIPv4(): string | null {
  const ifaces = networkInterfaces()
  // 候选优先级：以 192. / 10. / 172.16-31. 开头的私有地址
  const candidates: string[] = []
  for (const name of Object.keys(ifaces)) {
    const list = ifaces[name]
    if (!list) continue
    for (const info of list) {
      if (info.family !== 'IPv4') continue
      if (info.internal) continue
      candidates.push(info.address)
    }
  }
  // 优先 192.168.* > 10.* > 172.16-31.* > 其他
  candidates.sort((a, b) => prio(a) - prio(b))
  return candidates[0] ?? null
}

function prio(ip: string): number {
  if (ip.startsWith('192.168.')) return 0
  if (ip.startsWith('10.')) return 1
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return 2
  return 9
}

/** 返回 `http://<host>:<port>` 形式的 base URL（用于拼二维码 URL）。 */
export function getLanBaseUrl(): string {
  const envHost = process.env.ANITOWN_LAN_HOST
  const envPort = process.env.ANITOWN_PORT ?? String(DEFAULT_PORT)
  if (envHost && envHost !== 'auto') {
    return `http://${envHost}:${envPort}`
  }
  const ip = detectLanIPv4()
  if (ip) {
    return `http://${ip}:${envPort}`
  }
  // fallback：localhost（仅本机有效；评委只能在本机用，不能扫码）
  return `http://localhost:${envPort}`
}

/** 返回拼接好的扫码落地 URL：`http://192.168.x.x:3000/scan/<token>`。 */
export function buildScanUrl(token: string): string {
  return `${getLanBaseUrl()}/scan/${token}`
}
