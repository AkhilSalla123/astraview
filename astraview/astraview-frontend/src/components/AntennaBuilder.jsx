import { useState } from 'react'

/** Satellite-specific recommendations and default operational frequencies */
const SATELLITE_PROFILES = {
  25544: { // ISS
    type: 'Dual-Band Handheld Tape-Measure Yagi',
    difficulty: 'Easy (DIY ~45 mins)',
    primaryFreq: 145.8,
    mode: 'Voice / SSTV Space Photos / APRS Packet',
    description: 'The International Space Station transmits voice to schools, APRS packets (145.825 MHz), and SSTV color pictures from orbit (145.800 MHz). A handheld 3-element tape measure Yagi is the gold standard for tracking it by hand.',
    materials: ['1/2-inch PVC pipe (1 meter)', 'Steel tape measure (1 inch wide)', '5x Hose clamps or zip-ties', '50-ohm RG-58 coax cable with SMA connector', 'RTL-SDR USB dongle or Handheld VHF Radio'],
  },
  20580: { // Hubble
    type: 'UHF 5-Element High-Gain Yagi',
    difficulty: 'Moderate DIY (~1 hour)',
    primaryFreq: 437.0,
    mode: 'Digital Telemetry Beacon',
    description: 'Hubble Space Telescope downlinks wideband telemetry. Because its signal is weak from 540 km up, a multi-element directional UHF Yagi with high forward gain is needed.',
    materials: ['3/4-inch wood dowel or PVC pipe (1 meter)', '3mm solid brass / copper welding rods', 'Terminal block or BNC/SMA chassis connector', '50-ohm RG-58 coax cable', 'RTL-SDR with LNA (Low Noise Amplifier)'],
  },
  33591: { // NOAA 19
    type: '120° V-Dipole or Turnstile Antenna',
    difficulty: 'Super Easy (DIY ~15 mins)',
    primaryFreq: 137.1,
    mode: 'APT Live Satellite Cloud Weather Fax',
    description: 'NOAA weather satellites broadcast real-time analog cloud photography. A simple 120-degree V-dipole made of two metal rods receives live images directly overhead without needing any motors or tracking!',
    materials: ['Two 54 cm metal rods (or telescopic antennas)', 'Terminal block / mount at 120-degree angle', '50-ohm coaxial cable with SMA plug', 'RTL-SDR USB receiver + WXtoImg decoding software'],
  },
  25338: { // NOAA 15
    type: '120° V-Dipole or Turnstile Antenna',
    difficulty: 'Super Easy (DIY ~15 mins)',
    primaryFreq: 137.62,
    mode: 'APT Live Satellite Cloud Weather Fax',
    description: 'NOAA 15 beams live satellite weather images. Two metal rods bent into a 120° horizontal V pointed south will capture passes overhead automatically.',
    materials: ['Two 54 cm metal rods (or telescopic antennas)', 'Terminal block / mount at 120-degree angle', '50-ohm coaxial cable with SMA plug', 'RTL-SDR USB receiver + WXtoImg decoding software'],
  },
  48274: { // Tiangong
    type: 'Handheld VHF/UHF Cross-Yagi',
    difficulty: 'Moderate DIY',
    primaryFreq: 145.9,
    mode: 'Telemetry & Amateur Radio Transponder',
    description: 'China Tiangong space station carries an amateur radio payload (CSS). A handheld directional Yagi pointed towards its passes gives strong signal reception.',
    materials: ['PVC pipe boom (1 meter)', 'Measuring tape blades or wire', '50-ohm coax cable', 'Handheld radio or SDR receiver'],
  },
  49260: { // Landsat 9
    type: 'High-Gain UHF/S-Band Tracking Array',
    difficulty: 'Advanced',
    primaryFreq: 437.5,
    mode: 'Earth Observation Telemetry',
    description: 'Earth science observation satellite. Best monitored with a narrow-beam UHF array or small parabolic grid dish with rotator.',
    materials: ['Reflector grid or long-boom Yagi', 'Low-loss coax cable (LMR-400)', 'SDR receiver with pre-amplifier'],
  },
}

