import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, MapPin, Trash2, AlertTriangle,
  Bell, BellOff, Navigation, Map,
} from 'lucide-react'
import { getSession, deleteSession, updateCarData } from '../utils/storage.js'
import {
  getNotificationPermission,
  requestNotificationPermission,
  scheduleSessionNotifications,
  isNotificationsSupported,
} from '../utils/notifications.js'
import { recordPlateScan } from '../utils/stats.js'
import { haptic } from '../utils/haptics.js'
import CameraCapture from './CameraCapture.jsx'
import ParkingDiagram from './ParkingDiagram.jsx'
import PlateCard from './PlateCard.jsx'
import CountdownTimer from './CountdownTimer.jsx'

export default function SessionDetail({ sessionId, onBack }) {
  const [session,           setSession]           = useState(null)
  const [loading,           setLoading]           = useState(true)
  const [activeCapture,     setActiveCapture]     = useState(null) // 'left' | 'right' | null
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showFlash,         setShowFlash]         = useState(false)
  const [notifPerm,         setNotifPerm]         = useState(() => getNotificationPermission())

  const loadSession = useCallback(async () => {
    try {
      const s = await getSession(sessionId)
      setSession(s)
    } catch (err) {
      console.error('Failed to load session:', err)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => { loadSession() }, [loadSession])

  // Schedule notifications when session first loads
  useEffect(() => {
    if (session && notifPerm === 'granted') {
      scheduleSessionNotifications(session)
    }
  }, [session, notifPerm])

  const handleRequestNotifications = async () => {
    haptic.light()
    const granted = await requestNotificationPermission()
    const perm    = getNotificationPermission()
    setNotifPerm(perm)
    if (granted && session) scheduleSessionNotifications(session)
  }

  const handleCarSaved = async (side, carData) => {
    try {
      const updated = await updateCarData(sessionId, side, carData)
      setSession(updated)
      setActiveCapture(null)
      recordPlateScan()
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 800)
    } catch (err) {
      console.error('Failed to save car data:', err)
    }
  }

  const handleDelete = async () => {
    haptic.heavy()
    try {
      await deleteSession(sessionId)
      onBack()
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }

  const openInMaps = () => {
    if (!session?.location) return
    const { lat, lng } = session.location
    const url = `https://maps.google.com/?q=${lat},${lng}`
    window.open(url, '_blank', 'noopener')
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyber-green border-t-transparent rounded-full animate-spin" />
          <p className="text-cyber-muted font-mono text-sm tracking-widest">LOADING SESSION...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-cyber-red font-mono">SESSION NOT FOUND OR EXPIRED</p>
          <button onClick={onBack} className="neon-btn px-4 py-2 text-sm rounded">GO BACK</button>
        </div>
      </div>
    )
  }

  // ── Camera capture sub-page ────────────────────────────────────────────────
  if (activeCapture) {
    return (
      <CameraCapture
        side={activeCapture}
        existingData={session.cars?.[activeCapture]}
        onSave={(carData) => handleCarSaved(activeCapture, carData)}
        onCancel={() => { haptic.light(); setActiveCapture(null) }}
      />
    )
  }

  const scannedCount = [session.cars?.left, session.cars?.right].filter(Boolean).length
  const allScanned   = scannedCount === 2

  return (
    <div className="min-h-screen flex flex-col">
      {showFlash && <div className="flash-overlay" />}

      {/* ── Header ── */}
      <header className="border-b border-cyber-border bg-cyber-surface/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { haptic.light(); onBack() }} className="p-2 rounded-lg neon-btn-cyan text-sm">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base font-bold text-cyber-green tracking-widest text-glow-green">
                  SESSION ACTIVE
                </h1>
                {allScanned && (
                  <span className="text-[9px] font-mono bg-cyber-green/10 border border-cyber-green/30 text-cyber-green px-2 py-0.5 rounded tracking-widest">
                    COMPLETE
                  </span>
                )}
              </div>
              <p className="text-xs text-cyber-muted font-mono">
                {new Date(session.createdAt).toLocaleString([], {
                  month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <CountdownTimer session={session} />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5">

        {/* ── Notification banner ── */}
        {isNotificationsSupported() && notifPerm === 'default' && (
          <div className="rounded-lg p-3 border border-cyber-cyan/30 bg-cyber-cyan/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-cyber-cyan flex-shrink-0" />
              <p className="text-xs font-mono text-cyber-cyan leading-snug">
                Get alerts 30 min before plates auto-delete
              </p>
            </div>
            <button
              onClick={handleRequestNotifications}
              className="neon-btn-cyan text-xs px-3 py-1.5 rounded flex-shrink-0"
            >
              ENABLE
            </button>
          </div>
        )}
        {isNotificationsSupported() && notifPerm === 'granted' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded border border-cyber-green/20 bg-cyber-green/5">
            <Bell size={12} className="text-cyber-green" />
            <p className="text-[10px] font-mono text-cyber-green tracking-wider">
              ALERTS ENABLED — 30 MIN & 5 MIN WARNINGS SCHEDULED
            </p>
          </div>
        )}

        {/* ── Location ── */}
        <div className="rounded-lg p-4 bg-cyber-card cyber-border">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <MapPin className="w-4 h-4 text-cyber-cyan flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] text-cyber-muted font-mono mb-0.5 tracking-widest">PARKING LOCATION</p>
                {session.location?.label && (
                  <p className="text-sm text-cyber-cyan font-mono font-bold leading-relaxed break-words">
                    {session.location.label}
                  </p>
                )}
                {session.location?.address && session.location.address !== session.location?.label && (
                  <p className="text-xs text-cyber-muted font-mono mt-0.5 leading-relaxed break-words">
                    {session.location.address}
                  </p>
                )}
                {session.location?.lat !== 0 && session.location?.lat && (
                  <p className="text-[10px] text-cyber-muted/60 font-mono mt-0.5">
                    {session.location.lat.toFixed(5)}, {session.location.lng.toFixed(5)}
                  </p>
                )}
              </div>
            </div>
            {session.location?.lat !== 0 && (
              <button
                onClick={openInMaps}
                className="flex-shrink-0 flex items-center gap-1.5 neon-btn-cyan text-xs px-3 py-2 rounded"
              >
                <Map size={12} />
                MAP
              </button>
            )}
          </div>
        </div>

        {/* ── Parking Diagram ── */}
        <ParkingDiagram
          leftCar={session.cars?.left}
          rightCar={session.cars?.right}
          onScanLeft={() => { haptic.light(); setActiveCapture('left') }}
          onScanRight={() => { haptic.light(); setActiveCapture('right') }}
        />

        {/* ── Scan progress indicator ── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-0.5 bg-cyber-border rounded-full overflow-hidden">
            <div
              className="h-full bg-cyber-green rounded-full transition-all duration-500"
              style={{ width: `${(scannedCount / 2) * 100}%`, boxShadow: '0 0 6px #00ff88' }}
            />
          </div>
          <span className="text-xs font-mono text-cyber-muted tracking-wider">
            {scannedCount}/2 SCANNED
          </span>
        </div>

        {/* ── Left car ── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-cyber-cyan rounded-full" />
            <h2 className="font-display text-cyber-cyan text-xs tracking-widest">LEFT VEHICLE</h2>
          </div>
          {session.cars?.left
            ? <PlateCard car={session.cars.left} side="left" onEdit={() => { haptic.light(); setActiveCapture('left') }} />
            : <EmptyCarSlot side="left" onScan={() => { haptic.light(); setActiveCapture('left') }} />
          }
        </div>

        {/* ── Right car ── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-cyber-green rounded-full" />
            <h2 className="font-display text-cyber-green text-xs tracking-widest">RIGHT VEHICLE</h2>
          </div>
          {session.cars?.right
            ? <PlateCard car={session.cars.right} side="right" onEdit={() => { haptic.light(); setActiveCapture('right') }} />
            : <EmptyCarSlot side="right" onScan={() => { haptic.light(); setActiveCapture('right') }} />
          }
        </div>

        {/* ── Delete session ── */}
        <div className="pt-4 border-t border-cyber-border">
          {!showDeleteConfirm ? (
            <button
              onClick={() => { haptic.medium(); setShowDeleteConfirm(true) }}
              className="flex items-center gap-2 text-xs text-cyber-muted font-mono hover:text-cyber-red transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              DELETE SESSION EARLY
            </button>
          ) : (
            <div className="p-4 rounded-lg border border-cyber-red/40 bg-red-950/20 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-cyber-red" />
                <p className="text-sm text-cyber-red font-mono">CONFIRM EARLY DELETE?</p>
              </div>
              <p className="text-xs text-cyber-muted font-mono">
                All plate photos and data will be permanently erased.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 rounded border border-cyber-red text-cyber-red font-mono text-sm hover:bg-red-950/30 transition-colors"
                >
                  DELETE
                </button>
                <button
                  onClick={() => { haptic.light(); setShowDeleteConfirm(false) }}
                  className="flex-1 py-2 rounded neon-btn-cyan text-sm"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}

function EmptyCarSlot({ side, onScan }) {
  return (
    <button
      onClick={onScan}
      className="w-full rounded-lg border border-dashed border-cyber-border hover:border-cyber-green/50
        bg-cyber-card/50 hover:bg-cyber-card p-6 flex flex-col items-center gap-3 transition-all duration-200 group"
    >
      <div className="w-16 h-8 border border-dashed border-cyber-muted rounded group-hover:border-cyber-green transition-colors" />
      <div className="text-center">
        <p className="text-xs text-cyber-muted font-mono tracking-wider group-hover:text-cyber-green transition-colors">
          TAP TO SCAN {side.toUpperCase()} PLATE
        </p>
        <p className="text-[10px] text-cyber-muted/50 font-mono mt-1">Photo + OCR extraction</p>
      </div>
    </button>
  )
}
