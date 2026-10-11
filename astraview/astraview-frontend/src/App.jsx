import { useCallback, useEffect, useState } from 'react'
import * as api from './api'
import GlobeView from './components/GlobeView'
import SatellitePanel from './components/SatellitePanel'
import StationPanel from './components/StationPanel'
import AntennaPanel from './components/AntennaPanel'
import PassTable from './components/PassTable'
import SkyPlot from './components/SkyPlot'
import HistoryPanel from './components/HistoryPanel'
import AntennaBuilder from './components/AntennaBuilder'
import { fmt, fmtDoppler } from './utils'

export default function App() {
  const [satellites, setSatellites] = useState([])
  const [stations, setStations] = useState([])
  const [noradId, setNoradId] = useState(null)
  const [stationId, setStationId] = useState(null)
  const [freq, setFreq] = useState(437.0)
  const [status, setStatus] = useState(null)
  const [orbit, setOrbit] = useState([])
  const [passes, setPasses] = useState([])
  const [passesLoading, setPassesLoading] = useState(false)
  const [selectedPass, setSelectedPass] = useState(0)
  const [tab, setTab] = useState('globe')
  const [globeSubTab, setGlobeSubTab] = useState('passes')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const station = stations.find((s) => s.id === stationId) || null

  const loadInitial = useCallback(() => {
    return Promise.all([api.listSatellites(), api.listStations()])
      .then(([sats, sts]) => {
        setSatellites(sats)
        setStations(sts)
        if (sats.length) setNoradId((prev) => prev || sats[0].noradId)
        if (sts.length) setStationId((prev) => prev || sts[0].id)
        setError('')
      })
      .catch((e) => setError(e.message))
  }, [])

  // initial load
  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  // auto-retry if initial load failed (e.g. while Render wakes from sleep)
  useEffect(() => {
    if (satellites.length > 0 && stations.length > 0) return
    const id = setInterval(loadInitial, 5000)
    return () => clearInterval(id)
  }, [satellites.length, stations.length, loadInitial])

  // live antenna status
  useEffect(() => {
    if (!noradId || !stationId) {
      setStatus(null)
      return undefined
    }
    let alive = true
    const tick = async () => {
      try {
        const s = await api.antennaStatus(stationId, noradId, freq)
        if (alive) { setStatus(s); setError('') }
      } catch (e) {
        if (alive) setError(e.message)
      }
    }
    tick()
    const id = setInterval(tick, 2000)
    return () => { alive = false; clearInterval(id) }
  }, [noradId, stationId, freq])

  // orbit line (refreshed every 5 minutes)
  useEffect(() => {
    if (!noradId) { setOrbit([]); return undefined }
    let alive = true
    const load = () => api.orbitPath(noradId, 100, 30).then((r) => alive && setOrbit(r.points)).catch(() => {})
    load()
    const id = setInterval(load, 5 * 60 * 1000)
    return () => { alive = false; clearInterval(id) }
  }, [noradId])

  // pass predictions
  useEffect(() => {
    if (!noradId || !station) { setPasses([]); return undefined }
    let alive = true
    setPassesLoading(true)
    api.passes(noradId, station.id, 24, station.minElevation)
      .then((r) => { if (alive) { setPasses(r.passes); setSelectedPass(0) } })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setPassesLoading(false))
    return () => { alive = false }
  }, [noradId, station?.id, station?.minElevation]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = useCallback(async (fn) => {
    setBusy(true)
    try { await fn(); setError('') } catch (e) { setError(e.message) } finally { setBusy(false) }
  }, [])

  const addSatellite = (id) => run(async () => {
    const sat = await api.fetchSatellite(id)
    setSatellites(await api.listSatellites())
    setNoradId(sat.noradId)
  })
  const removeSatellite = (id) => run(async () => {
    await api.deleteSatellite(id)
    const list = await api.listSatellites()
    setSatellites(list)
    if (id === noradId) setNoradId(list[0]?.noradId ?? null)
  })
  const refreshTles = () => run(async () => setSatellites(await api.refreshSatellites()))

  const saveStation = async (id, body) => {
    try {
      const saved = id ? await api.updateStation(id, body) : await api.createStation(body)
      const list = await api.listStations()
      setStations(list)
      setStationId(saved.id)
      setError('')
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }
  const removeStation = (id) => run(async () => {
    await api.deleteStation(id)
    const list = await api.listStations()
    setStations(list)
    if (id === stationId) setStationId(list[0]?.id ?? null)
  })

  const pass = passes[selectedPass]

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>AstraView</h1>
          <p>Real-time satellite tracking and antenna monitoring</p>
        </div>
        {status && (
          <div className="live" aria-live="polite">
            <div><span>Latitude</span><b>{fmt(status.latitude, 3, '°')}</b></div>
            <div><span>Longitude</span><b>{fmt(status.longitude, 3, '°')}</b></div>
            <div><span>Altitude</span><b>{fmt(status.altitudeKm, 0, ' km')}</b></div>
            <div><span>Speed</span><b>{fmt(status.speedKmS, 2, ' km/s')}</b></div>
            <div><span>Doppler</span><b>{status.visible ? fmtDoppler(status.dopplerHz) : '-'}</b></div>
          </div>
        )}
      </header>

      {error && (
        <div className="banner" role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <span>{error}</span>
          <button
            type="button"
            onClick={() => { setError(''); loadInitial() }}
            style={{ background: '#38bdf8', color: '#0b1120', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
          >
            Retry Now
          </button>
        </div>
      )}

      <nav className="main-nav" role="tablist">
        {[
          ['globe', '🌐 3D Orbit Tracker'],
          ['builder', '🛠️ DIY Antenna Builder'],
          ['passes', '🛰️ Passes & Radar'],
          ['station', '📡 Ground Station & Rotator'],
          ['history', '📊 Telemetry History'],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            className={`nav-tab ${tab === k ? 'active' : ''}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'globe' && (
        <main className="layout">
          <aside className="side">
            <SatellitePanel satellites={satellites} noradId={noradId} onSelect={setNoradId}
                            onAdd={addSatellite} onRemove={removeSatellite} onRefresh={refreshTles} busy={busy} />
            <StationPanel stations={stations} stationId={stationId} onSelect={setStationId}
                          onSave={saveStation} onDelete={removeStation} freq={freq} onFreq={setFreq} />
          </aside>

          <section className="center">
            <GlobeView sat={status} orbit={orbit} station={station} focusKey={noradId} />
            <div className="tabs" role="tablist">
              {[
                ['passes', 'Passes'],
                ['sky', 'Sky plot'],
              ].map(([k, label]) => (
                <button key={k} role="tab" aria-selected={globeSubTab === k} className={globeSubTab === k ? 'on' : ''} onClick={() => setGlobeSubTab(k)}>{label}</button>
              ))}
            </div>
            <div className="tabbody">
              {globeSubTab === 'passes' && <PassTable passes={passes} selected={selectedPass} onSelect={(i) => { setSelectedPass(i); setGlobeSubTab('sky') }} loading={passesLoading} />}
              {globeSubTab === 'sky' && (
                <div className="skywrap">
                  <SkyPlot pass={pass} live={status} />
                  <div className="skylegend">
                    <p><i className="dot aos" /> Rise <i className="dot los" /> Set <i className="dot sat" /> Commanded <i className="dot dish" /> Antenna</p>
                    <p className="meta">{pass ? 'Showing the selected pass. Pick another one in the Passes tab.' : 'No pass to show yet.'}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="side">
            <AntennaPanel status={status} />
          </aside>
        </main>
      )}

      {tab === 'builder' && (
        <main className="layout-two-col">
          <aside className="side">
            <SatellitePanel satellites={satellites} noradId={noradId} onSelect={setNoradId}
                            onAdd={addSatellite} onRemove={removeSatellite} onRefresh={refreshTles} busy={busy} />
          </aside>
          <section className="main-panel">
            <AntennaBuilder sat={status} freq={freq} />
          </section>
        </main>
      )}

      {tab === 'passes' && (
        <main className="layout-two-col">
          <aside className="side">
            <SatellitePanel satellites={satellites} noradId={noradId} onSelect={setNoradId}
                            onAdd={addSatellite} onRemove={removeSatellite} onRefresh={refreshTles} busy={busy} />
            <StationPanel stations={stations} stationId={stationId} onSelect={setStationId}
                          onSave={saveStation} onDelete={removeStation} freq={freq} onFreq={setFreq} />
          </aside>
          <section className="main-panel">
            <div className="panelhead">
              <h2>Pass Predictions & Sky Plot Radar</h2>
              <span className="meta">{station ? `${station.name} (${station.latitude.toFixed(2)}°, ${station.longitude.toFixed(2)}°)` : 'No station selected'}</span>
            </div>
            <div className="passes-grid">
              <PassTable passes={passes} selected={selectedPass} onSelect={setSelectedPass} loading={passesLoading} />
              <div className="skywrap" style={{ flexDirection: 'column', alignItems: 'center' }}>
                <SkyPlot pass={pass} live={status} />
                <div className="skylegend">
                  <p><i className="dot aos" /> Rise <i className="dot los" /> Set <i className="dot sat" /> Commanded <i className="dot dish" /> Antenna</p>
                  <p className="meta">{pass ? 'Showing selected pass trajectory.' : 'No pass selected.'}</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {tab === 'station' && (
        <main className="layout-two-col">
          <aside className="side">
            <StationPanel stations={stations} stationId={stationId} onSelect={setStationId}
                          onSave={saveStation} onDelete={removeStation} freq={freq} onFreq={setFreq} />
          </aside>
          <section className="main-panel">
            <AntennaPanel status={status} />
          </section>
        </main>
      )}

      {tab === 'history' && (
        <main className="layout-two-col">
          <aside className="side">
            <SatellitePanel satellites={satellites} noradId={noradId} onSelect={setNoradId}
                            onAdd={addSatellite} onRemove={removeSatellite} onRefresh={refreshTles} busy={busy} />
          </aside>
          <section className="main-panel">
            <HistoryPanel noradId={noradId} active={tab === 'history'} />
          </section>
        </main>
      )}
    </div>
  )
}
