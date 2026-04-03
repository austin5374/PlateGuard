import Tesseract from 'tesseract.js'

/**
 * Pre-process an image for better OCR accuracy on license plates.
 * - Upscale to minimum 600px wide (Tesseract needs large text)
 * - Apply grayscale + heavy contrast boost via CSS canvas filter
 */
export async function preprocessImageForOCR(dataUrl) {
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
      // Grayscale + contrast boost — makes plate text pop against background
      ctx.filter = 'grayscale(1) contrast(1.8) brightness(1.1)'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      ctx.filter = 'none'

      resolve(canvas.toDataURL('image/jpeg', 0.95))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

/**
 * Run OCR on an image and extract the most likely license plate number.
 *
 * Strategy: run TWO passes with different Tesseract page-seg modes and
 * combine all candidate tokens, then pick the best scoring one.
 *
 *  PSM 11 — sparse text: finds text anywhere in the image (best for full car photos)
 *  PSM  3 — auto:        full auto-layout analysis (good fallback)
 *
 * @param {string} imageDataUrl
 * @param {(progress: number, status: string) => void} [onProgress]
 * @returns {Promise<{ plate: string, confidence: number, rawText: string }>}
 */
export async function extractPlateText(imageDataUrl, onProgress) {
  try {
    onProgress?.(5, 'Pre-processing image...')
    const processed = await preprocessImageForOCR(imageDataUrl)
    onProgress?.(15, 'Starting OCR engine...')

    // Run both PSM passes, splitting progress evenly
    const [result11, result3] = await Promise.all([
      runOCR(processed, '11', (p, s) => onProgress?.(15 + Math.round(p * 0.4), s)),
      runOCR(processed,  '3', (p, s) => onProgress?.(55 + Math.round(p * 0.4), s)),
    ])

    onProgress?.(95, 'Analyzing results...')

    // Combine all word-level detections from both passes
    const words11 = extractWords(result11.data)
    const words3  = extractWords(result3.data)
    const allWords = [...words11, ...words3]

    // Pick best plate candidate across all detected words
    const plate = pickBestPlate(allWords)

    // Overall confidence from whichever pass found the plate
    const confidence = Math.max(result11.data.confidence || 0, result3.data.confidence || 0)
    const rawText    = result11.data.text || ''

    onProgress?.(100, 'Done')
    return { plate, confidence, rawText }

  } catch (err) {
    console.error('OCR error:', err)
    return { plate: '', confidence: 0, rawText: '' }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function runOCR(dataUrl, psm, onProgress) {
  return Tesseract.recognize(dataUrl, 'eng', {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.floor(m.progress * 100), 'Scanning...')
      }
    },
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
    tessedit_pageseg_mode:   psm,
    preserve_interword_spaces: '0',
  })
}

/**
 * Pull every detected word out of a Tesseract result, with its confidence.
 * Falls back to splitting the raw text if word-level data isn't available.
 */
function extractWords(data) {
  const words = []

  // Use word-level data when available (more precise)
  if (data.words && data.words.length > 0) {
    for (const w of data.words) {
      const text = (w.text || '').replace(/[^A-Z0-9-]/gi, '').toUpperCase()
      if (text.length >= 2) words.push({ text, confidence: w.confidence || 0 })
    }
  }

  // Also parse raw text as fallback
  const raw = (data.text || '').replace(/\n/g, ' ')
  for (const token of raw.split(/\s+/)) {
    const text = token.replace(/[^A-Z0-9-]/gi, '').toUpperCase()
    if (text.length >= 2) words.push({ text, confidence: 0 })
  }

  return words
}

/**
 * From all candidate words, pick the one that looks most like a US plate.
 * US plates: 2–8 alphanumeric chars, typically a mix of letters + digits.
 */
function pickBestPlate(words) {
  if (words.length === 0) return ''

  const scored = words
    .filter(w => w.text.length >= 2 && w.text.length <= 8)
    .map(w => ({ ...w, score: scorePlate(w.text, w.confidence) }))
    .sort((a, b) => b.score - a.score)

  return scored[0]?.text || ''
}

function scorePlate(token, ocrConfidence = 0) {
  let score = 0
  const hasLetters = /[A-Z]/.test(token)
  const hasDigits  = /[0-9]/.test(token)
  const len        = token.length

  // Mix of letters + digits is the strongest signal for a US plate
  if (hasLetters && hasDigits) score += 20

  // Typical US plate length is 5–7 chars
  if (len >= 5 && len <= 7) score += 10
  else if (len === 4 || len === 8) score += 5
  else if (len <= 3) score -= 5

  // Reward higher OCR confidence
  score += Math.round(ocrConfidence / 20)

  // Penalise tokens that are all letters (likely a word, not a plate)
  if (hasLetters && !hasDigits && len >= 4) score -= 8

  // Penalise tokens that are all digits (could be a street number etc.)
  if (!hasLetters && hasDigits) score -= 3

  return score
}
