import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { Role } from '../types'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET && process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.warn(
    '[auth] JWT_SECRET is not set in backend/.env — using an insecure fallback. ' +
    'Set a real secret before any non-local deployment.'
  )
}
const SECRET = JWT_SECRET || 'insecure-dev-secret-set-JWT_SECRET-in-env'

export interface AuthedRequest extends Request {
  user?: { id: string; role: Role; email?: string }
}

export function issueToken(id: string, role: Role, email?: string) {
  return jwt.sign({ id, role, email }, SECRET, { expiresIn: '12h' })
}

// Attaches req.user if a valid bearer token is present, otherwise treats the
// caller as an unauthenticated CITIZEN. Public read endpoints work without a
// token; protected endpoints check req.user.role via requireRole().
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), SECRET) as { id: string; role: Role; email?: string }
      req.user = payload
    } catch {
      // invalid/expired token -> fall through as anonymous CITIZEN
    }
  }
  if (!req.user) req.user = { id: 'anonymous', role: 'CITIZEN' }
  next()
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }
  try {
    req.user = jwt.verify(header.slice(7), SECRET) as { id: string; role: Role; email?: string }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Forbidden — insufficient role for this resource' })
    }
    next()
  }
}
