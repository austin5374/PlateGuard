import { Car, Plus } from 'lucide-react'

export default function ParkingDiagram({ leftCar, rightCar, onScanLeft, onScanRight }) {
  return (
    <div className="border border-cyber-border rounded-lg bg-cyber-surface/50 p-4">
      <div className="text-xs font-display tracking-widest text-cyber-muted text-center mb-3">
        PARKING LAYOUT
      </div>
      <div className="flex items-center justify-center gap-2">
        {/* Left car */}
        <CarSlot side="LEFT" car={leftCar} onScan={onScanLeft} color="cyan" />

        {/* Divider */}
        <div className="flex flex-col items-center mx-1">
          <div className="w-px h-20 bg-cyber-border" />
        </div>

        {/* Your car */}
        <div className="flex flex-col items-center gap-1 px-3">
          <div className="relative">
            <Car size={32} className="text-cyber-cyan" style={{ filter: 'drop-shadow(0 0 6px #00e5ff)' }} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyber-cyan rounded-full animate-pulse" />
          </div>
          <span className="text-[10px] font-display tracking-widest text-cyber-cyan">YOU</span>
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center mx-1">
          <div className="w-px h-20 bg-cyber-border" />
        </div>

        {/* Right car */}
        <CarSlot side="RIGHT" car={rightCar} onScan={onScanRight} color="green" />
      </div>
    </div>
  )
}

function CarSlot({ side, car, onScan, color }) {
  const hasData = car && (car.plate || car.photo)
  const colorMap = {
    cyan: {
      text: 'text-cyber-cyan',
      border: 'border-cyber-cyan/40 bg-cyber-cyan/5',
      plateBorder: 'border-cyber-cyan/30',
      plateText: 'text-cyber-cyan',
      dot: 'bg-cyber-cyan',
      glow: 'drop-shadow(0 0 4px #00e5ff)'
    },
    green: {
      text: 'text-cyber-green',
      border: 'border-cyber-green/40 bg-cyber-green/5',
      plateBorder: 'border-cyber-green/30',
      plateText: 'text-cyber-green',
      dot: 'bg-cyber-green',
      glow: 'drop-shadow(0 0 4px #00ff88)'
    }
  }
  const c = colorMap[color]

  return (
    <div className="flex flex-col items-center gap-1 min-w-[72px]">
      <button
        onClick={onScan}
        disabled={!onScan}
        className={`relative rounded border p-2 transition-all duration-200 ${
          hasData
            ? c.border
            : 'border-cyber-border bg-cyber-surface/30 hover:border-cyber-green/30 hover:bg-cyber-green/5'
        } ${onScan ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <Car
          size={28}
          className={hasData ? c.text : 'text-cyber-muted'}
          style={hasData ? { filter: c.glow } : undefined}
        />
        {hasData && (
          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
        )}
        {!hasData && onScan && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyber-surface border border-cyber-muted flex items-center justify-center">
            <Plus size={8} className="text-cyber-muted" />
          </div>
        )}
      </button>

      <span className={`text-[9px] font-display tracking-widest ${hasData ? c.text : 'text-cyber-muted'}`}>
        {side}
      </span>

      {hasData && car.plate ? (
        <div className={`bg-black border ${c.plateBorder} rounded px-1 py-0.5 text-center max-w-[70px]`}>
          <div className={`text-[9px] font-mono font-bold ${c.plateText} leading-tight truncate`}>
            {car.plate}
          </div>
          {car.state && (
            <div className="text-[7px] font-mono text-cyber-muted leading-tight">
              {car.state}
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={onScan}
          className={`text-[9px] font-mono text-cyber-muted opacity-50 ${onScan ? 'cursor-pointer hover:opacity-100 hover:text-cyber-green transition-opacity' : ''}`}
        >
          {onScan ? 'TAP SCAN' : 'NO DATA'}
        </div>
      )}
    </div>
  )
}
