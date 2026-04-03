import { useState, useEffect } from 'react'
import { getRemainingMs, getThreatLevel, formatDuration } from '../utils/storage.js'

const threatClasses = {
  green: 'threat-green',
  yellow: 'threat-yellow',
  orange: 'threat-orange',
  red: 'threat-red',
}

const threatBg = {
  green: 'border-cyber-green/30 bg-cyber-green/5',
  yellow: 'border-cyber-yellow/30 bg-cyber-yellow/5',
  orange: 'border-cyber-orange/30 bg-cyber-orange/5',
  red: 'border-cyber-red/30 bg-cyber-red/5',
}

const threatLabels = {
  green: 'SECURE',
  yellow: 'CAUTION',
  orange: 'WARNING',
  red: 'CRITICAL',
}

export default function CountdownTimer({ session, compact = false }) {
  const [remaining, setRemaining] = useState(() => getRemainingMs(session))
  const [threat, setThreat] = useState(() => getThreatLevel(session))

  useEffect(() => {
    const tick = () => {
      const ms = getRemainingMs(session)
      setRemaining(ms)
      setThreat(getThreatLevel(session))
    }
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session])

  const textClass = threatClasses[threat]
  const bgClass = threatBg[threat]
  const label = threatLabels[threat]

  if (compact) {
    return (
      <span className={`font-mono font-bold text-sm ${textClass}`}>
        {formatDuration(remaining)}
      </span>
    )
  }

  return (
    <div className={`border rounded-lg p-3 ${bgClass} text-center`}>
      <div className={`text-xs font-display tracking-widest mb-1 opacity-70 ${textClass}`}>
        {label} — DELETES IN
      </div>
      <div className={`font-display font-bold text-2xl tracking-wider ${textClass}`}>
        {formatDuration(remaining)}
      </div>
      <div className="w-full h-1 mt-2 rounded-full bg-black/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${(remaining / (3 * 60 * 60 * 1000)) * 100}%`,
            background: threat === 'green'
              ? '#00ff88'
              : threat === 'yellow'
              ? '#ffee00'
              : threat === 'orange'
              ? '#ff6600'
              : '#ff003c',
            boxShadow: `0 0 8px currentColor`,
          }}
        />
      </div>
    </div>
  )
}
