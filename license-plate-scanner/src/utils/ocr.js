import Tesseract from 'tesseract.js'
import { getPlateRecognizerKey } from './apikeys.js'

// Maps Plate Recognizer region codes (e.g. "us-fl") to 2-letter state abbreviations
const REGION_TO_STATE = {
  'us-al':'AL','us-ak':'AK','us-az':'AZ','us-ar':'AR','us-ca':'CA',
  'us-co':'CO','us-ct':'CT','us-de':'DE','us-fl':'FL','us-ga':'GA',
  'us-hi':'HI','us-id':'ID','us-il':'IL','us-in':'IN','us-ia':'IA',
  'us-ks':'KS','us-ky':'KY','us-la':'LA','us-me':'ME','us-md':'MD',
  'us-ma':'MA','us-mi':'MI','us-mn':'MN','us-ms':'MS','us-mo':'MO',
  'us-mt':'MT','us-ne':'NE','us-nv':'NV','us-nh':'NH','us-nj':'NJ',
  'us-nm':'NM','us-ny':'NY','us-nc':'NC','us-nd':'ND','us-oh':'OH',
  'us-ok':'OK','us-or':'OR','us-pa':'PA','us-ri':'RI','us-sc':'SC',
  'us-sd':'SD','us-tn':'TN','us-tx':'TX','us-ut':'UT','us-vt':'VT',
  'us-va':'VA','us-wa':'WA','us-wv':'WV','us-wi':'WI','us-wy':'WY',
  'us-dc':'DC',
}

/**
 * Main entry point. Tries Plate Recognizer API first (much more accurate),
 * falls back to Tesseract if no API key is set or the request fails.
 *
 * @returns {Promise<{ plate: string, state: string, confidence: number, source: 'api'|'ocr' }>}
 */
export async function extractPlateText(imageDataUrl, onProgress) {
  const apiKey = getPlateRecognizerKey()

  if (apiKey) {
    onProgress?.(10, 'Connecting to Plate Recognizer...')
    const result = await tryPlateRecognizer(imageDataUrl, apiKey, onProgress)
    if (result) return result
    // API failed — fall through to Tesseract
    onProgress?.(50, 'API unavailable, using local OCR...')
  }

  return tesseractFallback(imageDataUrl, onProgress)
}

// ── Plate Recognizer API ───────────────────────────────────────────────────

async function tryPlateRecognizer(imageDataUrl, apiKey, onProgress) {
  try {
    onProgress?.(20, 'Uploading image...')

    // Convert dataUrl → Blob
    const res  = await fetch(imageDataUrl)
    const blob = await res.blob()

    const formData = new FormData()
    formData.append('upload', blob, 'plate.jpg')
    formData.append('regions', 'us')   // hint: US plates

    onProgress?.(50, 'Analyzing plate...')

    const response = await fetch('https://api.platerecognizer.com/v1/plate-reader/', {
      method:  'POST',
      headers: { 'Authorization': `Token ${apiKey}` },
      body:    formData,
    })

    if (!response.ok) {
      console.warn('Plate Recognizer error:', response.status, await response.text())
      return null
    }

    const data = await response.json()
    onProgress?.(90, 'Processing result...')

    const best = data.results?.[0]
    if (!best) return null

    const plate  = (best.plate || '').toUpperCase()
    const region = best.region?.code?.toLowerCase() || ''
    const state  = REGION_TO_STATE[region] || ''
    const score  = Math.round((best.score || 0) * 100)

    onProgress?.(100, 'Done')
    return { plate, state, confidence: score, source: 'api' }

  } catch (err) {
    console.warn('Plate Recognizer request failed:', err)
    return null
  }
}

// ── Tesseract fallback ─────────────────────────────────────────────────────

async function tesseractFallback(imageDataUrl, onProgress) {
  try {
    onProgress?.(5, 'Pre-processing image...')
    const processed = await preprocessImage(imageDataUrl)
    onProgress?.(15, 'Starting OCR engine...')

    // Run PSM 11 (sparse — finds text anywhere) and PSM 3 (auto) in parallel
    const [r11, r3] = await Promise.all([
      runTesseract(processed, '11', (p) => onProgress?.(15 + Math.round(p * 0.4), 'Scanning...')),
      runTesseract(processed,  '3', (p) => onProgress?.(55 + Math.round(p * 0.4), 'Scanning...')),
    ])

    onProgress?.(95, 'Analyzing results...')

    const words = [...extractWords(r11.data), ...extractWords(r3.data)]
    const plate = pickBestPlate(words)

    onProgress?.(100, 'Done')
    return { plate, state: '', confidence: Math.max(r11.data.confidence || 0, r3.data.confidence || 0), source: 'ocr' }

  } catch (err) {
    console.error('Tesseract error:', err)
    return { plate: '', state: '', confidence: 0, source: 'ocr' }
  }
}

async function preprocessImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const MIN_WIDTH = 800
      const scale = img.width < MIN_WIDTH ? MIN_WIDTH / img.width : 1
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.filter = 'grayscale(1) contrast(1.8) brightness(1.1)'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      ctx.filter = 'none'
      resolve(canvas.toDataURL('image/jpeg', 0.95))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

async function runTesseract(dataUrl, psm, onProgress) {
  return Tesseract.recognize(dataUrl, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress?.(Math.floor(m.progress * 100))
    },
    tessedit_char_whitelist:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
    tessedit_pageseg_mode:     psm,
    preserve_interword_spaces: '0',
  })
}

function extractWords(data) {
  const words = []
  if (data.words?.length > 0) {
    for (const w of data.words) {
      const text = (w.text || '').replace(/[^A-Z0-9-]/gi, '').toUpperCase()
      if (text.length >= 2) words.push({ text, confidence: w.confidence || 0 })
    }
  }
  const raw = (data.text || '').replace(/\n/g, ' ')
  for (const token of raw.split(/\s+/)) {
    const text = token.replace(/[^A-Z0-9-]/gi, '').toUpperCase()
    if (text.length >= 2) words.push({ text, confidence: 0 })
  }
  return words
}

function pickBestPlate(words) {
  if (!words.length) return ''
  const scored = words
    .filter(w => w.text.length >= 2 && w.text.length <= 8)
    .map(w => ({ ...w, score: scorePlate(w.text, w.confidence) }))
    .sort((a, b) => b.score - a.score)
  return scored[0]?.text || ''
}

function scorePlate(token, conf = 0) {
  let score = 0
  const hasLetters = /[A-Z]/.test(token)
  const hasDigits  = /[0-9]/.test(token)
  const len = token.length
  if (hasLetters && hasDigits) score += 20
  if (len >= 5 && len <= 7)    score += 10
  else if (len === 4 || len === 8) score += 5
  else if (len <= 3) score -= 5
  score += Math.round(conf / 20)
  if (hasLetters && !hasDigits && len >= 4) score -= 8
  if (!hasLetters && hasDigits) score -= 3
  return score
}
