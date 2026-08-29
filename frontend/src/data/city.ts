// Demo city center. All coordinates in this prototype are simulated and
// centered around Vizianagaram, Andhra Pradesh, purely as a realistic anchor point.
export const CITY_CENTER = { lat: 18.1067, lng: 83.4014 }
export const CITY_NAME = 'Vizianagaram'
export const CITY_ZOOM = 13

// simple deterministic-ish PRNG so demo data is stable within a session but not identical every reload
let seed = Date.now() % 2147483647
export function rand(): number {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

export function randRange(min: number, max: number) {
  return min + rand() * (max - min)
}

export function jitterLatLng(center = CITY_CENTER, spreadKm = 4) {
  const kmPerDegLat = 111
  const kmPerDegLng = 111 * Math.cos((center.lat * Math.PI) / 180)
  return {
    lat: center.lat + randRange(-spreadKm, spreadKm) / kmPerDegLat,
    lng: center.lng + randRange(-spreadKm, spreadKm) / kmPerDegLng,
  }
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}
