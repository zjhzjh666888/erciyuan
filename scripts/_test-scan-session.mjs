// 一次性 e2e smoke：create → get → submit → poll，验证 sessionStore 闭环。
const base = 'http://localhost:3000/api/scan/session'

const r1 = await fetch(base, { method: 'POST' })
const s = await r1.json()
console.log('1) created token:', s.token, 'scanUrl:', s.scanUrl)

const r2 = await fetch(`${base}/${s.token}`)
console.log('2) get pending:', r2.status, await r2.text())

const r3 = await fetch(`${base}/${s.token}/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    displayName: '铃音',
    mascotType: 'cat_lore',
    obsession: '刷满本命应援榜',
    factionId: 'star_feather',
  }),
})
console.log('3) submit:', r3.status, await r3.text())

const r4 = await fetch(`${base}/${s.token}`)
console.log('4) poll after submit:', r4.status, await r4.text())

const r5 = await fetch(`${base}/${s.token}`, { method: 'DELETE' })
console.log('5) delete (consume):', r5.status, await r5.text())
