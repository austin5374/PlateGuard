const KEY_PLATE_RECOGNIZER = 'plateguard-pr-api-key'

export function getPlateRecognizerKey() {
  try { return localStorage.getItem(KEY_PLATE_RECOGNIZER) || '' } catch { return '' }
}

export function setPlateRecognizerKey(key) {
  try { localStorage.setItem(KEY_PLATE_RECOGNIZER, key.trim()) } catch {}
}

export function clearPlateRecognizerKey() {
  try { localStorage.removeItem(KEY_PLATE_RECOGNIZER) } catch {}
}
