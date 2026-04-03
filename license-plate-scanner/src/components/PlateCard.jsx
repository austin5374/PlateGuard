import { useState } from 'react'
import { ChevronDown, ChevronUp, Car } from 'lucide-react'

export default function PlateCard({ side, car }) {
  const [expanded, setExpanded] = useState(false)
  const hasData = car && (car.plate || car.photo)
  const sideLabel = side.toUpperCase()

  const sideColor = side === 'left' ? 'text-cyber-cyan' : 'text-cyber-green'
  const sideBorder = side === 'left' ? 'border-cyber-cyan/30' : 'border-cyber-green/30'
  const sideBg = side === 'left' ? 'bg-cyber-cyan/5' : 'bg-cyber-green/5'

  if (!hasData) {
    return (
      <div className={`border border-dashed border-cyber-border rounded-lg p-4 text-center opacity-40`}>
        <Car size={24} className="mx-auto mb-2 text-cyber-muted" />
        <div className="text-xs font-mono text-cyber-muted">{sideLabel} — NO SCAN</div>
      </div>
    )
  }

  return (
    <div className={`border rounded-lg ${sideBorder} ${sideBg} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-3">
          <Car size={18} className={sideColor} />
          <div>
            <div className={`font-display font-bold text-xs tracking-widest ${sideColor}`}>
              {sideLabel} VEHICLE
            </div>
            {car.plate && (
              <div className="font-mono font-bold text-cyber-text text-lg tracking-widest leading-tight">
                {car.plate}
                {car.state && <span className="text-xs text-cyber-muted ml-2 font-normal">{car.state}</span>}
              </div>
            )}
            {car.notes && (
              <div className="text-xs font-mono text-cyber-muted truncate max-w-[180px]">{car.notes}</div>
            )}
          </div>
        </div>
        {car.photo && (
          expanded
            ? <ChevronUp size={16} className="text-cyber-muted" />
            : <ChevronDown size={16} className="text-cyber-muted" />
        )}
      </button>

      {/* Expanded photo */}
      {expanded && car.photo && (
        <div className="border-t border-cyber-border">
          <img
            src={car.photo}
            alt={`${sideLabel} vehicle plate`}
            className="w-full object-contain max-h-48"
          />
        </div>
      )}
    </div>
  )
}
