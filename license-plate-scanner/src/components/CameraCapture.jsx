import { useRef, useState } from 'react'
import { Camera, Loader2, CheckCircle2, ArrowLeft, RotateCcw, ScanLine } from 'lucide-react'
import { extractPlateText } from '../utils/ocr.js'
import { haptic } from '../utils/haptics.js'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
]

export default function CameraCapture({ side, existingData, onCapture, onSave, onCancel }) {
  const handleSave    = onSave || onCapture
  const fileInputRef  = useRef(null)

  const [phase,       setPhase]       = useState(existingData?.photo ? 'confirm' : 'idle')
  const [photoUrl,    setPhotoUrl]    = useState(existingData?.photo  || null)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrStatus,   setOcrStatus]   = useState('')
  const [plate,       setPlate]       = useState(existingData?.plate  || '')
  const [state,       setState]       = useState(existingData?.state  || '')
  const [notes,       setNotes]       = useState(existingData?.notes  || '')
  const [secured,     setSecured]     = useState(false)
  const [showFlash,   setShowFlash]   = useState(false)

  const isLeft      = side === 'left'
  const accentText  = isLeft ? 'text-cyber-cyan'    : 'text-cyber-green'
  const accentBord  = isLeft ? 'border-cyber-cyan'  : 'border-cyber-green'
  const accentBg    = isLeft ? 'bg-cyber-cyan/5'    : 'bg-cyber-green/5'

  // ── File selected ──────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    haptic.medium()

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      setPhotoUrl(dataUrl)
      setPhase('scanning')
      setOcrProgress(0)
      setOcrStatus('Pre-processing image...')
      haptic.scan()

      const { plate: extracted } = await extractPlateText(dataUrl, (pct, msg) => {
        setOcrProgress(pct)
        setOcrStatus(msg)
      })

      setPlate(extracted || '')
      setPhase('confirm')
      haptic.success()
    }
    reader.readAsDataURL(file)
  }

  // ── Secure plate ───────────────────────────────────────────────────────────
  const handleSecure = () => {
    if (!plate.trim() && !state) return
    haptic.secured()
    setShowFlash(true)
    setSecured(true)
    setTimeout(() => setShowFlash(false), 800)
    setTimeout(() => {
      handleSave({
        photo:  photoUrl,
        plate:  plate.trim().toUpperCase(),
        state,
        notes:  notes.trim(),
      })
    }, 900)
  }

  // ── Retake ─────────────────────────────────────────────────────────────────
  const handleRetake = () => {
    haptic.light()
    setPhase('idle')
    setPhotoUrl(null)
    setPlate('')
    setState('')
    setNotes('')
    setOcrProgress(0)
    setSecured(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen flex flex-col bg-cyber-bg">
      {/* Flash */}
      {showFlash && <div className="flash-overlay" />}

      {/* PLATE SECURED overlay */}
      {secured && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className="plate-secured-overlay text-center px-10 py-7 rounded-xl"
            style={{
              background:  'rgba(0,255,136,0.07)',
              border:      '2px solid #00ff88',
              boxShadow:   '0 0 80px rgba(0,255,136,0.35)',
            }}
          >
            <p className="font-display text-cyber-green text-4xl font-black tracking-widest text-glow-green">
              PLATE SECURED
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <CheckCircle2 className="w-5 h-5 text-cyber-green" />
              <p className="font-mono text-cyber-green text-base tracking-[0.2em]">{plate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-cyber-border bg-cyber-surface/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => { haptic.light(); onCancel() }} className="p-2 rounded-lg neon-btn-cyan text-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`font-display text-base font-bold tracking-widest ${accentText}`}>
              SCAN {side.toUpperCase()} VEHICLE
            </h1>
            <p className="text-xs text-cyber-muted font-mono">PHOTO + OCR EXTRACTION</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">

        {/* ── IDLE: camera trigger ── */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div
              className={`corner-frame relative w-64 h-40 rounded-lg border-2 border-dashed
                ${accentBord} ${accentBg} flex flex-col items-center justify-center gap-3 cursor-pointer
                hover:bg-cyber-surface transition-all duration-200 group`}
              onClick={() => fileInputRef.current?.click()}
            >
              {/* Animated corner brackets */}
              <span className="bracket bracket-tl" />
              <span className="bracket bracket-tr" />
              <span className="bracket bracket-bl" />
              <span className="bracket bracket-br" />

              <Camera size={40} className={`${accentText} opacity-70 group-hover:opacity-100 transition-opacity`} />
              <div className="text-center">
                <p className={`text-sm font-display tracking-widest ${accentText}`}>TAP TO CAPTURE</p>
                <p className="text-xs font-mono text-cyber-muted mt-1">Point camera at license plate</p>
              </div>
            </div>

            <div className="text-xs font-mono text-cyber-muted text-center leading-relaxed max-w-xs">
              For best results, photograph just the license plate<br />
              in good lighting, straight-on.
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* ── SCANNING: OCR in progress ── */}
        {phase === 'scanning' && (
          <div className="space-y-4">
            {photoUrl && (
              <div className="scan-container rounded-lg overflow-hidden border border-cyber-border">
                <img src={photoUrl} alt="Captured" className="w-full object-contain max-h-52" />
                <div className="scan-overlay" />
                <div className="scan-laser" />
              </div>
            )}

            <div className="rounded-lg p-4 bg-cyber-card border border-cyber-green/20 space-y-3">
              <div className="flex items-center gap-3">
                <ScanLine size={18} className="text-cyber-green animate-pulse" />
                <span className="text-sm text-cyber-green font-mono tracking-widest">SCANNING PLATE...</span>
                <span className="ml-auto text-sm text-cyber-green font-mono font-bold">{ocrProgress}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-black rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyber-green rounded-full transition-all duration-300"
                  style={{
                    width: `${ocrProgress}%`,
                    boxShadow: '0 0 6px #00ff88',
                  }}
                />
              </div>

              <p className="text-xs font-mono text-cyber-muted">{ocrStatus}</p>
            </div>
          </div>
        )}

        {/* ── CONFIRM: review + edit result ── */}
        {phase === 'confirm' && (
          <div className="space-y-4">
            {/* Photo preview */}
            {photoUrl && (
              <div className="rounded-lg overflow-hidden border border-cyber-border relative">
                <img src={photoUrl} alt="Captured" className="w-full object-contain max-h-44" />
                <button
                  onClick={handleRetake}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs neon-btn-cyan bg-cyber-bg/80 backdrop-blur-sm"
                >
                  <RotateCcw size={12} />
                  RETAKE
                </button>
              </div>
            )}

            {/* OCR result box */}
            <div className={`rounded-lg p-4 border ${accentBord} ${accentBg} space-y-3`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                <span className="text-xs font-mono text-cyber-green tracking-widest">OCR RESULT — TAP TO EDIT</span>
              </div>

              {/* Plate number */}
              <div>
                <label className="block text-[10px] font-mono text-cyber-muted mb-1 tracking-widest">
                  PLATE NUMBER
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  maxLength={9}
                  placeholder="ABC1234"
                  className="w-full bg-black border border-cyber-green/50 rounded px-3 py-2
                    font-mono font-bold text-cyber-green text-2xl tracking-[0.25em] uppercase
                    focus:outline-none focus:border-cyber-green focus:ring-1 focus:ring-cyber-green/30"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-[10px] font-mono text-cyber-muted mb-1 tracking-widest">STATE</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-black border border-cyber-green/40 rounded px-3 py-2
                    font-mono text-cyber-green focus:outline-none focus:border-cyber-green text-sm"
                >
                  <option value="">Select state...</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-mono text-cyber-muted mb-1 tracking-widest">
                  NOTES <span className="opacity-50">(color / make / model)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Blue Honda Civic"
                  className="w-full bg-black border border-cyber-border rounded px-3 py-2
                    font-mono text-cyber-text text-sm focus:outline-none focus:border-cyber-cyan/50"
                />
              </div>
            </div>

            {/* Secure button */}
            <button
              onClick={handleSecure}
              disabled={!plate.trim() && !state}
              className="w-full py-4 rounded-lg neon-btn font-display text-lg tracking-widest
                flex items-center justify-center gap-3
                disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: (!plate.trim() && !state) ? undefined :
                  'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,229,255,0.05) 100%)',
                boxShadow:  (!plate.trim() && !state) ? undefined :
                  '0 0 30px rgba(0,255,136,0.2)',
              }}
            >
              {secured
                ? <><CheckCircle2 size={18} /> SECURED!</>
                : <>SECURE PLATE</>
              }
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
