// netlify/functions/attendance.js

import { getDb, checkAuth, ok, err, cors } from './_db.js'

const EMPLOYEES = ['jamil', 'ajaz', 'moomin', 'shahid', 'shabir']

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return cors()
  if (!checkAuth(event)) return err('Unauthorized', 401)

  const db = getDb()

  // ── GET all attendance ──────────────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const rows = await db`
        SELECT date::text, jamil, ajaz, moomin, shahid, shabir
        FROM attendance
        ORDER BY date DESC
        LIMIT 90
      `
      return ok({ attendance: rows })
    } catch (e) {
      return err(e.message, 500)
    }
  }

  // ── POST upsert one day ─────────────────────────────────────
  if (event.httpMethod === 'POST') {
    const { date, attendance } = JSON.parse(event.body || '{}')
    if (!date) return err('date required')

    try {
      await db`
        INSERT INTO attendance (date, jamil, ajaz, moomin, shahid, shabir)
        VALUES (
          ${date},
          ${attendance?.jamil  || 'Working'},
          ${attendance?.ajaz   || 'Working'},
          ${attendance?.moomin || 'Working'},
          ${attendance?.shahid || 'Working'},
          ${attendance?.shabir || 'Working'}
        )
        ON CONFLICT (date) DO UPDATE SET
          jamil      = EXCLUDED.jamil,
          ajaz       = EXCLUDED.ajaz,
          moomin     = EXCLUDED.moomin,
          shahid     = EXCLUDED.shahid,
          shabir     = EXCLUDED.shabir,
          updated_at = NOW()
      `
      return ok({ success: true })
    } catch (e) {
      return err(e.message, 500)
    }
  }

  return err('Method not allowed', 405)
}
