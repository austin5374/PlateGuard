function vibrate(pattern) {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch {}
}

export const haptic = {
  /** Very short tap — button press feedback */
  light: () => vibrate(20),
  /** Standard tap feedback */
  medium: () => vibrate(50),
  /** Strong tap */
  heavy: () => vibrate([80, 20, 80]),
  /** Double tap — success */
  success: () => vibrate([40, 30, 100]),
  /** Triple buzz — error */
  error: () => vibrate([80, 40, 80, 40, 160]),
  /** Scanner sequence — building tension */
  scan: () => vibrate([20, 60, 20, 60, 20, 60, 80]),
  /** Plate secured — satisfying long buzz */
  secured: () => vibrate([30, 50, 30, 50, 200]),
}
