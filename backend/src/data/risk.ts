import type { RiskZone, RiskLevel } from '../types'
import { CITY_CENTER } from './fleet'

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function jitter(spreadKm = 4) {
  const kmPerDegLat = 111
  const kmPerDegLng = 111 * Math.cos((CITY_CENTER.lat * Math.PI) / 180)
  return {
    lat: CITY_CENTER.lat + rand(-spreadKm, spreadKm) / kmPerDegLat,
    lng: CITY_CENTER.lng + rand(-spreadKm, spreadKm) / kmPerDegLng,
  }
}

function levelFromScore(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 35) return 'MEDIUM'
  return 'LOW'
}

/**
 * DEMO / rule-based accident-risk scoring engine.
 * Weighted sum of simulated factors — NOT a trained ML model and NOT validated
 * against real-world accident data. Replace `scoreZone` with a call into the
 * ai-service (see /ai-service) once a real model is trained.
 */
export function scoreZone(traffic: number, accidentHistory: number, weather: number, roadCondition: number) {
  const score = Math.round(traffic * 0.3 + accidentHistory * 0.3 + weather * 0.2 + roadCondition * 0.2)
  return { score, level: levelFromScore(score) }
}

export function generateRiskZones(count = 24): RiskZone[] {
  return Array.from({ length: count }, (_, i) => {
    const traffic = rand(0, 100)
    const accidentHistory = rand(0, 100)
    const weather = rand(0, 100)
    const roadCondition = rand(0, 100)
    const { score, level } = scoreZone(traffic, accidentHistory, weather, roadCondition)
    return {
      id: `RZ-${i + 1}`,
      position: jitter(),
      radiusMeters: Math.round(rand(250, 700)),
      level,
      score,
      factors: [
        { label: 'Traffic density', weightPct: 30 },
        { label: 'Accident history', weightPct: 30 },
        { label: 'Weather', weightPct: 20 },
        { label: 'Road condition', weightPct: 20 },
      ],
    }
  })
}
