import { useState } from 'react'
import { QUICK_SATELLITES } from '../utils'

export default function SatellitePanel({ satellites, noradId, onSelect, onAdd, onRemove, onRefresh, busy }) {
  const [input, setInput] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const id = parseInt(input, 10)
    if (id > 0) {
      onAdd(id)
      setInput('')
    }
  }
  const saved = new Set(satellites.map((s) => s.noradId))
  return (
    <section className="panel">
      <div className="panelhead">
        <h2>Satellites</h2>
        <button className="link" onClick={onRefresh} disabled={busy || !satellites.length}>Update TLEs</button>
      </div>
      <form onSubmit={submit} className="inline">
        <label htmlFor="norad" className="sr">NORAD catalog number</label>
        <input id="norad" inputMode="numeric" placeholder="NORAD ID, e.g. 25544" value={input}
               onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))} />
        <button type="submit" disabled={busy || !input}>Add</button>
      </form>
      <div className="chips">
        {QUICK_SATELLITES.filter((q) => !saved.has(q.id)).map((q) => (
          <button key={q.id} className="chip" onClick={() => onAdd(q.id)} disabled={busy}>+ {q.label}</button>
        ))}
      </div>
      {satellites.length === 0 ? (
        <p className="empty">No satellites yet. Add a NORAD ID or pick one above.</p>
      ) : (
        <ul className="list">
          {satellites.map((s) => (
            <li key={s.noradId} className={s.noradId === noradId ? 'active' : ''}>
              <button className="rowbtn" onClick={() => onSelect(s.noradId)}>
                <span>{s.name}</span>
                <small>{s.noradId}</small>
              </button>
              <button className="x" aria-label={`Remove ${s.name}`} onClick={() => onRemove(s.noradId)}>×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
