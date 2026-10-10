import { compass, fmt, fmtDoppler } from '../utils'

const STATE_CLASS = { LOCKED: 'ok', TRACKING: 'ok', SLEWING: 'warn', STOWING: 'warn', PARKED: 'idle' }

function Bar({ value, max, className }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="bar" aria-hidden="true">
      <div className={`barfill ${className || ''}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function AntennaPanel({ status }) {
  if (!status) {
    return (
      <section className="panel">
        <h2>Antenna monitor</h2>
        <p className="empty">Choose a satellite and a ground station to start monitoring.</p>
      </section>
    )
  }
  const s = status
  const snrClass = s.snrDb == null ? '' : s.snrDb >= 20 ? 'ok' : s.snrDb >= 10 ? 'warn' : 'bad'
  return (
    <section className="panel">
      <div className="panelhead">
        <h2>Antenna monitor</h2>
        <span className={`badge ${STATE_CLASS[s.state] || 'idle'}`}>{s.state}</span>
      </div>
      <table className="readout">
        <thead>
          <tr><th></th><th>Commanded</th><th>Antenna</th></tr>
        </thead>
        <tbody>
          <tr>
            <th>Azimuth</th>
            <td>{fmt(s.commandedAzimuth, 1, '°')} <small>{compass(s.commandedAzimuth)}</small></td>
            <td>{fmt(s.actualAzimuth, 1, '°')}</td>
          </tr>
          <tr>
            <th>Elevation</th>
            <td>{fmt(s.commandedElevation, 1, '°')}</td>
            <td>{fmt(s.actualElevation, 1, '°')}</td>
          </tr>
        </tbody>
      </table>
      <dl className="metrics">
        <div><dt>Pointing error</dt><dd>{s.visible ? fmt(s.pointingErrorDeg, 2, '°') : '-'}</dd></div>
        <div><dt>Range</dt><dd>{fmt(s.rangeKm, 0, ' km')}</dd></div>
        <div><dt>Doppler at {s.frequencyMhz} MHz</dt><dd>{s.visible ? fmtDoppler(s.dopplerHz) : '-'}</dd></div>
        <div><dt>Received power</dt><dd>{fmt(s.rxPowerDbm, 1, ' dBm')}</dd></div>
      </dl>
      <div className="snr">
        <span>Signal-to-noise</span>
        <strong className={snrClass}>{fmt(s.snrDb, 1, ' dB')}</strong>
        <Bar value={s.snrDb ?? 0} max={40} className={snrClass} />
      </div>
      <ul className="alerts">
        {s.alerts.length === 0 && <li className="okmsg">All systems nominal.</li>}
        {s.alerts.map((a) => <li key={a}>{a}</li>)}
      </ul>
    </section>
  )
}
