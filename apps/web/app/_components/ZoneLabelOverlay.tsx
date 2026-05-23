/**
 * ZoneLabelOverlay — floating labels positioned over the Phaser canvas
 * to identify key town zones (matching the target design).
 */
export function ZoneLabelOverlay(): JSX.Element {
  const zones = [
    { name: '热搜墙', x: '18%', y: '12%' },
    { name: '次元广场', x: '52%', y: '10%' },
    { name: '谷子店', x: '78%', y: '12%' },
    { name: '同人咖啡厅', x: '38%', y: '38%' },
    { name: '痛房', x: '30%', y: '62%' },
    { name: '扭蛋机', x: '55%', y: '58%' },
    { name: '党争擂台', x: '72%', y: '52%' },
  ]

  return (
    <div className="zone-overlay" aria-hidden="true">
      {zones.map((z) => (
        <span
          key={z.name}
          className="zone-label"
          style={{ left: z.x, top: z.y }}
        >
          {z.name}
        </span>
      ))}
    </div>
  )
}
