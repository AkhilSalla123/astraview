import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'

/** 3D globe: satellite, its path for the next orbit, the ground station and the line of sight. */
export default function GlobeView({ sat, orbit, station, focusKey }) {
  const container = useRef(null)
  const viewer = useRef(null)
  const entities = useRef({})
  const lastFocus = useRef(null)

  useEffect(() => {
    const v = new Cesium.Viewer(container.current, {
      baseLayer: new Cesium.ImageryLayer(
        new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' }),
      ),
      baseLayerPicker: false, geocoder: false, homeButton: false, sceneModePicker: false,
      navigationHelpButton: false, animation: false, timeline: false, fullscreenButton: false,
      infoBox: false, selectionIndicator: false,
    })
    v.scene.globe.enableLighting = true
    v.scene.skyAtmosphere.show = true
    v.cesiumWidget.creditContainer.style.display = 'none'
    viewer.current = v

    entities.current.orbit = v.entities.add({
      polyline: { positions: [], width: 2, material: Cesium.Color.fromCssColorString('#4cc3ff').withAlpha(0.85) },
    })
    entities.current.link = v.entities.add({
      polyline: { positions: [], width: 1.5, material: Cesium.Color.fromCssColorString('#5be3a4') },
    })
    entities.current.sat = v.entities.add({
      point: { pixelSize: 11, color: Cesium.Color.fromCssColorString('#ffc857'), outlineColor: Cesium.Color.BLACK, outlineWidth: 2 },
      label: {
        text: '', font: '13px system-ui', fillColor: Cesium.Color.WHITE, showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('#0b1220').withAlpha(0.8),
        pixelOffset: new Cesium.Cartesian2(0, -22),
      },
    })
    entities.current.station = v.entities.add({
      point: { pixelSize: 9, color: Cesium.Color.fromCssColorString('#5be3a4'), outlineColor: Cesium.Color.BLACK, outlineWidth: 2 },
      label: {
        text: '', font: '12px system-ui', fillColor: Cesium.Color.WHITE, showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('#0b1220').withAlpha(0.8),
        pixelOffset: new Cesium.Cartesian2(0, 20),
      },
    })
    return () => {
      v.destroy()
      viewer.current = null
    }
  }, [])

  useEffect(() => {
    const { station: st } = entities.current
    if (!st || !station) return
    st.position = Cesium.Cartesian3.fromDegrees(station.longitude, station.latitude, station.altitudeM || 0)
    st.label.text = station.name
  }, [station])

  useEffect(() => {
    const e = entities.current
    if (!e.orbit) return
    e.orbit.polyline.positions = (orbit || []).map(
      (p) => new Cesium.Cartesian3(p.ecef_km[0] * 1000, p.ecef_km[1] * 1000, p.ecef_km[2] * 1000),
    )
  }, [orbit])

  useEffect(() => {
    const e = entities.current
    if (!e.sat || !sat) return
    const pos = Cesium.Cartesian3.fromDegrees(sat.longitude, sat.latitude, sat.altitudeKm * 1000)
    e.sat.position = pos
    e.sat.label.text = sat.satellite || ''
    if (station && sat.visible) {
      e.link.polyline.positions = [
        Cesium.Cartesian3.fromDegrees(station.longitude, station.latitude, station.altitudeM || 0),
        pos,
      ]
    } else {
      e.link.polyline.positions = []
    }
    if (viewer.current && lastFocus.current !== focusKey) {
      lastFocus.current = focusKey
      viewer.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(sat.longitude, sat.latitude, sat.altitudeKm * 1000 + 9_000_000),
        duration: 1.6,
      })
    }
  }, [sat, station, focusKey])

  return <div ref={container} className="globe" aria-label="3D globe showing the satellite and its orbit" />
}
