'use client'

import { useRef, useState } from 'react'

interface Props {
  equipmentId: string
  onUploaded: (url: string) => void
}

export function PhotoCapture({ equipmentId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('equipment_id', equipmentId)

      const res = await fetch('/api/inspections/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'อัปโหลดไม่สำเร็จ')
        setPreview(null)
        return
      }
      const { photo_url } = await res.json()
      onUploaded(photo_url)
    } catch {
      setError('ไม่สามารถเชื่อมต่อได้')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="รูปอุปกรณ์" className="h-24 w-24 object-cover rounded-lg border" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">กำลังอัปโหลด...</span>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = '' }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
        >
          📷 ถ่ายรูปอุปกรณ์
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
