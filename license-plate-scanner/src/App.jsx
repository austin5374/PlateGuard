import { useState, useEffect, useCallback } from 'react'
import Home from './pages/Home.jsx'
import NewSession from './pages/NewSession.jsx'
import SessionDetail from './components/SessionDetail.jsx'
import { purgeExpiredSessions, getActiveSessions } from './utils/storage.js'
import { rescheduleAllNotifications, getNotificationPermission } from './utils/notifications.js'

export default function App() {
  const [page, setPage] = useState('home') // 'home' | 'new-session' | 'session-detail'
  const [selectedSessionId, setSelectedSessionId] = useState(null)

  const runPurge = useCallback(async () => {
    try {
      await purgeExpiredSessions()
    } catch (err) {
      console.error('Purge error:', err)
    }
  }, [])

  useEffect(() => {
    // Purge on load, then reschedule any active notifications
    runPurge().then(async () => {
      if (getNotificationPermission() === 'granted') {
        const sessions = await getActiveSessions()
        rescheduleAllNotifications(sessions)
      }
    })

    // Purge every 60 seconds
    const interval = setInterval(runPurge, 60_000)
    return () => clearInterval(interval)
  }, [runPurge])

  const navigate = (target, options = {}) => {
    if (target === 'session-detail' && options.sessionId) {
      setSelectedSessionId(options.sessionId)
    }
    setPage(target)
  }

  return (
    <div className="min-h-screen bg-cyber-bg grid-bg text-cyber-text relative">
      {/* CRT scanline overlay */}
      <div className="scanline" />

      {page === 'home' && (
        <Home
          onNewSession={() => navigate('new-session')}
          onViewSession={(id) => navigate('session-detail', { sessionId: id })}
        />
      )}

      {page === 'new-session' && (
        <NewSession
          onBack={() => navigate('home')}
          onSessionCreated={(id) => navigate('session-detail', { sessionId: id })}
        />
      )}

      {page === 'session-detail' && (
        <SessionDetail
          sessionId={selectedSessionId}
          onBack={() => navigate('home')}
        />
      )}
    </div>
  )
}
