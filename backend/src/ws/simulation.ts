import type { Server } from 'http'
import { WebSocketServer } from 'ws'
import { generateFleet, stepFleet } from '../data/fleet'
import type { LiveVehicle } from '../types'

/**
 * SIMULATION MODE ONLY.
 *
 * This generates fake vehicle movement for demos when no real GPS source is
 * connected. It is intentionally isolated on its own WebSocket path
 * (/ws/simulation) and is only ever started when SIMULATION_MODE=true — see
 * src/index.ts. It must never be confused with /ws/live (src/ws/live.ts),
 * which only relays real, database-backed events.
 */
let fleet: LiveVehicle[] = generateFleet()

export function getSimulatedFleet() {
  return fleet
}

export function attachVehicleSimulation(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws/simulation' })

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'simulation_fleet', mode: 'SIMULATION', payload: fleet }))
  })

  setInterval(() => {
    fleet = stepFleet(fleet)
    const payload = JSON.stringify({ type: 'simulation_fleet', mode: 'SIMULATION', payload: fleet })
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) client.send(payload)
    })
  }, 4000)

  return wss
}
