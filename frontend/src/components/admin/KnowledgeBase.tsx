import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Database, RefreshCw, CheckCircle2, AlertCircle,
  Trash2, Search, FileText, Layers, Upload, X,
} from 'lucide-react'
import { knowledgeApi } from '../../services/api'
import type { KnowledgeBlob, IngestionResult } from '../../types'

const ACCEPTED = '.pdf,.docx,.doc,.md,.txt,.xlsx,.xls'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fileExt(name: string): string {
  return name.includes('.') ? name.split('.').pop()!.toUpperCase() : 'FILE'
}

interface UploadState {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  message?: string
  chunks?: number
}

export default function KnowledgeBase() {
  const [blobs, setBlobs] = useState<KnowledgeBlob[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [syncing, setSyncing] = useState<Set<string>>(new Set())
  const [syncingAll, setSyncingAll] = useState(false)
  const [lastResult, setLastResult] = useState<IngestionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploads, setUploads] = useState<UploadState[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await knowledgeApi.listBlobs()
      setBlobs(data)
    } catch {
      setError('Failed to load knowledge base files.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSyncAll = async () => {
    setSyncingAll(true)
    setLastResult(null)
    setError(null)
    try {
      const { data } = await knowledgeApi.ingestAll()
      setLastResult(data)
      await load()
    } catch {
      setError('Sync failed. Check server logs.')
    } finally {
      setSyncingAll(false)
    }
  }

  const handleSyncOne = async (blobName: string) => {
    setSyncing((s) => new Set(s).add(blobName))
    setError(null)
    try {
      await knowledgeApi.ingestBlob(blobName)
      await load()
    } catch {
      setError(`Failed to sync "${blobName}".`)
    } finally {
      setSyncing((s) => { const n = new Set(s); n.delete(blobName); return n })
    }
  }

  const handleDelete = async (blobName: string) => {
    if (!confirm(`Remove "${blobName}" from the index?`)) return
    setSyncing((s) => new Set(s).add(blobName))
    try {
      await knowledgeApi.deleteBlob(blobName)
      await load()
    } catch {
      setError(`Failed to remove "${blobName}" from index.`)
    } finally {
      setSyncing((s) => { const n = new Set(s); n.delete(blobName); return n })
    }
  }

  const uploadFile = async (file: File, idx: number) => {
    setUploads((prev) => prev.map((u, i) => i === idx ? { ...u, status: 'uploading' } : u))
    try {
      const { data } = await knowledgeApi.uploadBlob(file)
      setUploads((prev) =>
        prev.map((u, i) => i === idx ? { ...u, status: 'done', chunks: data.chunks, message: `${data.chunks} chunks indexed` } : u)
      )
      await load()
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'Upload failed'
      setUploads((prev) => prev.map((u, i) => i === idx ? { ...u, status: 'error', message: msg } : u))
    }
  }

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files)
    const newUploads: UploadState[] = arr.map((f) => ({ file: f, status: 'pending' }))
    setUploads((prev) => {
      const startIdx = prev.length
      const next = [...prev, ...newUploads]
      // kick off uploads
      arr.forEach((f, i) => uploadFile(f, startIdx + i))
      return next
    })
  }

  const filtered = blobs.filter(
    (b) => !search || b.blob_name.toLowerCase().includes(search.toLowerCase())
  )

  const totalChunks = blobs.reduce((s, b) => s + b.chunks, 0)
  const indexedCount = blobs.filter((b) => b.indexed).length
  const activeUploads = uploads.filter((u) => u.status !== 'done')

  return (
    <div className="max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Knowledge Base</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleSyncAll}
            disabled={syncingAll || loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <RefreshCw size={13} className={syncingAll ? 'animate-spin' : ''} />
            {syncingAll ? 'Syncing…' : 'Sync All'}
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl px-6 py-8 text-center cursor-pointer transition-all ${
          dragging ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <Upload size={22} className={`mx-auto mb-2 ${dragging ? 'text-primary-500' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700">
          Drop files here or <span className="text-primary-600 underline underline-offset-2">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX, MD, TXT — auto-indexed after upload</p>
      </div>

      {/* Upload progress */}
      {activeUploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${
              u.status === 'error' ? 'bg-red-50 border-red-200' :
              u.status === 'done' ? 'bg-green-50 border-green-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <FileText size={14} className="text-gray-400 shrink-0" />
              <span className="flex-1 text-gray-700 truncate">{u.file.name}</span>
              {u.status === 'uploading' && (
                <RefreshCw size={13} className="animate-spin text-primary-500 shrink-0" />
              )}
              {u.status === 'done' && (
                <span className="text-xs text-green-700 shrink-0">{u.message}</span>
              )}
              {u.status === 'error' && (
                <span className="text-xs text-red-600 shrink-0">{u.message}</span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setUploads((prev) => prev.filter((_, j) => j !== i)) }}
                className="text-gray-300 hover:text-gray-500 shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Result / error banners */}
      {lastResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          Synced {lastResult.indexed_files}/{lastResult.total_files} files — {lastResult.total_chunks.toLocaleString()} total chunks indexed.
          {lastResult.errors.length > 0 && (
            <span className="ml-1 text-orange-700"> {lastResult.errors.length} error(s).</span>
          )}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-3"><X size={13} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Total chunks</p>
          <p className="text-2xl font-bold text-gray-900">{totalChunks.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Files in storage</p>
          <p className="text-2xl font-bold text-gray-900">{blobs.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Indexed files</p>
          <p className="text-2xl font-bold text-gray-900">{indexedCount}</p>
        </div>
      </div>

      {/* File table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw size={18} className="animate-spin mr-2" />
            Loading files…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <Database size={28} className="opacity-40" />
            <p className="text-sm">{search ? 'No files match your search.' : 'No supported files found. Upload a file above to get started.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((b) => {
              const isBusy = syncing.has(b.blob_name)
              const filename = b.blob_name.includes('/') ? b.blob_name.split('/').pop()! : b.blob_name
              return (
                <div key={b.blob_name} className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={15} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{filename}</p>
                    <p className="text-xs text-gray-400 truncate">{b.blob_name} · {formatBytes(b.size)} · {formatDate(b.last_modified)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 min-w-[80px] shrink-0">
                    <Layers size={13} className="text-gray-400" />
                    <span className="font-medium">{b.chunks.toLocaleString()}</span>
                    <span className="text-xs text-gray-400">chunks</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 shrink-0">
                    {fileExt(b.blob_name)}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-[80px] shrink-0">
                    {b.indexed ? (
                      <><CheckCircle2 size={13} className="text-green-500" /><span className="text-xs font-medium text-green-600">Indexed</span></>
                    ) : (
                      <><AlertCircle size={13} className="text-orange-400" /><span className="text-xs font-medium text-orange-500">Not indexed</span></>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleSyncOne(b.blob_name)}
                      disabled={isBusy || syncingAll}
                      title="Sync this file"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 transition-colors"
                    >
                      <RefreshCw size={13} className={isBusy ? 'animate-spin' : ''} />
                    </button>
                    <button
                      onClick={() => handleDelete(b.blob_name)}
                      disabled={isBusy || !b.indexed}
                      title="Remove from index"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
