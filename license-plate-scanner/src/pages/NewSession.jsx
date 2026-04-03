import { useState } from 'react'
import { MapPin, Loader2, ArrowLeft, Navigation, AlertCircle } from 'lucide-react'
import { createSession } from '../utils/storage.js'

export default function NewSession({ onBack, onSessionCreated }) {
  const [gettingLocation, setGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [location, setLocation] = useState(null)
  const [reverseGeoStatus, setReverseGeoStatus] = useState('idle') // idle | loading | done | error

  const getLocation = async () => {
    setGettingLocation(true)
    setLocationError(null)
    setLocation(null)

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      setGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const locObj = { lat, lng, address: null }
        setLocation(locObj)

        // Try reverse geocode
        setReverseGeoStatus('loading')
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { 'Accept-Language': 'en' } }
          )
          if (resp.ok) {
            const data = await resp.json()
            const addr = data.display_name || null
            locObj.address = addr
            setLocation({ ...locObj, address: addr })
            setReverseGeoStatus('done')
          } else {
            setReverseGeoStatus('error')
          }
        } catch {
          setReverseGeoStatus('error')
        }

        setGettingLocation(false)
      },
      (err) => {
        let msg = 'Could not get your location.'
        if (err.code === 1) msg = 'Location permission denied. Please allow location access.'
        else if (err.code === 2) msg = 'Position unavailable. Try again.'
        else if (err.code === 3) msg = 'Location request timed out. Try again.'
        setLocationError(msg)
        setGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const handleStart = async () => {
    try {
      const loc = location || { lat: 0, lng: 0, address: 'Unknown location' }
      const sessionId = await createSession(loc)
      onSessionCreated(sessionId)
    } catch (err) {
      console.error('Failed to create session:', err)
    }
  }

  const canStart = !gettingLocation

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-cyber-border bg-cyber-surface/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg neon-btn-cyan text-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-base font-bold text-cyber-green tracking-widest text-glow-green">
              NEW PARKING SESSION
            </h1>
            <p className="text-xs text-cyber-muted font-mono">CAPTURE LOCATION</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        {/* Instructions */}
        <div className="rounded-lg p-4 bg-cyber-card cyber-border">
          <h2 className="font-display text-cyber-cyan text-sm tracking-widest mb-2">INSTRUCTIONS</h2>
          <ol className="text-xs text-cyber-muted font-mono space-y-1.5 list-decimal list-inside">
            <li>Get your current GPS location (optional but recommended)</li>
            <li>Start session — you'll scan plates next</li>
            <li>Photograph left and right neighboring cars</li>
            <li>Session auto-deletes in exactly 3 hours</li>
          </ol>
        </div>

        {/* Location section */}
        <div className="rounded-lg p-5 bg-cyber-card cyber-border">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-cyber-cyan" />
            <h2 className="font-display text-cyber-cyan text-sm tracking-widest">GPS LOCATION</h2>
          </div>

          {!location && !gettingLocation && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-cyber-muted font-mono">
                Your parking location helps identify where you parked.
                Location data is stored locally only.
              </p>
              <button
                onClick={getLocation}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded neon-btn-cyan text-sm"
              >
                <Navigation className="w-4 h-4" />
                GET CURRENT LOCATION
              </button>
            </div>
          )}

          {gettingLocation && (
            <div className="flex items-center gap-3 py-3">
              <Loader2 className="w-5 h-5 text-cyber-green animate-spin" />
              <div>
                <p className="text-sm text-cyber-green font-mono">ACQUIRING GPS SIGNAL...</p>
                {reverseGeoStatus === 'loading' && (
                  <p className="text-xs text-cyber-muted font-mono mt-1">Reverse geocoding address...</p>
                )}
              </div>
            </div>
          )}

          {locationError && (
            <div className="flex items-start gap-2 p-3 rounded bg-red-950/30 border border-cyber-red/30 mt-2">
              <AlertCircle className="w-4 h-4 text-cyber-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-cyber-red font-mono">{locationError}</p>
                <button
                  onClick={getLocation}
                  className="text-xs text-cyber-cyan font-mono mt-1 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {location && (
            <div className="space-y-2">
              <div className="p-3 rounded bg-cyber-surface border border-cyber-green/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse" />
                  <span className="text-xs text-cyber-green font-mono tracking-wider">LOCATION ACQUIRED</span>
                </div>
                <p className="text-xs text-cyber-text font-mono">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
                {location.address && (
                  <p className="text-xs text-cyber-cyan font-mono mt-1 leading-relaxed">
                    {location.address}
                  </p>
                )}
                {reverseGeoStatus === 'loading' && (
                  <p className="text-xs text-cyber-muted font-mono mt-1 animate-breathe">
                    Fetching address...
                  </p>
                )}
              </div>
              <button
                onClick={getLocation}
                className="text-xs text-cyber-muted font-mono underline"
              >
                Refresh location
              </button>
            </div>
          )}
        </div>

        {/* No location skip */}
        {!location && !gettingLocation && (
          <p className="text-xs text-cyber-muted font-mono text-center">
            Or{' '}
            <button
              onClick={handleStart}
              className="text-cyber-cyan underline"
            >
              skip location and start anyway
            </button>
          </p>
        )}

        {/* Start button */}
        {location && (
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full py-5 px-6 rounded-lg neon-btn font-display text-xl tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: canStart
                ? 'linear-gradient(135deg, rgba(0,255,136,0.12) 0%, rgba(0,229,255,0.06) 100%)'
                : undefined,
              boxShadow: canStart ? '0 0 30px rgba(0,255,136,0.2)' : undefined
            }}
          >
            {gettingLocation ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span>INITIATE SESSION</span>
                <span className="text-cyber-cyan">→</span>
              </>
            )}
          </button>
        )}
      </main>
    </div>
  )
}
