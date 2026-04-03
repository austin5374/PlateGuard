import { useState, useEffect, useCallback } from 'react'
import { Shield, Plus, MapPin, Zap, ScanLine, Database, Activity, Settings } from 'lucide-react'
import { getActiveSessions } from '../utils/storage.js'
import { getStats } from '../utils/stats.js'
import { getPlateRecognizerKey } from '../utils/apikeys.js'
import { haptic } from '../utils/haptics.js'
import CountdownTimer from '../components/CountdownTimer.jsx'
import SettingsModal from '../components/SettingsModal.jsx'

export default function Home({ onNewSession, onViewSession }) {
  const [sessions,      setSessions]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [stats,         setStats]         = useState(() => getStats())
  const [tick,          setTick]          = useState(0)
  const [showSettings,  setShowSettings]  = useState(false)
  const hasApiKey = !!getPlateRecognizerKey()

  const loadSessions = useCallback(async () => {
    try {
      const active = await getActiveSessions()
      setSessions(active)
      setStats(getStats())
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSessions() }, [loadSessions, tick])

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* ── Header ── */}
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
              <p className="text-[10px] text-cyber-muted font-mono tracking-wider">DOOR DING PREVENTION SYSTEM</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-mono">
                <span className="text-cyber-green font-bold">{sessions.length}</span>
                <span className="text-cyber-muted"> ACTIVE</span>
              </div>
            </div>
            <button
              onClick={() => { haptic.light(); setShowSettings(true) }}
              className="relative p-2 rounded-lg neon-btn-cyan text-sm"
              title="Settings"
            >
              <Settings size={16} />
              {!hasApiKey && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyber-yellow rounded-full border border-cyber-bg" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">

        {/* ── API key nudge ── */}
        {!hasApiKey && (
          <button
            onClick={() => { haptic.light(); setShowSettings(true) }}
            className="w-full mb-4 px-4 py-2.5 rounded-lg border border-cyber-yellow/30 bg-cyber-yellow/5
              flex items-center gap-3 text-left hover:bg-cyber-yellow/10 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-cyber-yellow flex-shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-mono text-cyber-yellow tracking-wide">
                Add a free Plate Recognizer API key for accurate OCR + auto state detection
              </p>
            </div>
            <Settings size={13} className="text-cyber-yellow flex-shrink-0" />
          </button>
        )}

        {/* ── Start Session CTA ── */}
        <button
          onClick={() => { haptic.medium(); onNewSession() }}
          className="w-full mb-6 py-5 px-6 rounded-xl neon-btn flex items-center justify-center gap-3 text-lg font-display tracking-widest group"
          style={{
            background:  'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(0,229,255,0.04) 100%)',
            boxShadow:   '0 0 24px rgba(0,255,136,0.12), inset 0 1px 0 rgba(0,255,136,0.1)',
          }}
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          <span>START PARKING SESSION</span>
          <Zap className="w-5 h-5 opacity-60" />
        </button>

        {/* ── Lifetime stats strip ── */}
        {(stats.totalSessions > 0) && (
          <div className="mb-6 rounded-lg bg-cyber-card border border-cyber-border p-3 flex items-center gap-4">
            <Activity size={14} className="text-cyber-cyan flex-shrink-0" />
            <div className="flex items-center gap-5 text-xs font-mono text-cyber-muted flex-1">
              <span>
                <span className="text-cyber-cyan font-bold">{stats.totalSessions}</span> sessions logged
              </span>
              <span>
                <span className="text-cyber-green font-bold">{stats.totalPlatesScanned}</span> plates secured
              </span>
            </div>
            <Database size={12} className="text-cyber-border" />
          </div>
        )}

        {/* ── Sessions list ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-8 h-8 border-2 border-cyber-green border-t-transparent rounded-full animate-spin" />
            <p className="text-cyber-muted font-mono text-sm tracking-widest">LOADING SESSIONS...</p>
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            <h2 className="text-[10px] font-mono text-cyber-muted tracking-widest uppercase border-b border-cyber-border pb-2">
              Active Parking Sessions
            </h2>
            {sessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => { haptic.light(); onViewSession(session.id) }}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-cyber-border py-3 text-center">
        <p className="text-[10px] text-cyber-muted font-mono tracking-wider">
          ALL DATA STORED LOCALLY • AUTO-DELETES IN 3 HOURS • ZERO SERVERS
        </p>
      </footer>
    </div>
  )
}

// ── Session card ────────────────────────────────────────────────────────────
function SessionCard({ session, onClick }) {
  const leftCar      = session.cars?.left
  const rightCar     = session.cars?.right
  const scannedCount = [leftCar, rightCar].filter(Boolean).length

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl p-4 cyber-border bg-cyber-card hover:bg-cyber-surface
        transition-all duration-200 group animate-slide-up"
      style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
    >
      {/* Top row: location + timer */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-cyber-cyan flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-cyber-cyan font-mono truncate max-w-[180px]">
              {session.location?.label
                || (session.location?.address
                    ? session.location.address.split(',').slice(0, 2).join(',')
                    : `${session.location?.lat?.toFixed(4)}, ${session.location?.lng?.toFixed(4)}`)
              }
            </p>
            <p className="text-[10px] text-cyber-muted font-mono mt-0.5">
              {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <CountdownTimer session={session} compact />
      </div>

      {/* Mini plate diagram */}
      <div className="flex items-center gap-2">
        <MiniPlate car={leftCar}  label="L" />
        <div className="flex-1 flex items-center justify-center">
          <div className="px-3 py-1 rounded bg-cyber-surface border border-cyber-green/30
            text-cyber-green font-display text-[10px] tracking-widest">
            YOU
          </div>
        </div>
        <MiniPlate car={rightCar} label="R" />
      </div>

      {/* Progress + caret */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanLine size={11} className="text-cyber-muted" />
          <span className="text-[10px] text-cyber-muted font-mono tracking-wide">
            {scannedCount}/2 PLATES SCANNED
          </span>
        </div>
        <span className="text-[10px] text-cyber-green font-mono tracking-wider group-hover:text-glow-green">
          VIEW →
        </span>
      </div>
    </button>
  )
}

function MiniPlate({ car, label }) {
  if (!car) {
    return (
      <div className="flex-1 h-9 rounded border border-dashed border-cyber-border flex items-center justify-center">
        <span className="text-[10px] text-cyber-muted font-mono">{label}</span>
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

// ── Empty state ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
      <div className="relative w-20 h-20">
        <Shield
          className="w-20 h-20 text-cyber-border animate-breathe"
          style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,136,0.15))' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <ScanLine size={24} className="text-cyber-green opacity-40" />
        </div>
      </div>
      <div>
        <h3 className="font-display text-cyber-green tracking-widest text-glow-green mb-2">
          NO ACTIVE SESSIONS
        </h3>
        <p className="text-cyber-muted font-mono text-xs leading-relaxed max-w-xs">
          Tap the button above when you park to scan<br />
          and record nearby license plates.
        </p>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-cyber-muted font-mono border border-cyber-border rounded-lg px-4 py-2">
        <Shield size={11} className="text-cyber-green" />
        <span>Sessions auto-delete after 3 hours</span>
      </div>
    </div>
  )
}
