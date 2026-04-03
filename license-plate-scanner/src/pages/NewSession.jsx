import { useState } from 'react'
import { MapPin, Loader2, ArrowLeft, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createSession } from '../utils/storage.js'
import { recordNewSession } from '../utils/stats.js'
import { haptic } from '../utils/haptics.js'

// GPS requires HTTPS on mobile browsers (except localhost).
// We detect this so we can give a helpful message instead of silently failing.
function isSecureContext() {
  return window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
}

export default function NewSession({ onBack, onSessionCreated }) {
  const [label,           setLabel]           = useState('')      // user-typed location
  const [gpsStatus,       setGpsStatus]       = useState('idle')  // idle | loading | done | denied | unavailable
  const [gpsCoords,       setGpsCoords]       = useState(null)    // { lat, lng }
  const [gpsAddress,      setGpsAddress]      = useState(null)

  const canStart = label.trim().length > 0

  // ── Try to get GPS coords (optional enhancement) ──────────────────────────
  const getGPS = async () => {
    if (!isSecureContext()) {
      setGpsStatus('unavailable')
      return
    }
    if (!navigator.geolocation) {
      setGpsStatus('unavailable')
      return
    }

    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setGpsCoords({ lat, lng })

        // Try reverse geocode for a human-readable address
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { 'Accept-Language': 'en' } }
          )
          if (resp.ok) {
            const data = await resp.json()
            setGpsAddress(data.display_name || null)
          }
        } catch {}

        setGpsStatus('done')
      },
      (err) => {
        setGpsStatus(err.code === 1 ? 'denied' : 'unavailable')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  // ── Start session ──────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!canStart) return
    haptic.medium()
    try {
      const loc = {
        lat:     gpsCoords?.lat   ?? 0,
        lng:     gpsCoords?.lng   ?? 0,
        address: gpsAddress ?? label.trim(),
        label:   label.trim(),
      }
      const sessionId = await createSession(loc)
      recordNewSession()
      onSessionCreated(sessionId)
    } catch (err) {
      console.error('Failed to create session:', err)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-cyber-border bg-cyber-surface/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => { haptic.light(); onBack() }} className="p-2 rounded-lg neon-btn-cyan text-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-base font-bold text-cyber-green tracking-widest text-glow-green">
              NEW PARKING SESSION
            </h1>
            <p className="text-xs text-cyber-muted font-mono">SET LOCATION</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        {/* ── Where are you parked? ── */}
        <div className="rounded-lg p-5 bg-cyber-card cyber-border space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyber-cyan" />
            <h2 className="font-display text-cyber-cyan text-sm tracking-widest">WHERE ARE YOU PARKED?</h2>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-cyber-muted mb-2 tracking-widest">
              LOCATION LABEL <span className="text-cyber-red">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder='e.g. "Target", "Work - Garage B", "Whole Foods Row 4"'
              className="w-full bg-black border border-cyber-cyan/40 rounded px-3 py-3
                font-mono text-cyber-text text-sm focus:outline-none focus:border-cyber-cyan
                focus:ring-1 focus:ring-cyber-cyan/30 placeholder-cyber-muted/40"
              autoFocus
            />
            <p className="text-[10px] text-cyber-muted font-mono mt-1.5">
              Type anywhere you'll remember — store name, level, row, etc.
            </p>
          </div>

          {/* ── Optional GPS enhancement ── */}
          <div className="border-t border-cyber-border pt-4">
            <p className="text-[10px] font-mono text-cyber-muted tracking-widest mb-3">
              OPTIONAL — ADD GPS COORDINATES
            </p>

            {gpsStatus === 'idle' && (
              <button
                onClick={getGPS}
                className="flex items-center gap-2 neon-btn-cyan text-xs px-4 py-2 rounded"
              >
                <Navigation className="w-3.5 h-3.5" />
                USE MY CURRENT LOCATION
              </button>
            )}

            {gpsStatus === 'loading' && (
              <div className="flex items-center gap-2 text-cyber-cyan text-xs font-mono">
                <Loader2 className="w-4 h-4 animate-spin" />
                ACQUIRING GPS...
              </div>
            )}

            {gpsStatus === 'done' && gpsCoords && (
              <div className="flex items-start gap-2 p-2 rounded bg-cyber-green/5 border border-cyber-green/20">
                <CheckCircle2 className="w-4 h-4 text-cyber-green flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-cyber-green font-mono tracking-wider">GPS COORDINATES ADDED</p>
                  <p className="text-[10px] text-cyber-muted font-mono mt-0.5">
                    {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
                  </p>
                </div>
              </div>
            )}

            {gpsStatus === 'denied' && (
              <div className="flex items-start gap-2 p-2 rounded bg-red-950/20 border border-cyber-red/20">
                <AlertCircle className="w-4 h-4 text-cyber-red flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-cyber-red font-mono leading-relaxed">
                  Location permission denied. Your text label above is all you need.
                </p>
              </div>
            )}

            {gpsStatus === 'unavailable' && (
              <div className="flex items-start gap-2 p-2 rounded border border-cyber-border">
                <AlertCircle className="w-4 h-4 text-cyber-muted flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-cyber-muted font-mono leading-relaxed">
                  GPS requires HTTPS — not available over local network.
                  Your text label above is all you need.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Instructions ── */}
        <div className="rounded-lg p-4 bg-cyber-card cyber-border">
          <h2 className="font-display text-cyber-cyan text-xs tracking-widest mb-2">HOW IT WORKS</h2>
          <ol className="text-xs text-cyber-muted font-mono space-y-1.5 list-decimal list-inside">
            <li>Name where you parked above</li>
            <li>Scan the license plates of cars on your left and right</li>
            <li>Walk away — your data is stored privately on this device</li>
            <li>Session auto-deletes after 3 hours</li>
          </ol>
        </div>

        {/* ── Start button ── */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full py-5 px-6 rounded-xl neon-btn font-display text-xl tracking-widest
            flex items-center justify-center gap-3
            disabled:opacity-30 disabled:cursor-not-allowed"
          style={canStart ? {
            background:  'linear-gradient(135deg, rgba(0,255,136,0.12) 0%, rgba(0,229,255,0.06) 100%)',
            boxShadow:   '0 0 30px rgba(0,255,136,0.2)',
          } : undefined}
        >
          <span>INITIATE SESSION</span>
          <span className="text-cyber-cyan">→</span>
        </button>

        {!canStart && (
          <p className="text-center text-xs text-cyber-muted font-mono">
            Enter a location name above to continue
          </p>
        )}

      </main>
    </div>
  )
}
