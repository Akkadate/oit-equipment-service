'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createCompositeQR } from '@/lib/qr-canvas'

interface Props {
  roomId: string
  roomCode: string
  buildingName: string
  campusName: string
}

export function QRCodeGenerator({ roomId, roomCode, buildingName, campusName }: Props) {
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadQR() {
    setLoading(true)
    try {
      const res = await fetch(`/api/rooms/${roomId}/qr`)
      const data = await res.json()
      const composite = await createCompositeQR(data.dataUrl, roomCode, buildingName, campusName)
      setCompositeUrl(composite)
    } finally {
      setLoading(false)
    }
  }

  function downloadQR() {
    if (!compositeUrl) return
    const a = document.createElement('a')
    a.href = compositeUrl
    a.download = `QR-${roomCode}.png`
    a.click()
  }

  function printQR() {
    if (!compositeUrl) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>QR Code - ห้อง ${roomCode}</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 40px; margin: 0; }
        img { width: 280px; height: auto; }
      </style></head>
      <body>
        <img src="${compositeUrl}" alt="QR Code ห้อง ${roomCode}" />
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body></html>
    `)
  }

  return (
    <div className="space-y-3">
      {!compositeUrl ? (
        <Button onClick={loadQR} disabled={loading} variant="outline" size="sm">
          {loading ? 'กำลังโหลด...' : 'แสดง QR Code'}
        </Button>
      ) : (
        <div className="space-y-2">
          <img src={compositeUrl} alt={`QR Code ห้อง ${roomCode}`} className="w-36 h-auto border rounded" />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={downloadQR} variant="outline" size="sm">
              ดาวน์โหลด
            </Button>
            <Button onClick={printQR} variant="outline" size="sm">
              พิมพ์
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
