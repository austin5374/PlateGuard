const STATS_KEY = 'plateguard-lifetime-stats'

function defaultStats() {
  return {
    totalSessions: 0,
    totalPlatesScanned: 0,
    firstUseDate: null,
    lastUseDate: null,
  }
}

export function getStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return defaultStats()
    return { ...defaultStats(), ...JSON.parse(raw) }
  } catch {
    return defaultStats()
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch {}
}

export function recordNewSession() {
  const stats = getStats()
  stats.totalSessions = (stats.totalSessions || 0) + 1
  stats.lastUseDate = new Date().toISOString()
  if (!stats.firstUseDate) stats.firstUseDate = new Date().toISOString()
  saveStats(stats)
}

export function recordPlateScan() {
  const stats = getStats()
  stats.totalPlatesScanned = (stats.totalPlatesScanned || 0) + 1
  stats.lastUseDate = new Date().toISOString()
  saveStats(stats)
}