export default function AntennaBuilder({ sat, freq }) {
  const currentNorad = sat?.noradId
  const profile = SATELLITE_PROFILES[currentNorad] || {
    type: 'Universal 3-Element Directional Yagi',
    difficulty: 'Easy DIY (~45 mins)',
    primaryFreq: freq || 437.0,
    mode: 'Satellite Telemetry & Downlink',
    description: 'A tuned 3-element Yagi antenna offers high directional gain, excellent front-to-back ratio, and compact size suitable for handheld tracking.',
    materials: ['1/2-inch PVC pipe (0.8m)', 'Steel tape measure or metal rod', '50-ohm RG-58 coax cable', 'SMA connector', 'RTL-SDR USB receiver'],
  }

  const [activeFreq, setActiveFreq] = useState(profile.primaryFreq || freq || 437.0)

  // Calculations:
  // Speed of light: 299,792,458 m/s -> Wavelength in cm: 29979.2458 / freq_mhz
  const wavelengthCm = 29979.25 / activeFreq
  const wavelengthInches = wavelengthCm / 2.54

  // Standard 3-element Yagi dimensions
  const reflectorCm = Math.round(wavelengthCm * 0.495 * 10) / 10
  const drivenTotalCm = Math.round(wavelengthCm * 0.473 * 10) / 10
  const drivenHalfCm = Math.round(((drivenTotalCm - 1) / 2) * 10) / 10
  const director1Cm = Math.round(wavelengthCm * 0.440 * 10) / 10
  const director2Cm = Math.round(wavelengthCm * 0.425 * 10) / 10

  // Spacing from rear (reflector at 0)
  const spacingDrivenCm = Math.round(wavelengthCm * 0.20 * 10) / 10
  const spacingDir1Cm = Math.round(wavelengthCm * (0.20 + 0.18) * 10) / 10
  const spacingDir2Cm = Math.round(wavelengthCm * (0.20 + 0.18 + 0.20) * 10) / 10
  const boomLengthCm = Math.round((spacingDir2Cm + 10) * 10) / 10

  // 120° V-Dipole (for 137 MHz weather satellites)
  const vDipoleLegCm = Math.round((wavelengthCm / 4) * 0.95 * 10) / 10

  return (
    <div className="builder-panel">
      <div className="builder-header">
        <div>
          <h3>📡 {profile.type}</h3>
          <p className="builder-sub">
            Recommended for <b>{sat?.satellite || 'Selected Satellite'}</b> ({profile.mode})
          </p>
        </div>
        <div className="builder-freq-box">
          <label htmlFor="target-freq">Tuned Frequency:</label>
          <div className="freq-input-group">
            <input
              id="target-freq"
              type="number"
              step="0.01"
              value={activeFreq}
              onChange={(e) => setActiveFreq(parseFloat(e.target.value) || 145)}
            />
            <span>MHz</span>
          </div>
        </div>
      </div>

      <p className="builder-desc">{profile.description}</p>

      {/* Blueprint Visualizer */}
      <div className="blueprint-card">
        <h4>📐 Construction Blueprint &amp; Measurements</h4>
        <p className="blueprint-meta">
          Calculated for <b>{activeFreq} MHz</b> &bull; $\lambda$ = {wavelengthCm.toFixed(1)} cm ({wavelengthInches.toFixed(1)} in) &bull; Boom Length: {boomLengthCm} cm
        </p>

        <div className="blueprint-diagram">
          {/* Reflector */}
          <div className="diagram-element reflector" style={{ height: '180px' }}>
            <span className="element-label">REFLECTOR</span>
            <span className="element-dimension">{reflectorCm} cm</span>
            <span className="element-pos">Pos: 0 cm</span>
          </div>

          <div className="diagram-spacing" style={{ width: '50px' }}>
            <span>{spacingDrivenCm} cm</span>
          </div>

          {/* Driven Element (Split) */}
          <div className="diagram-element driven" style={{ height: '160px' }}>
            <span className="element-label">DRIVEN (Split Dipole)</span>
            <span className="element-dimension">2x {drivenHalfCm} cm</span>
            <span className="element-pos">Pos: {spacingDrivenCm} cm</span>
            <div className="coax-connection">⚡ 50Ω Coax feed</div>
          </div>

          <div className="diagram-spacing" style={{ width: '45px' }}>
            <span>{(spacingDir1Cm - spacingDrivenCm).toFixed(1)} cm</span>
          </div>

          {/* Director 1 */}
          <div className="diagram-element director" style={{ height: '140px' }}>
            <span className="element-label">DIRECTOR 1</span>
            <span className="element-dimension">{director1Cm} cm</span>
            <span className="element-pos">Pos: {spacingDir1Cm} cm</span>
          </div>

          <div className="diagram-spacing" style={{ width: '50px' }}>
            <span>{(spacingDir2Cm - spacingDir1Cm).toFixed(1)} cm</span>
          </div>

          {/* Director 2 */}
          <div className="diagram-element director" style={{ height: '125px' }}>
            <span className="element-label">DIRECTOR 2</span>
            <span className="element-dimension">{director2Cm} cm</span>
            <span className="element-pos">Pos: {spacingDir2Cm} cm</span>
          </div>
        </div>
      </div>

      {/* Cut Sheet Specifications Table */}
      <div className="cut-sheet-grid">
        <div className="cut-card">
          <h4>✂️ Element Cutting Sheet (Exact Sizes)</h4>
          <table className="cut-table">
            <thead>
              <tr>
                <th>Element</th>
                <th>Role</th>
                <th>Length</th>
                <th>Position on Boom</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Reflector</b></td>
                <td>Reflects beam forward</td>
                <td><span className="cut-highlight">{reflectorCm} cm</span> ({(reflectorCm / 2.54).toFixed(1)}")</td>
                <td>0.0 cm (Rear)</td>
              </tr>
              <tr>
                <td><b>Driven Element</b></td>
                <td>Connects to coax wire</td>
                <td><span className="cut-highlight">2 halves @ {drivenHalfCm} cm</span> (1cm center gap)</td>
                <td>{spacingDrivenCm} cm</td>
              </tr>
              <tr>
                <td><b>Director 1</b></td>
                <td>Focuses beam</td>
                <td><span className="cut-highlight">{director1Cm} cm</span> ({(director1Cm / 2.54).toFixed(1)}")</td>
                <td>{spacingDir1Cm} cm</td>
              </tr>
              <tr>
                <td><b>Director 2</b></td>
                <td>Adds forward gain</td>
                <td><span className="cut-highlight">{director2Cm} cm</span> ({(director2Cm / 2.54).toFixed(1)}")</td>
                <td>{spacingDir2Cm} cm</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Alternative: Simple V-Dipole for Weather Sats */}
        {activeFreq < 150 && (
          <div className="cut-card alt-card">
            <h4>🌤️ Ultra-Simple Alternative: 120° V-Dipole</h4>
            <p className="alt-desc">
              If tracking by hand sounds tricky, build a horizontal 120° V-dipole! It requires no pointing and listens to passes automatically.
            </p>
            <ul>
              <li><b>Two metal legs</b>: Cut each leg to exactly <span className="cut-highlight">{vDipoleLegCm} cm</span> ({(vDipoleLegCm / 2.54).toFixed(1)}").</li>
              <li><b>Angle</b>: Fix them in a "V" shape spread at <b>120 degrees</b>.</li>
              <li><b>Coax</b>: Connect center wire to one leg, shield braid to the other.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Materials & Step-by-Step Build */}
      <div className="build-guide-grid">
        <div className="materials-box">
          <h4>🛒 Hardware Shopping List (&lt; $15 total)</h4>
          <ul>
            {profile.materials.map((m, idx) => (
              <li key={idx}>✓ {m}</li>
            ))}
          </ul>
        </div>

        <div className="instructions-box">
          <h4>🔨 5-Minute DIY Build Instructions</h4>
          <ol>
            <li><b>Cut the boom:</b> Cut a {boomLengthCm} cm piece of PVC pipe (or wood dowel).</li>
            <li><b>Mark element spots:</b> Using a ruler, mark lines at 0 cm, {spacingDrivenCm} cm, {spacingDir1Cm} cm, and {spacingDir2Cm} cm.</li>
            <li><b>Cut metal elements:</b> Cut measuring tape or metal coat hanger rods to the exact lengths in the table above.</li>
            <li><b>Attach to boom:</b> Secure each element perpendicular to the pipe using hose clamps, zip ties, or hot glue.</li>
            <li><b>Wire the coax:</b> Solder or screw the inner core of your 50Ω coax cable to one driven half, and the outer shield braid to the other half.</li>
            <li><b>Track:</b> Plug into an RTL-SDR USB dongle on your laptop, look at AstraView's Azimuth &amp; Elevation, and aim the antenna at the satellite!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
