import Tesseract from 'tesseract.js'

/**
 * Pre-process an image for better OCR accuracy on license plates.
 * Steps:
 *   1. Upscale to at least 400px wide (Tesseract prefers large text)
 *   2. Apply grayscale + contrast + brightness boost via CSS filter
 *
 * @param {string} dataUrl
 * @returns {Promise<string>} processed dataUrl
 */
export async function preprocessImageForOCR(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const MIN_WIDTH = 600
      const scale = img.width < MIN_WIDTH ? Math.ceil(MIN_WIDTH / img.width) : 1

      const canvas = document.createElement('canvas')
      canvas.width  = img.width  * scale
      canvas.height = img.height * scale

      const ctx = canvas.getContext('2d')

      // Upscale with smoothing for cleaner edges
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Apply CSS filter: grayscale → heavy contrast → slight brightness boost
      ctx.filter = 'grayscale(1) contrast(2.2) brightness(1.1)'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      ctx.filter = 'none'

      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = () => resolve(dataUrl) // fall back to original
    img.src = dataUrl
  })
}

/**
 * Run OCR on an image and attempt to extract a license plate number.
 *
 * @param {string} imageDataUrl - base64 data URL of the captured image
 * @param {(progress: number, status: string) => void} [onProgress]
 * @returns {Promise<{ plate: string, confidence: number, rawText: string, processedDataUrl: string }>}
 */
export async function extractPlateText(imageDataUrl, onProgress) {
  let processedDataUrl = imageDataUrl
  try {
    onProgress?.(5, 'Pre-processing image...')
    processedDataUrl = await preprocessImageForOCR(imageDataUrl)
    onProgress?.(15, 'Initializing OCR engine...')

    const result = await Tesseract.recognize(processedDataUrl, 'eng', {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          // Map Tesseract's 0-1 progress to our 15-95 range
          onProgress(Math.floor(15 + m.progress * 80), 'Scanning plate...')
        }
      },
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
      tessedit_pageseg_mode: '7',   // single line of text
      preserve_interword_spaces: '0',
    })

    onProgress?.(100, 'Done')

    const rawText   = result.data.text || ''
    const confidence = result.data.confidence || 0
    const plate     = cleanPlateText(rawText)

    return { plate, confidence, rawText, processedDataUrl }
  } catch (err) {
    console.error('OCR error:', err)
    return { plate: '', confidence: 0, rawText: '', processedDataUrl }
  }
}

/**
 * Clean raw OCR output and extract the most plate-like token.
 * US plates: 2–8 alphanumeric characters, often mixed letters + digits.
 *
 * @param {string} rawText
 * @returns {string}
 */
function cleanPlateText(rawText) {
  const text = rawText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

  const tokens = text
    .split(/\s+/)
    .map(t => t.replace(/[^A-Z0-9-]/gi, '').toUpperCase())
    .filter(t => t.length >= 2 && t.length <= 8)

  if (tokens.length === 0) {
    const cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    return cleaned.slice(0, 8)
  }

  return tokens.sort((a, b) => scorePlateToken(b) - scorePlateToken(a))[0] || ''
}

function scorePlateToken(token) {
  let score = 0
  const hasLetters = /[A-Z]/.test(token)
  const hasDigits  = /[0-9]/.test(token)
  const len        = token.length

  if (hasLetters && hasDigits) score += 10  // mix of letters + digits is typical
  if (len >= 5 && len <= 7)    score += 5   // typical US plate length
  if (len >= 3)                score += 2
  if (!token.includes('-') && len >= 4) score += 1

  return score
}
