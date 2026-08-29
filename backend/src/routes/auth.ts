import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireDb } from '../db/pool'
import { issueToken } from '../middleware/auth'
import { writeAuditLog } from '../lib/audit'
import type { Role } from '../types'

const router = Router()

const ROLES: Role[] = ['SUPER_ADMIN', 'AUTHORITY', 'TRANSPORT_OPERATOR', 'DRIVER', 'CITIZEN', 'ANALYST']

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ROLES as [Role, ...Role[]]).optional(),
})

router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' })
    const { name, email, password, role } = parsed.data
    const pool = requireDb()

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rowCount) return res.status(409).json({ error: 'An account with this email already exists' })

    const passwordHash = await bcrypt.hash(password, 12)
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, role ?? 'CITIZEN']
    )
    const user = rows[0]
    const token = issueToken(user.id, user.role, user.email)
    await writeAuditLog({ userId: user.id, action: 'USER_REGISTERED', entity: 'user', entityId: user.id })
    res.status(201).json({ token, user })
  } catch (err) {
    next(err)
  }
})

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Email and password are required' })
    const { email, password } = parsed.data
    const pool = requireDb()

    const { rows } = await pool.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    )
    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'Invalid email or password' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

    const token = issueToken(user.id, user.role, user.email)
    await writeAuditLog({ userId: user.id, action: 'USER_LOGIN', entity: 'user', entityId: user.id })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    next(err)
  }
})

router.get('/me', async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' })
    const jwt = await import('jsonwebtoken')
    const payload = jwt.default.verify(header.slice(7), process.env.JWT_SECRET || 'insecure-dev-secret-set-JWT_SECRET-in-env') as any
    res.json({ user: payload })
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
})

export default router
