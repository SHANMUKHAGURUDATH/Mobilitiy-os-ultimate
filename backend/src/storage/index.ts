import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

/**
 * Storage abstraction.
 *
 * LOCAL (default, STORAGE_PROVIDER=local): files are written to
 * backend/uploads/ and served back at /uploads/<name>. This is real,
 * working file persistence for local development and single-instance
 * deployments — but it is NOT durable on ephemeral hosts like Vercel
 * serverless functions (the filesystem is wiped between invocations),
 * which is exactly why section 47 of the spec says never to rely on it
 * in production.
 *
 * S3 (STORAGE_PROVIDER=s3): production-compatible object storage. Wired to
 * the same interface below. Requires STORAGE_BUCKET / STORAGE_ACCESS_KEY /
 * STORAGE_SECRET_KEY (+ optionally STORAGE_ENDPOINT for R2/MinIO/other
 * S3-compatible providers) in backend/.env. This code path could not be
 * exercised in this sandbox (no network route to any S3-compatible
 * endpoint), so treat it as reviewed-but-untested until you run it against
 * your own bucket.
 */

const PROVIDER = process.env.STORAGE_PROVIDER || 'local'
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')

if (PROVIDER === 'local' && !fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

export function isStorageConfigured(): boolean {
  if (PROVIDER === 'local') return true
  return Boolean(process.env.STORAGE_BUCKET && process.env.STORAGE_ACCESS_KEY && process.env.STORAGE_SECRET_KEY)
}

export function storageProviderName() {
  return PROVIDER
}

export async function saveBuffer(buffer: Buffer, originalName: string, mimeType: string): Promise<{ storageUrl: string; key: string }> {
  const ext = path.extname(originalName)
  const key = `${crypto.randomUUID()}${ext}`

  if (PROVIDER === 'local') {
    fs.writeFileSync(path.join(UPLOAD_DIR, key), buffer)
    return { storageUrl: `/uploads/${key}`, key }
  }

  if (PROVIDER === 's3') {
    if (!isStorageConfigured()) {
      const err: any = new Error('STORAGE_PROVIDER=s3 but STORAGE_BUCKET/STORAGE_ACCESS_KEY/STORAGE_SECRET_KEY are not set')
      err.status = 503
      throw err
    }
    // Lazy import so the S3 SDK is only required when actually configured.
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
    const client = new S3Client({
      region: process.env.STORAGE_REGION || 'auto',
      endpoint: process.env.STORAGE_ENDPOINT,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.STORAGE_SECRET_KEY!,
      },
    })
    await client.send(new PutObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }))
    const base = process.env.STORAGE_PUBLIC_URL_BASE || `https://${process.env.STORAGE_BUCKET}.s3.amazonaws.com`
    return { storageUrl: `${base}/${key}`, key }
  }

  throw new Error(`Unknown STORAGE_PROVIDER: ${PROVIDER}`)
}

export async function deleteFile(key: string) {
  if (PROVIDER === 'local') {
    const p = path.join(UPLOAD_DIR, key)
    if (fs.existsSync(p)) fs.unlinkSync(p)
    return
  }
  if (PROVIDER === 's3') {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3')
    const client = new S3Client({
      region: process.env.STORAGE_REGION || 'auto',
      endpoint: process.env.STORAGE_ENDPOINT,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.STORAGE_SECRET_KEY!,
      },
    })
    await client.send(new DeleteObjectCommand({ Bucket: process.env.STORAGE_BUCKET, Key: key }))
  }
}

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'video/mp4',
])
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25MB
