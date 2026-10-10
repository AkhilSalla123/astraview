export const QUICK_SATELLITES = [
  { id: 25544, label: 'ISS' },
  { id: 20580, label: 'Hubble' },
  { id: 33591, label: 'NOAA 19' },
  { id: 25338, label: 'NOAA 15' },
  { id: 48274, label: 'Tiangong' },
  { id: 49260, label: 'Landsat 9' },
]

export const fmt = (v, digits = 1, unit = '') =>
  v === null || v === undefined || Number.isNaN(v) ? '-' : `${Number(v).toFixed(digits)}${unit}`

export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export const fmtDuration = (s) => `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, '0')}s`

export const fmtDoppler = (hz) =>
  hz === null || hz === undefined ? '-' : `${hz >= 0 ? '+' : '-'}${(Math.abs(hz) / 1000).toFixed(2)} kHz`

export const compass = (az) =>
  ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][
    Math.round((((az % 360) + 360) % 360) / 22.5) % 16
  ]

export function countdown(iso, now = Date.now()) {
  const ms = new Date(iso).getTime() - now
  if (ms <= 0) return 'now'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m ${String(s % 60).padStart(2, '0')}s`
}
