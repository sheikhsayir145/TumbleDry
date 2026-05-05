// netlify/functions/_db.js
// Shared Neon database connection for all functions

import { neon } from '@neondatabase/serverless'

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable not set')
  }
  return neon(process.env.DATABASE_URL)
}

export function checkAuth(event) {
  const secret = event.headers['x-api-secret']
  if (secret !== process.env.API_SECRET) {
    return false
  }
  return true
}

export function ok(data, status = 200) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data)
  }
}

export function err(message, status = 400) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: message })
  }
}

export function cors() {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-secret',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: ''
  }
}
