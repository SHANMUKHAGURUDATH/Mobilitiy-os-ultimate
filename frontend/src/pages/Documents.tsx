import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, StatusPill } from '../components/ui'
import { DocumentsApi, API_BASE } from '../lib/api'
import { Upload, FileText, Trash2 } from 'lucide-react'

const STATUS_TONE: Record<string, 'signal' | 'amber' | 'red' | 'muted'> = {
  VALID: 'signal', EXPIRING_SOON: 'amber', EXPIRED: 'red', PROCESSING: 'muted',
}

export default function Documents() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    try {
      setDocuments(await DocumentsApi.list())
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      await DocumentsApi.upload(file)
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this document?')) return
    try {
      await DocumentsApi.remove(id)
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Document Vault</h1>
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-signal text-black text-sm font-medium">
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.mp4" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <Upload size={16} /> {uploading ? 'Uploading…' : 'Upload Document'}
        </label>
      </div>

      {error && <Card className="p-3 border-red-500/40 text-red-400 text-xs">{error}</Card>}

      <Card>
        <CardHeader title="Real upload → storage → metadata" sub="PDF, JPG, PNG, MP4 up to 25MB — persisted to backend/uploads (or S3 in production)" />
        <div className="px-4 pb-4 space-y-2">
          {loading ? (
            <p className="text-sm text-muted py-4">Loading…</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted py-4">No documents uploaded.</p>
          ) : (
            documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-md border border-grid text-sm">
                <a href={`${API_BASE}${d.storage_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:underline">
                  <FileText size={16} className="text-muted" />
                  <div>
                    <div>{d.file_name}</div>
                    <div className="text-xs text-muted font-mono">{(d.size / 1024).toFixed(1)} KB · {new Date(d.created_at).toLocaleString()}</div>
                  </div>
                </a>
                <div className="flex items-center gap-3">
                  <StatusPill tone={STATUS_TONE[d.status] || 'muted'}>{d.status?.replace('_', ' ')}</StatusPill>
                  <button onClick={() => remove(d.id)} className="p-1.5 rounded border border-red-500/40 text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
      <p className="text-[11px] text-muted font-mono">Documents are private to the owner and never exposed publicly on the map.</p>
    </div>
  )
}
