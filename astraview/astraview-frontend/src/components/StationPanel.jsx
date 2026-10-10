import { useEffect, useState } from 'react'

const BLANK = { name: '', latitude: '', longitude: '', altitudeM: 0, minElevation: 5 }

export default function StationPanel({ stations, stationId, onSelect, onSave, onDelete, freq, onFreq }) {
  const current = stations.find((s) => s.id === stationId)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [freqText, setFreqText] = useState(String(freq))

  useEffect(() => setFreqText(String(freq)), [freq])

  const startNew = () => { setForm(BLANK); setEditing('new') }
  const startEdit = () => { setForm({ ...current }); setEditing('edit') }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const body = {
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      altitudeM: parseFloat(form.altitudeM) || 0,
      minElevation: parseFloat(form.minElevation) || 0,
    }
    if (await onSave(editing === 'edit' ? form.id : null, body)) setEditing(false)
  }

  const commitFreq = () => {
    const v = parseFloat(freqText)
    if (v >= 30 && v <= 30000) onFreq(v)
    else setFreqText(String(freq))
  }

  return (
    <section className="panel">
      <div className="panelhead">
        <h2>Ground station</h2>
        {!editing && <button className="link" onClick={startNew}>New station</button>}
      </div>
      {editing ? (
        <form className="stack" onSubmit={submit}>
          <label>Name<input required value={form.name} onChange={set('name')} /></label>
          <div className="two">
            <label>Latitude (°)<input required type="number" step="any" min="-90" max="90" value={form.latitude} onChange={set('latitude')} /></label>
            <label>Longitude (°)<input required type="number" step="any" min="-180" max="180" value={form.longitude} onChange={set('longitude')} /></label>
          </div>
          <div className="two">
            <label>Altitude (m)<input type="number" step="any" value={form.altitudeM} onChange={set('altitudeM')} /></label>
            <label>Elevation mask (°)<input type="number" step="any" min="0" max="90" value={form.minElevation} onChange={set('minElevation')} /></label>
          </div>
          <div className="toolbar">
            <button type="submit">Save station</button>
            <button type="button" className="link" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <label className="stack">
            <span className="sr">Active station</span>
            <select value={stationId || ''} onChange={(e) => onSelect(e.target.value)}>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          {current && (
            <p className="meta">
              {current.latitude.toFixed(4)}°, {current.longitude.toFixed(4)}° · {current.altitudeM} m · mask {current.minElevation}°
            </p>
          )}
          <div className="toolbar">
            <button className="link" onClick={startEdit} disabled={!current}>Edit</button>
            <button className="link danger" onClick={() => current && window.confirm(`Delete ${current.name}?`) && onDelete(current.id)} disabled={!current}>Delete</button>
          </div>
          <label className="stack">Receiver frequency (MHz)
            <input value={freqText} inputMode="decimal" onChange={(e) => setFreqText(e.target.value)}
                   onBlur={commitFreq} onKeyDown={(e) => e.key === 'Enter' && commitFreq()} />
          </label>
        </>
      )}
    </section>
  )
}
