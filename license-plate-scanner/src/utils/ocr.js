import Tesseract from 'tesseract.js'

/**
 * Run OCR on an image and attempt to extract a license plate number.
 * Returns the best-guess plate string.
 *
 * @param {string} imageDataUrl - base64 data URL of the image
 * @param {(progress: number, status: string) => void} [onProgress]
 * @returns {Promise<{ plate: string, confidence: number, rawText: string }>}
 */
export async function extractPlateText(imageDataUrl, onProgress) {
  try {
    const result = await Tesseract.recognize(imageDataUrl, 'eng', {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.floor(m.progress * 100), m.status)
        }
      },
      // Tesseract parameters tuned for license plates
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
      tessedit_pageseg_mode: '7', // Treat image as a single line of text
      preserve_interword_spaces: '0',
    })

    const rawText = result.data.text || ''
    const confidence = result.data.confidence || 0

    // Clean and extract plate-like text
    const plate = cleanPlateText(rawText)

    return { plate, confidence, rawText }
  } catch (err) {
    console.error('OCR error:', err)
    return { plate: '', confidence: 0, rawText: '' }
  }
}

/**
 * Clean OCR output to extract a license plate number.
 * US plates are typically 2–8 alphanumeric characters.
 *
 * @param {string} rawText
 * @returns {string}
 */
function cleanPlateText(rawText) {
  // Remove newlines and extra whitespace
  let text = rawText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

  // Extract alphanumeric tokens that look like plate numbers
  // License plates: 2-8 chars, letters and digits (with optional hyphen)
  const tokens = text.split(' ')

  // Score each token by how "plate-like" it is
  const plateTokens = tokens
    .map(t => t.replace(/[^A-Z0-9-]/gi, '').toUpperCase())
    .filter(t => t.length >= 2 && t.length <= 8)

  if (plateTokens.length === 0) {
    // Fallback: just take all alphanumeric chars up to 8
    const cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    return cleaned.slice(0, 8)
  }

  // Return the longest token that is most plate-like
  const best = plateTokens.sort((a, b) => {
    // Prefer tokens with mix of letters and numbers
    const aScore = scorePlateToken(a)
    const bScore = scorePlateToken(b)
    if (bScore !== aScore) return bScore - aScore
    return b.length - a.length
  })[0]

  return best || ''
}

/**
 * Score a token on how plate-like it is (higher = more plate-like)
 */
function scorePlateToken(token) {
  let score = 0
  const hasLetters = /[A-Z]/.test(token)
  const hasDigits = /[0-9]/.test(token)
  const len = token.length

  if (hasLetters && hasDigits) score += 10  // Mix of letters and numbers
  if (len >= 5 && len <= 7) score += 5       // Typical US plate length
  if (len >= 3) score += 2
  if (!token.includes('-') && len >= 4) score += 1  // No hyphen bonus

  return score
}
