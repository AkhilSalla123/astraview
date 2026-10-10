export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new Error(`Cannot reach the backend at ${API_URL}. Is Spring Boot running?`)
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body.error) message = body.error
    } catch { /* body was not JSON */ }
    throw new Error(message)
  }
  if (res.status === 204) return null
  const type = res.headers.get('content-type') || ''
  return type.includes('json') ? res.json() : res.text()
}

export const listSatellites = () => request('/satellites')
export const fetchSatellite = (id) => request(`/satellites/fetch/${id}`, { method: 'POST' })
export const refreshSatellites = () => request('/satellites/refresh', { method: 'POST' })
export const deleteSatellite = (id) => request(`/satellites/${id}`, { method: 'DELETE' })

export const listStations = () => request('/stations')
export const createStation = (s) => request('/stations', { method: 'POST', body: JSON.stringify(s) })
export const updateStation = (id, s) => request(`/stations/${id}`, { method: 'PUT', body: JSON.stringify(s) })
export const deleteStation = (id) => request(`/stations/${id}`, { method: 'DELETE' })

export const orbitPath = (id, minutes = 100, step = 30) =>
  request(`/tracking/orbit/${id}?minutes=${minutes}&step=${step}`)
export const passes = (id, stationId, hours = 24, minElevation = 5) =>
  request(`/tracking/passes/${id}?stationId=${stationId}&hours=${hours}&minElevation=${minElevation}`)
export const antennaStatus = (stationId, id, freq) =>
  request(`/antenna/${stationId}/${id}/status?frequencyMhz=${freq}`)

export const history = (id, limit = 100) =>
  request(`/history?limit=${limit}${id ? `&noradId=${id}` : ''}`)
export const clearHistory = () => request('/history', { method: 'DELETE' })
export const exportUrl = (id) => `${API_URL}/history/export.csv${id ? `?noradId=${id}` : ''}`
