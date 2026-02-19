// Client-side only — do not import in Server Components or API routes

/**
 * Composites a QR code image with room info text into a single PNG data URL.
 * Uses the browser Canvas API.
 */
export async function createCompositeQR(
  qrDataUrl: string,
  roomCode: string,
  buildingName: string,
  campusName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const W = 400
      const QR_H = 400
      const TEXT_H = 96
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = QR_H + TEXT_H
      const ctx = canvas.getContext('2d')!

      // White background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, QR_H + TEXT_H)

      // Border
      ctx.strokeStyle = '#d1d5db'
      ctx.lineWidth = 1
      ctx.strokeRect(0.5, 0.5, W - 1, QR_H + TEXT_H - 1)

      // QR image
      ctx.drawImage(img, 0, 0, W, QR_H)

      // Divider line
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, QR_H, W, 1)

      // Room code (large, bold)
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 26px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`ห้อง ${roomCode}`, W / 2, QR_H + 34)

      // Building name
      ctx.fillStyle = '#4b5563'
      ctx.font = '15px sans-serif'
      ctx.fillText(buildingName, W / 2, QR_H + 58)

      // Campus name
      ctx.fillStyle = '#9ca3af'
      ctx.font = '13px sans-serif'
      ctx.fillText(campusName, W / 2, QR_H + 78)

      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = qrDataUrl
  })
}
