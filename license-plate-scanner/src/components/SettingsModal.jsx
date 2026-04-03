import { useState } from 'react'
import { X, Key, CheckCircle2, ExternalLink, Eye, EyeOff, Trash2 } from 'lucide-react'
import { getPlateRecognizerKey, setPlateRecognizerKey, clearPlateRecognizerKey } from '../utils/apikeys.js'
import { haptic } from '../utils/haptics.js'

export default function SettingsModal({ onClose }) {
  const [apiKey,    setApiKey]    = useState(() => getPlateRecognizerKey())
  const [showKey,   setShowKey]   = useState(false)
  const [saved,     setSaved]     = useState(false)

  const handleSave = () => {
    haptic.success()
    setPlateRecognizerKey(apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClear = () => {
    haptic.medium()
    clearPlateRecognizerKey()
    setApiKey('')
  }

  const maskedKey = apiKey
    ? apiKey.slice(0, 4) + '••••••••' + apiKey.slice(-4)
    : ''

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-cyber-surface border border-cyber-border rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-cyber-cyan" />
            <h2 className="font-display text-cyber-cyan text-sm tracking-widest">SETTINGS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-cyber-muted hover:text-cyber-cyan transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">

          {/* Plate Recognizer section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-display text-cyber-green tracking-widest">PLATE RECOGNIZER API</h3>
              <a
                href="https://platerecognizer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-cyber-cyan font-mono hover:underline"
              >
                GET FREE KEY <ExternalLink size={10} />
              </a>
            </div>

            <p className="text-[11px] text-cyber-muted font-mono leading-relaxed mb-3">
              Dramatically improves plate reading accuracy and auto-detects your state.
              Free tier: <span className="text-cyber-cyan">2,500 reads/month</span>.
              Sign up at platerecognizer.com → copy your API token below.
            </p>

            {/* Steps */}
            <ol className="text-[10px] text-cyber-muted font-mono space-y-1 mb-4 list-decimal list-inside">
              <li>Go to <span className="text-cyber-cyan">platerecognizer.com</span> and create a free account</li>
              <li>Copy your <span className="text-cyber-green">API Token</span> from the dashboard</li>
              <li>Paste it below and tap SAVE</li>
            </ol>

            {/* Input */}
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setSaved(false) }}
                placeholder="Paste your API token here..."
                className="w-full bg-black border border-cyber-cyan/40 rounded px-3 py-2.5 pr-10
                  font-mono text-cyber-cyan text-sm focus:outline-none focus:border-cyber-cyan
                  focus:ring-1 focus:ring-cyber-cyan/30 placeholder-cyber-muted/40"
              />
              <button
                onClick={() => setShowKey(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-cyan transition-colors"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Status */}
            {getPlateRecognizerKey() && (
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle2 size={12} className="text-cyber-green" />
                <span className="text-[10px] font-mono text-cyber-green">
                  Active: {maskedKey}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            {apiKey && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-2 rounded border border-cyber-red/40
                  text-cyber-red text-xs font-mono hover:bg-red-950/20 transition-colors"
              >
                <Trash2 size={12} />
                CLEAR
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex-1 py-2.5 rounded neon-btn font-display text-sm tracking-widest
                flex items-center justify-center gap-2
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {saved
                ? <><CheckCircle2 size={14} /> SAVED!</>
                : 'SAVE API KEY'
              }
            </button>
          </div>

          {/* No key fallback note */}
          {!getPlateRecognizerKey() && (
            <p className="text-[10px] text-cyber-muted font-mono text-center border-t border-cyber-border pt-3">
              Without an API key, the app uses local OCR (less accurate).
              You can always edit the plate number manually after scanning.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
