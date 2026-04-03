import { useRef, useState } from 'react'
import { Camera, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { extractPlateText } from '../utils/ocr.js'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
]

export default function CameraCapture({ side, existingData, onCapture, onSave, onCancel }) {
  // Support both onCapture and onSave prop names
  const handleSave = onSave || onCapture
  const fileInputRef = useRef(null)
  const [phase, setPhase] = useState(existingData?.photo ? 'confirm' : 'idle') // idle | scanning | confirm | done
  const [photoDataUrl, setPhotoDataUrl] = useState(existingData?.photo || null)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState('')
  const [plate, setPlate] = useState(existingData?.plate || '')
  const [state, setState] = useState(existingData?.state || '')
  const [notes, setNotes] = useState(existingData?.notes || '')
  const [secured, setSecured] = useState(false)
  const [showFlash, setShowFlash] = useState(false)

  const sideColor = side === 'left' ? 'text-cyber-cyan' : 'text-cyber-green'
  const sideBorder = side === 'left' ? 'border-cyber-cyan/40' : 'border-cyber-green/40'
  const sideBg = side === 'left' ? 'bg-cyber-cyan/5' : 'bg-cyber-green/5'

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      setPhotoDataUrl(dataUrl)
      setPhase('scanning')
      setOcrProgress(0)
      setOcrStatus('Initializing OCR engine...')

      const { plate: extractedPlate } = await extractPlateText(dataUrl, (progress, status) => {
        setOcrProgress(progress)
        setOcrStatus(status)
      })

      setPlate(extractedPlate || '')
      setPhase('confirm')
    }
    reader.readAsDataURL(file)
  }

  const handleSecure = () => {
    if (!plate.trim() && !state) return
    setShowFlash(true)
    setSecured(true)
    setTimeout(() => setShowFlash(false), 800)
    setTimeout(() => {
      handleSave({
        photo: photoDataUrl,
        plate: plate.trim().toUpperCase(),
        state,
        notes: notes.trim(),
      })
    }, 900)
  }

  const handleRetake = () => {
    setPhase('idle')
    setPhotoDataUrl(null)
    setPlate('')
    setState('')
    setNotes('')
    setOcrProgress(0)
    setSecured(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="relative">
      {showFlash && <div className="flash-overlay" />}

      <div className={`border rounded-xl ${sideBorder} ${sideBg} p-4 space-y-4 animate-slide-up`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className={`font-display font-bold text-sm tracking-widest uppercase ${sideColor}`}>
            {side} vehicle
          </div>
          <button
            onClick={onCancel}
            className="text-cyber-muted hover:text-cyber-red text-xs font-mono transition-colors"
          >
            CANCEL
          </button>
        </div>

        {/* Phase: idle — show camera trigger */}
        {phase === 'idle' && (
          <div className="text-center py-6">
            <div className="scan-container border-2 border-dashed border-cyber-border rounded-lg p-8 mx-auto max-w-xs cursor-pointer hover:border-cyber-green/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}>
              <Camera size={40} className="mx-auto mb-3 text-cyber-muted" />
              <div className="text-sm font-mono text-cyber-muted">TAP TO CAPTURE</div>
              <div className="text-xs font-mono text-cyber-muted/50 mt-1">License plate photo</div>
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

        {/* Phase: scanning */}
        {phase === 'scanning' && (
          <div className="space-y-3">
            {photoDataUrl && (
              <div className="scan-container rounded-lg overflow-hidden border border-cyber-border max-h-40">
                <img src={photoDataUrl} alt="Captured" className="w-full object-contain max-h-40" />
                <div className="scan-overlay" />
                <div className="scan-laser" />
              </div>
            )}
            <div className="flex items-center gap-2 text-cyber-green text-sm font-mono">
              <Loader2 size={14} className="animate-spin" />
              <span>SCANNING PLATE... {ocrProgress}%</span>
            </div>
            <div className="h-1 bg-cyber-border rounded-full overflow-hidden">
              <div
                className="h-full bg-cyber-green rounded-full transition-all duration-300"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
            <div className="text-xs font-mono text-cyber-muted">{ocrStatus}</div>
          </div>
        )}

        {/* Phase: confirm */}
        {phase === 'confirm' && (
          <div className="space-y-3">
            {photoDataUrl && (
              <div className="rounded-lg overflow-hidden border border-cyber-border max-h-36">
                <img src={photoDataUrl} alt="Captured" className="w-full object-contain max-h-36" />
              </div>
            )}

            {/* OCR result / editable plate */}
            <div>
              <label className="block text-xs font-mono text-cyber-muted mb-1 tracking-wider">
                PLATE NUMBER <span className="text-cyber-muted/50">(tap to edit)</span>
              </label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                maxLength={9}
                placeholder="ABC1234"
                className="w-full bg-black border border-cyber-green/40 rounded px-3 py-2 font-mono font-bold text-cyber-green text-lg tracking-widest uppercase focus:outline-none focus:border-cyber-green focus:ring-1 focus:ring-cyber-green/30"
              />
            </div>

            {/* State selector */}
            <div>
              <label className="block text-xs font-mono text-cyber-muted mb-1 tracking-wider">STATE</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-black border border-cyber-green/40 rounded px-3 py-2 font-mono text-cyber-green focus:outline-none focus:border-cyber-green text-sm"
              >
                <option value="">Select state...</option>
                {US_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-mono text-cyber-muted mb-1 tracking-wider">
                NOTES <span className="text-cyber-muted/50">(color, make, model)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Blue Honda Civic"
                className="w-full bg-black border border-cyber-border rounded px-3 py-2 font-mono text-cyber-text text-sm focus:outline-none focus:border-cyber-cyan/40"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleRetake}
                className="flex-1 neon-btn-cyan py-2 px-3 rounded text-xs"
              >
                RETAKE
              </button>
              <button
                onClick={handleSecure}
                disabled={!plate.trim() && !state}
                className="flex-2 neon-btn py-2 px-4 rounded text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ flex: 2 }}
              >
                {secured
                  ? <><CheckCircle2 size={14} /> SECURED!</>
                  : <>SECURE PLATE</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
