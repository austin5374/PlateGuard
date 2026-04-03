/**
 * Renders a realistic US license plate mockup.
 * Sizes: 'sm' (128×64), 'md' (192×96), 'lg' (256×128)
 */
export default function PlateDisplay({ plate, state, size = 'md', glowing = false }) {
  const cfg = {
    sm:  { w: 128, h: 64,  plateText: 'text-lg',   stateText: 'text-[8px]',  bolt: 6  },
    md:  { w: 192, h: 96,  plateText: 'text-2xl',  stateText: 'text-[10px]', bolt: 8  },
    lg:  { w: 256, h: 128, plateText: 'text-4xl',  stateText: 'text-xs',     bolt: 10 },
  }
  const c = cfg[size] || cfg.md

  return (
    <div
      className="relative flex-shrink-0 select-none overflow-hidden rounded-md"
      style={{
        width:  c.w,
        height: c.h,
        background: 'linear-gradient(160deg, #f9f9f4 0%, #e8e8e0 100%)',
        border: '3px solid #b8a850',
        boxShadow: glowing
          ? '0 0 24px rgba(0,255,136,0.5), 0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.7)'
          : '0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
    >
      {/* State banner — top 28% */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center"
        style={{
          height: '30%',
          background: 'linear-gradient(180deg, #1a3a6e 0%, #0f2a5a 100%)',
        }}
      >
        {/* Stars */}
        <span className="absolute left-2 text-yellow-300 opacity-60" style={{ fontSize: c.bolt * 1.2 }}>★</span>
        <span className={`text-white font-black tracking-[0.3em] uppercase ${c.stateText}`}
          style={{ fontFamily: '"Arial Black", Arial, sans-serif' }}>
          {state || '\u00b7 \u00b7 \u00b7'}
        </span>
        <span className="absolute right-2 text-yellow-300 opacity-60" style={{ fontSize: c.bolt * 1.2 }}>★</span>
      </div>

      {/* Plate number — fills remaining height */}
      <div
        className="absolute left-0 right-0 bottom-0 flex items-center justify-center"
        style={{ top: '30%' }}
      >
        <span
          className={`font-black tracking-[0.18em] uppercase text-gray-900 ${c.plateText}`}
          style={{ fontFamily: '"Arial Black", Arial, sans-serif' }}
        >
          {plate || '???'}
        </span>
      </div>

      {/* Bolt holes */}
      <div
        className="absolute rounded-full border border-gray-400 bg-gray-300"
        style={{
          width: c.bolt,
          height: c.bolt,
          left: c.bolt,
          top: '50%',
          transform: 'translateY(-50%)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
        }}
      />
      <div
        className="absolute rounded-full border border-gray-400 bg-gray-300"
        style={{
          width: c.bolt,
          height: c.bolt,
          right: c.bolt,
          top: '50%',
          transform: 'translateY(-50%)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
        }}
      />

      {/* Reflective sheen overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 45%, rgba(0,0,0,0.06) 100%)',
        }}
      />
    </div>
  )
}
