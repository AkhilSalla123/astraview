import { useEffect, useState } from 'react'
import { compass, countdown, fmt, fmtDateTime, fmtDuration } from '../utils'

export default function PassTable({ passes, selected, onSelect, loading }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (loading) return <p className="empty">Calculating passes…</p>
  if (!passes.length) return <p className="empty">No passes above the minimum elevation in the next 24 hours.</p>
  const next = passes.find((p) => new Date(p.los).getTime() > now)

  return (
    <div className="tablewrap">
      <table className="grid">
        <thead>
          <tr>
            <th>Rises</th><th>Starts in</th><th>Duration</th><th>Max elevation</th><th>Rises at</th><th>Sets at</th>
          </tr>
        </thead>
        <tbody>
          {passes.map((p, i) => (
            <tr key={p.aos} className={`${i === selected ? 'selected' : ''} ${p === next ? 'next' : ''}`}
                onClick={() => onSelect(i)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect(i)}>
              <td>{fmtDateTime(p.aos)}</td>
              <td>{new Date(p.aos).getTime() <= now && new Date(p.los).getTime() > now ? 'overhead now' : countdown(p.aos, now)}</td>
              <td>{fmtDuration(p.duration_s)}</td>
              <td>{fmt(p.max_elevation, 1, '°')}</td>
              <td>{compass(p.aos_azimuth)} {fmt(p.aos_azimuth, 0, '°')}</td>
              <td>{compass(p.los_azimuth)} {fmt(p.los_azimuth, 0, '°')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
