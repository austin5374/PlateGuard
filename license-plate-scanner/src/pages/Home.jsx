import { useState, useEffect, useCallback } from 'react'
import { Shield, Plus, MapPin, Clock, Zap } from 'lucide-react'
import { getActiveSessions } from '../utils/storage.js'
import PlateCard from '../components/PlateCard.jsx'
import CountdownTimer from '../components/CountdownTimer.jsx'

export default function Home({ onNewSession, onViewSession }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const loadSessions = useCallback(async () => {
    try {
      const active = await getActiveSessions()
      setSessions(active)
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions, tick])

  // Refresh list every 30 seconds (expired ones get purged by App.jsx)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-cyber-border bg-cyber-surface/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="w-8 h-8 text-cyber-green" style={{ filter: 'drop-shadow(0 0 8px #00ff88)' }} />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-cyber-green rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-cyber-green tracking-widest text-glow-green">
                PLATEGUARD
              </h1>
              <p className="text-xs text-cyber-muted font-mono tracking-wider">DOOR DING PREVENTION SYSTEM</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-cyber-muted font-mono">
              <span className="text-cyber-green">{sessions.length}</span> ACTIVE
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">

        {/* New Session Button */}
        <button
          onClick={onNewSession}
          className="w-full mb-8 py-5 px-6 rounded-lg neon-btn flex items-center justify-center gap-3 text-lg font-display tracking-widest group"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(0,229,255,0.04) 100%)',
            boxShadow: '0 0 20px rgba(0,255,136,0.15), inset 0 1px 0 rgba(0,255,136,0.1)'
          }}
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          <span>START PARKING SESSION</span>
          <Zap className="w-5 h-5 opacity-60" />
        </button>

        {/* Sessions list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-10 h-10 border-2 border-cyber-green border-t-transparent rounded-full animate-spin" />
            <p className="text-cyber-muted font-mono text-sm tracking-widest">LOADING SESSIONS...</p>
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            <h2 className="text-xs font-mono text-cyber-muted tracking-widest uppercase border-b border-cyber-border pb-2">
              Active Parking Sessions
            </h2>
            {sessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => onViewSession(session.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-cyber-border py-3 text-center">
        <p className="text-xs text-cyber-muted font-mono tracking-wider">
          ALL DATA STORED LOCALLY • AUTO-DELETES IN 3 HOURS • NO SERVERS
        </p>
      </footer>
    </div>
  )
}

function SessionCard({ session, onClick }) {
  const leftCar = session.cars?.left
  const rightCar = session.cars?.right
  const scannedCount = [leftCar, rightCar].filter(Boolean).length

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg p-4 cyber-border bg-cyber-card hover:bg-cyber-surface transition-all duration-200 group"
      style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyber-cyan flex-shrink-0" />
          <div>
            <p className="text-xs text-cyber-cyan font-mono truncate max-w-[200px]">
              {session.location?.address || `${session.location?.lat?.toFixed(5)}, ${session.location?.lng?.toFixed(5)}`}
            </p>
            <p className="text-xs text-cyber-muted font-mono mt-0.5">
              {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <CountdownTimer session={session} compact />
      </div>

      {/* Mini plate display */}
      <div className="flex items-center gap-2 mt-3">
        <MiniPlate car={leftCar} side="L" />
        <div className="flex-1 flex items-center justify-center">
          <div className="px-3 py-1 rounded bg-cyber-surface border border-cyber-green/30 text-cyber-green font-display text-xs tracking-widest">
            YOU
          </div>
        </div>
        <MiniPlate car={rightCar} side="R" />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-cyber-muted font-mono">
          {scannedCount}/2 PLATES SCANNED
        </span>
        <span className="text-xs text-cyber-green font-mono tracking-wider group-hover:text-glow-green">
          VIEW DETAILS →
        </span>
      </div>
    </button>
  )
}

function MiniPlate({ car, side }) {
  if (!car) {
    return (
      <div className="flex-1 h-9 rounded border border-dashed border-cyber-border flex items-center justify-center">
        <span className="text-xs text-cyber-muted font-mono">{side}</span>
      </div>
    )
  }

  return (
    <div className="flex-1 h-9 rounded border border-cyber-cyan/40 bg-white/5 flex items-center justify-center">
      <span className="text-xs font-display text-cyber-cyan tracking-widest truncate px-1">
        {car.plate || '???'}
      </span>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
      <div className="relative w-24 h-24">
        <Shield
          className="w-24 h-24 text-cyber-border animate-breathe"
          style={{ filter: 'drop-shadow(0 0 12px rgba(0,255,136,0.2))' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-cyber-green text-xl font-bold">?</span>
        </div>
      </div>
      <div>
        <h3 className="font-display text-cyber-green tracking-widest text-glow-green mb-2">
          NO ACTIVE SESSIONS
        </h3>
        <p className="text-cyber-muted font-mono text-sm leading-relaxed max-w-xs">
          Start a parking session to scan and record license plates of cars near yours.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-cyber-muted font-mono">
        <Clock className="w-4 h-4" />
        <span>Sessions auto-delete after 3 hours</span>
      </div>
    </div>
  )
}
