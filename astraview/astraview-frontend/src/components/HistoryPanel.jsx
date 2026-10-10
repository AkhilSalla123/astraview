import { useCallback, useEffect, useState } from 'react'
import * as api from '../api'
import { fmt, fmtDoppler, fmtTime } from '../utils'

export default function HistoryPanel({ noradId, active }) {
  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    try {
      setRows(await api.history(noradId, 100))
      setMsg('')
    } catch (e) {
      setMsg(e.message)
    }
  }, [noradId])

  useEffect(() => {
    if (!active) return undefined
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [active, load])

  const clear = async () => {
    if (!window.confirm('Delete all saved tracking history?')) return
    await api.clearHistory()
    load()
  }

  return (
    <div>
      <div className="toolbar">
        <button onClick={load}>Refresh</button>
        <a className="button" href={api.exportUrl(noradId)}>Download CSV</a>
        <button className="danger" onClick={clear}>Clear history</button>
        {msg && <span className="inlineerr">{msg}</span>}
      </div>
      {rows.length === 0 ? (
        <p className="empty">Samples are saved while a satellite is above the station's elevation mask.</p>
      ) : (
        <div className="tablewrap">
          <table className="grid">
            <thead>
              <tr><th>Time</th><th>Satellite</th><th>Az</th><th>El</th><th>Range</th><th>Doppler</th><th>SNR</th><th>State</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{fmtTime(r.time)}</td><td>{r.satelliteName}</td>
                  <td>{fmt(r.azimuth, 1, '°')}</td><td>{fmt(r.elevation, 1, '°')}</td>
                  <td>{fmt(r.rangeKm, 0, ' km')}</td><td>{fmtDoppler(r.dopplerHz)}</td>
                  <td>{fmt(r.snrDb, 1, ' dB')}</td><td>{r.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
