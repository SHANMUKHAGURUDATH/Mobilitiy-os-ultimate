/**
 * Real migration runner. No ORM engine binaries required — just plain SQL,
 * applied once and tracked in a schema_migrations table.
 *
 * Usage:  npm run db:migrate
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env and configure it first.')
    process.exit(1)
  }

  const pool = new Pool({ connectionString })
  const dir = path.join(__dirname, '..', '..', 'database', 'migrations')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  const { rows } = await pool.query('SELECT name FROM schema_migrations')
  const applied = new Set(rows.map((r) => r.name))

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip  ${file} (already applied)`)
      continue
    }
    const sql = fs.readFileSync(path.join(dir, file), 'utf8')
    console.log(`apply ${file}`)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      console.error(`FAILED applying ${file}:`, err)
      process.exit(1)
    } finally {
      client.release()
    }
  }

  console.log('Migrations up to date.')
  await pool.end()
}

main()
