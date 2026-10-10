import { fmtTime } from '../utils'

const SIZE = 300
const C = SIZE / 2
const R = 128

const xy = (az, el) => {
  const r = ((90 - Math.max(0, el)) / 90) * R
  const a = (az * Math.PI) / 180
  return [C + r * Math.sin(a), C - r * Math.cos(a)]
}

/** Polar plot of the sky above the station: centre is zenith, rim is the horizon. */
export default function SkyPlot({ pass, live }) {
  const path = pass?.path || []
  const d = path.map((p, i) => `${i ? 'L' : 'M'}${xy(p.azimuth, p.elevation).join(' ')}`).join(' ')
  const first = path[0]
  const last = path[path.length - 1]
  const label = [
    ['N', 0], ['E', 90], ['S', 180], ['W', 270],
  ]
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="skyplot" role="img" aria-label="Sky plot of the selected pass">
      {[0, 30, 60].map((el) => (
        <circle key={el} cx={C} cy={C} r={((90 - el) / 90) * R} className="ring" />
      ))}
      {[0, 45, 90, 135].map((az) => {
        const [x1, y1] = xy(az, 0)
        const [x2, y2] = xy(az + 180, 0)
        return <line key={az} x1={x1} y1={y1} x2={x2} y2={y2} className="ring" />
      })}
      {[30, 60].map((el) => (
        <text key={el} x={C + 4} y={C - ((90 - el) / 90) * R - 3} className="tick">{el}°</text>
      ))}
      {label.map(([t, az]) => {
        const a = (az * Math.PI) / 180
        const x = C + (R + 12) * Math.sin(a)
        const y = C - (R + 12) * Math.cos(a)
        return <text key={t} x={x} y={y + 4} textAnchor="middle" className="cardinal">{t}</text>
      })}
      {d && <path d={d} className="passline" />}
      {first && (
        <g>
          <circle cx={xy(first.azimuth, first.elevation)[0]} cy={xy(first.azimuth, first.elevation)[1]} r="4" className="aos" />
          <text x={xy(first.azimuth, first.elevation)[0] + 7} y={xy(first.azimuth, first.elevation)[1] - 5} className="tick">{fmtTime(first.time)}</text>
        </g>
      )}
      {last && last !== first && (
        <g>
          <circle cx={xy(last.azimuth, last.elevation)[0]} cy={xy(last.azimuth, last.elevation)[1]} r="4" className="los" />
          <text x={xy(last.azimuth, last.elevation)[0] + 7} y={xy(last.azimuth, last.elevation)[1] + 12} className="tick">{fmtTime(last.time)}</text>
        </g>
      )}
      {live?.visible && (
        <>
          <circle cx={xy(live.commandedAzimuth, live.commandedElevation)[0]} cy={xy(live.commandedAzimuth, live.commandedElevation)[1]} r="6" className="sat" />
          <circle cx={xy(live.actualAzimuth, live.actualElevation)[0]} cy={xy(live.actualAzimuth, live.actualElevation)[1]} r="9" className="dish" />
        </>
      )}
    </svg>
  )
}
