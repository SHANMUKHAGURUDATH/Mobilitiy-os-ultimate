import type { Server } from 'http'
import { WebSocketServer, WebSocket } from 'ws'

/**
 * The REAL real-time channel. Unlike ws/simulation.ts (which generates fake
 * movement and only runs when SIMULATION_MODE=true), this server only ever
 * emits events that were triggered by a real write to the database:
 *   - a POST to /api/vehicles/:id/location  -> {type:'vehicle_location', ...}
 *   - a new/updated incident                -> {type:'incident', ...}
 *   - a new notification                    -> {type:'notification', ...}
 *
 * Nothing here fabricates data. If no real GPS source is sending locations,
 * nothing is broadcast on this channel — that's correct behavior, not a bug.
 */
let wss: WebSocketServer | null = null

export function attachLiveChannel(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws/live' })
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'connected', mode: 'LIVE' }))
  })
  return wss
}

export function broadcast(type: string, payload: unknown) {
  if (!wss) return
  const message = JSON.stringify({ type, payload, at: new Date().toISOString() })
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(message)
  })
}
