import { useState } from 'react'
import { ChevronDown, ChevronUp, Edit3, Copy, CheckCheck, Car, Clock } from 'lucide-react'
import PlateDisplay from './PlateDisplay.jsx'

export default function PlateCard({ side, car, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const [copied,   setCopied]   = useState(false)

  if (!car || (!car.plate && !car.photo)) {
    return (
      <div className="border border-dashed border-cyber-border rounded-lg p-4 text-center opacity-40">
        <Car size={24} className="mx-auto mb-2 text-cyber-muted" />
        <div className="text-xs font-mono text-cyber-muted">{side.toUpperCase()} — NO SCAN</div>
      </div>
    )
  }

  const isLeft      = side === 'left'
  const accentColor = isLeft ? 'text-cyber-cyan' : 'text-cyber-green'
  const borderColor = isLeft ? 'border-cyber-cyan/30' : 'border-cyber-green/30'
  const bgColor     = isLeft ? 'bg-cyber-cyan/5'      : 'bg-cyber-green/5'

  const capturedAt = car.capturedAt
    ? new Date(car.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  const handleCopy = async () => {
    const lines = [
      `Side: ${side.toUpperCase()}`,
      car.plate  ? `Plate: ${car.plate}`       : null,
      car.state  ? `State: ${car.state}`        : null,
      car.notes  ? `Notes: ${car.notes}`        : null,
      capturedAt ? `Captured: ${capturedAt}`    : null,
    ].filter(Boolean)

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className={`border rounded-lg ${borderColor} ${bgColor} overflow-hidden animate-slide-up`}>
      {/* ── Header row ── */}
      <div className="flex items-center gap-3 p-3">
        {/* Plate mockup */}
        <PlateDisplay plate={car.plate} state={car.state} size="sm" glowing />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className={`font-display font-bold text-xs tracking-widest ${accentColor} mb-0.5`}>
            {side.toUpperCase()} VEHICLE
          </div>
          {car.notes && (
            <p className="text-xs font-mono text-cyber-muted truncate">{car.notes}</p>
          )}
          {capturedAt && (
            <div className="flex items-center gap-1 mt-1">
              <Clock size={10} className="text-cyber-muted" />
              <span className="text-[10px] font-mono text-cyber-muted">{capturedAt}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Copy */}
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded transition-colors ${copied ? accentColor : 'text-cyber-muted hover:text-cyber-cyan'}`}
            title="Copy plate info"
          >
            {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
          </button>

          {/* Edit */}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded text-cyber-muted hover:text-cyber-cyan transition-colors"
              title="Re-scan / edit"
            >
              <Edit3 size={14} />
            </button>
          )}

          {/* Expand photo */}
          {car.photo && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1.5 rounded text-cyber-muted hover:text-cyber-cyan transition-colors"
              title={expanded ? 'Hide photo' : 'Show photo'}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded photo ── */}
      {expanded && car.photo && (
        <div className="border-t border-cyber-border">
          <img
            src={car.photo}
            alt={`${side} vehicle plate`}
            className="w-full object-contain max-h-56"
            style={{ background: '#000' }}
          />
          <div className="px-3 py-1.5 flex items-center gap-1 bg-black/40">
            <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
            <span className="text-[9px] font-mono text-cyber-muted tracking-widest">ORIGINAL CAPTURE</span>
          </div>
        </div>
      )}
    </div>
  )
}
