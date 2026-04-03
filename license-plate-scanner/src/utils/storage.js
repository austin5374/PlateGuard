import { openDB } from 'idb'

const DB_NAME = 'plateguard-db'
const DB_VERSION = 1
const STORE_NAME = 'sessions'
const SESSION_TTL_MS = 3 * 60 * 60 * 1000 // 3 hours

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('expiresAt', 'expiresAt')
          store.createIndex('createdAt', 'createdAt')
        }
      },
    })
  }
  return dbPromise
}

/**
 * Create a new parking session
 * @param {{ lat: number, lng: number, address: string }} location
 * @returns {Promise<string>} session id
 */
export async function createSession(location) {
  const db = await getDB()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS)

  // Generate a UUID-like id without importing uuid (or use uuid if available)
  let id
  try {
    const { v4: uuidv4 } = await import('uuid')
    id = uuidv4()
  } catch {
    id = crypto.randomUUID()
  }

  const session = {
    id,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    location: {
      lat: location.lat,
      lng: location.lng,
      address: location.address || null,
    },
    cars: {
      left: null,
      right: null,
    },
  }

  await db.put(STORE_NAME, session)
  return id
}

/**
 * Get a session by id
 * @param {string} id
 * @returns {Promise<object|undefined>}
 */
export async function getSession(id) {
  const db = await getDB()
  return db.get(STORE_NAME, id)
}

/**
 * Get all non-expired sessions, sorted newest first
 * @returns {Promise<object[]>}
 */
export async function getActiveSessions() {
  const db = await getDB()
  const all = await db.getAll(STORE_NAME)
  const now = new Date()
  return all
    .filter(s => new Date(s.expiresAt) > now)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/**
 * Update car data for a given side in a session
 * @param {string} sessionId
 * @param {'left'|'right'} side
 * @param {{ photo: string, plate: string, state: string, notes: string }} carData
 */
export async function updateCarData(sessionId, side, carData) {
  const db = await getDB()
  const session = await db.get(STORE_NAME, sessionId)
  if (!session) throw new Error(`Session ${sessionId} not found`)

  session.cars[side] = {
    photo: carData.photo || null,
    plate: carData.plate || '',
    state: carData.state || '',
    notes: carData.notes || '',
    capturedAt: new Date().toISOString(),
  }

  await db.put(STORE_NAME, session)
  return session
}

/**
 * Delete a session by id
 * @param {string} id
 */
export async function deleteSession(id) {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

/**
 * Purge all expired sessions from IndexedDB
 * @returns {Promise<number>} number of sessions deleted
 */
export async function purgeExpiredSessions() {
  const db = await getDB()
  const all = await db.getAll(STORE_NAME)
  const now = new Date()
  let count = 0

  for (const session of all) {
    if (new Date(session.expiresAt) <= now) {
      await db.delete(STORE_NAME, session.id)
      count++
    }
  }

  return count
}

/**
 * Get remaining time in ms for a session
 * @param {object} session
 * @returns {number} ms remaining (0 if expired)
 */
export function getRemainingMs(session) {
  const remaining = new Date(session.expiresAt) - new Date()
  return Math.max(0, remaining)
}

/**
 * Get threat level based on remaining time
 * @param {object} session
 * @returns {'green'|'yellow'|'orange'|'red'}
 */
export function getThreatLevel(session) {
  const remaining = getRemainingMs(session)
  const total = SESSION_TTL_MS

  if (remaining > total * 0.5) return 'green'      // >90 min left
  if (remaining > total * 0.25) return 'yellow'    // >45 min left
  if (remaining > total * 0.1) return 'orange'     // >18 min left
  return 'red'                                     // <18 min left
}

/**
 * Format ms duration to HH:MM:SS
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  if (ms <= 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':')
}
