const NOTIFY_30_MIN_MS = 30 * 60 * 1000
const NOTIFY_5_MIN_MS = 5 * 60 * 1000

// Map of sessionId -> array of timeout IDs
const scheduledTimeouts = new Map()

export function isNotificationsSupported() {
  return 'Notification' in window
}

export function getNotificationPermission() {
  if (!isNotificationsSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission() {
  if (!isNotificationsSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/**
 * Schedule expiry warning notifications for a session.
 * Sends one at 30 min remaining and one at 5 min remaining.
 * Replaces any previously scheduled notifications for that session.
 */
export function scheduleSessionNotifications(session) {
  cancelSessionNotifications(session.id)

  if (!isNotificationsSupported() || Notification.permission !== 'granted') return

  const remaining = new Date(session.expiresAt) - Date.now()
  const timeouts = []

  const fire30 = remaining - NOTIFY_30_MIN_MS
  if (fire30 > 0) {
    timeouts.push(
      setTimeout(() => {
        try {
          new Notification('PlateGuard — 30 Min Warning', {
            body: 'Your parking session expires in 30 minutes. Plate data will be permanently deleted.',
            icon: '/manifest-icon-192.png',
            tag: `pg-30-${session.id}`,
            badge: '/manifest-icon-192.png',
          })
        } catch {}
      }, fire30)
    )
  }

  const fire5 = remaining - NOTIFY_5_MIN_MS
  if (fire5 > 0) {
    timeouts.push(
      setTimeout(() => {
        try {
          new Notification('PlateGuard \u26a0\ufe0f CRITICAL — 5 Min Left', {
            body: 'Session expires in 5 minutes! Plate data will be permanently deleted.',
            icon: '/manifest-icon-192.png',
            tag: `pg-5-${session.id}`,
            badge: '/manifest-icon-192.png',
          })
        } catch {}
      }, fire5)
    )
  }

  if (timeouts.length > 0) {
    scheduledTimeouts.set(session.id, timeouts)
  }
}

export function cancelSessionNotifications(sessionId) {
  const timeouts = scheduledTimeouts.get(sessionId)
  if (timeouts) {
    timeouts.forEach(clearTimeout)
    scheduledTimeouts.delete(sessionId)
  }
}

/**
 * Re-schedule notifications for all active sessions (e.g. on app reload).
 */
export function rescheduleAllNotifications(sessions) {
  if (!isNotificationsSupported() || Notification.permission !== 'granted') return
  sessions.forEach(scheduleSessionNotifications)
}
