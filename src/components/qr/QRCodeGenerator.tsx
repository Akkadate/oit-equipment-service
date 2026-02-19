'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  roomId: string
  roomCode: string
  buildingName: string
  campusName: string
}

export function QRCodeGenerator({ roomId, roomCode, buildingName, campusName }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadQR() {
    setLoading(true)
    const res = await fetch(`/api/rooms/${roomId}/qr`)
    const data = await res.json()
    setQrDataUrl(data.dataUrl)
    setLoading(false)
  }

  function downloadQR() {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `QR-${roomCode}.png`
    a.click()
  }

  function printQR() {
    if (!qrDataUrl) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>QR Code - ${roomCode}</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 40px; }
        img { width: 300px; height: 300px; }
        h2 { margin: 16px 0 4px; font-size: 20px; }
        p { color: #666; font-size: 14px; margin: 4px 0; }
      </style></head>
      <body>
        <img src="${qrDataUrl}" alt="QR Code" />
        <h2>ห้อง ${roomCode}</h2>
        <p>${buildingName}</p>
        <p>${campusName}</p>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body></html>
    `)
  }

  return (
    <div className="space-y-3">
      {!qrDataUrl ? (
        <Button onClick={loadQR} disabled={loading} variant="outline" size="sm">
          {loading ? 'กำลังโหลด...' : 'แสดง QR Code'}
        </Button>
      ) : (
        <div className="space-y-3">
          <img src={qrDataUrl} alt="QR Code" className="w-40 h-40 border rounded" />
          <div className="flex gap-2">
            <Button onClick={downloadQR} variant="outline" size="sm">
              ดาวน์โหลด PNG
            </Button>
            <Button onClick={printQR} variant="outline" size="sm">
              พิมพ์ QR
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
