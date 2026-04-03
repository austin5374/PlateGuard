import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, MapPin, Clock, Trash2, AlertTriangle } from 'lucide-react'
import { getSession, deleteSession, updateCarData } from '../utils/storage.js'
import CameraCapture from './CameraCapture.jsx'
import ParkingDiagram from './ParkingDiagram.jsx'
import PlateCard from './PlateCard.jsx'
import CountdownTimer from './CountdownTimer.jsx'

export default function SessionDetail({ sessionId, onBack }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeCapture, setActiveCapture] = useState(null) // 'left' | 'right' | null
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showFlash, setShowFlash] = useState(false)

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

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const handleCarSaved = async (side, carData) => {
    try {
      const updated = await updateCarData(sessionId, side, carData)
      setSession(updated)
      setActiveCapture(null)
      // Trigger flash animation
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 800)
    } catch (err) {
      console.error('Failed to save car data:', err)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteSession(sessionId)
      onBack()
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }

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
        <div className="text-center">
          <p className="text-cyber-red font-mono mb-4">SESSION NOT FOUND OR EXPIRED</p>
          <button onClick={onBack} className="neon-btn px-4 py-2 text-sm rounded">GO BACK</button>
        </div>
      </div>
    )
  }

  if (activeCapture) {
    return (
      <CameraCapture
        side={activeCapture}
        existingData={session.cars?.[activeCapture]}
        onSave={(carData) => handleCarSaved(activeCapture, carData)}
        onCancel={() => setActiveCapture(null)}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Flash overlay */}
      {showFlash && <div className="flash-overlay" />}

      {/* Header */}
      <header className="border-b border-cyber-border bg-cyber-surface/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-lg neon-btn-cyan text-sm">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-base font-bold text-cyber-green tracking-widest text-glow-green">
                SESSION ACTIVE
              </h1>
              <p className="text-xs text-cyber-muted font-mono">
                {new Date(session.createdAt).toLocaleString([], {
                  month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <CountdownTimer session={session} />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">

        {/* Location */}
        <div className="rounded-lg p-4 bg-cyber-card cyber-border">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-cyber-cyan flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-cyber-muted font-mono mb-0.5">PARKING LOCATION</p>
              {session.location?.address ? (
                <p className="text-sm text-cyber-cyan font-mono leading-relaxed">{session.location.address}</p>
              ) : null}
              <p className="text-xs text-cyber-muted font-mono mt-0.5">
                {session.location?.lat?.toFixed(6)}, {session.location?.lng?.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        {/* Parking Diagram */}
        <ParkingDiagram
          leftCar={session.cars?.left}
          rightCar={session.cars?.right}
          onScanLeft={() => setActiveCapture('left')}
          onScanRight={() => setActiveCapture('right')}
        />

        {/* Left Car */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-cyber-cyan rounded-full" />
            <h2 className="font-display text-cyber-cyan text-sm tracking-widest">LEFT VEHICLE</h2>
          </div>
          {session.cars?.left ? (
            <PlateCard car={session.cars.left} side="left" onEdit={() => setActiveCapture('left')} />
          ) : (
            <EmptyCarSlot side="left" onScan={() => setActiveCapture('left')} />
          )}
        </div>

        {/* Right Car */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-cyber-green rounded-full" />
            <h2 className="font-display text-cyber-green text-sm tracking-widest">RIGHT VEHICLE</h2>
          </div>
          {session.cars?.right ? (
            <PlateCard car={session.cars.right} side="right" onEdit={() => setActiveCapture('right')} />
          ) : (
            <EmptyCarSlot side="right" onScan={() => setActiveCapture('right')} />
          )}
        </div>

        {/* Delete session */}
        <div className="pt-4 border-t border-cyber-border">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-xs text-cyber-muted font-mono hover:text-cyber-red transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              DELETE SESSION
            </button>
          ) : (
            <div className="p-4 rounded-lg border border-cyber-red/40 bg-red-950/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-cyber-red" />
                <p className="text-sm text-cyber-red font-mono">CONFIRM DELETE?</p>
              </div>
              <p className="text-xs text-cyber-muted font-mono mb-4">
                This will permanently delete this session and all associated data.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 rounded border border-cyber-red text-cyber-red font-mono text-sm hover:bg-red-950/30 transition-colors"
                >
                  DELETE
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
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
      className="w-full rounded-lg border border-dashed border-cyber-border hover:border-cyber-green/50 bg-cyber-card/50 hover:bg-cyber-card p-6 flex flex-col items-center gap-3 transition-all duration-200 group"
    >
      <div className="w-16 h-10 border border-dashed border-cyber-muted rounded group-hover:border-cyber-green transition-colors" />
      <div className="text-center">
        <p className="text-xs text-cyber-muted font-mono tracking-wider group-hover:text-cyber-green transition-colors">
          TAP TO SCAN {side.toUpperCase()} PLATE
        </p>
        <p className="text-xs text-cyber-muted/50 font-mono mt-1">Photo + OCR</p>
      </div>
    </button>
  )
}
