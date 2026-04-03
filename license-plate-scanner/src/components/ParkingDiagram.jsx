import { Car } from 'lucide-react'

export default function ParkingDiagram({ leftCar, rightCar }) {
  return (
    <div className="border border-cyber-border rounded-lg bg-cyber-surface/50 p-4">
      <div className="text-xs font-display tracking-widest text-cyber-muted text-center mb-3">
        PARKING LAYOUT
      </div>
      <div className="flex items-center justify-center gap-2">
        {/* Left car */}
        <CarSlot side="LEFT" car={leftCar} />

        {/* Divider */}
        <div className="flex flex-col items-center mx-1">
          <div className="w-px h-16 bg-cyber-border" />
        </div>

        {/* Your car */}
        <div className="flex flex-col items-center gap-1 px-3">
          <div className="relative">
            <Car size={32} className="text-cyber-cyan" style={{ filter: 'drop-shadow(0 0 6px #00e5ff)' }} />
          </div>
          <span className="text-[10px] font-display tracking-widest text-cyber-cyan">YOU</span>
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center mx-1">
          <div className="w-px h-16 bg-cyber-border" />
        </div>

        {/* Right car */}
        <CarSlot side="RIGHT" car={rightCar} />
      </div>
    </div>
  )
}

function CarSlot({ side, car }) {
  const hasData = car && (car.plate || car.photo)

  return (
    <div className="flex flex-col items-center gap-1 min-w-[80px]">
      <div className={`relative rounded border p-2 ${hasData ? 'border-cyber-green/40 bg-cyber-green/5' : 'border-cyber-border bg-cyber-surface/30'}`}>
        <Car
          size={28}
          className={hasData ? 'text-cyber-green' : 'text-cyber-muted'}
          style={hasData ? { filter: 'drop-shadow(0 0 4px #00ff88)' } : undefined}
        />
        {hasData && (
          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
        )}
      </div>
      <span className={`text-[9px] font-display tracking-widest ${hasData ? 'text-cyber-green' : 'text-cyber-muted'}`}>
        {side}
      </span>
      {hasData && car.plate && (
        <div className="bg-black border border-cyber-green/30 rounded px-1 py-0.5 text-center">
          <div className="text-[9px] font-mono font-bold text-cyber-green leading-tight">
            {car.plate}
          </div>
          {car.state && (
            <div className="text-[7px] font-mono text-cyber-muted leading-tight">
              {car.state}
            </div>
          )}
        </div>
      )}
      {!hasData && (
        <div className="text-[9px] font-mono text-cyber-muted opacity-50">NO DATA</div>
      )}
    </div>
  )
}
