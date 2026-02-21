// Client-side only — do not import in Server Components or API routes

async function loadPromptFont(): Promise<void> {
  if (!document.getElementById('qr-prompt-font')) {
    const link = document.createElement('link')
    link.id = 'qr-prompt-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700&display=swap'
    document.head.appendChild(link)
  }
  await document.fonts.ready
  await Promise.all([
    document.fonts.load('16px Prompt'),
    document.fonts.load('bold 16px Prompt'),
  ])
}

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
  await loadPromptFont()

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const W = 400
      const TOP_H = 46   // header: "NBU | OIT AssetLink"
      const QR_H = 400
      const TEXT_H = 96
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = TOP_H + QR_H + TEXT_H
      const ctx = canvas.getContext('2d')!

      // White background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, TOP_H + QR_H + TEXT_H)

      // Border
      ctx.strokeStyle = '#d1d5db'
      ctx.lineWidth = 1
      ctx.strokeRect(0.5, 0.5, W - 1, TOP_H + QR_H + TEXT_H - 1)

      // ── Header ──
      ctx.fillStyle = '#f1f5f9'
      ctx.fillRect(0, 0, W, TOP_H)

      // Blue left accent bar
      ctx.fillStyle = '#2563eb'
      ctx.fillRect(0, 0, 5, TOP_H)

      // Header text
      ctx.fillStyle = '#1e3a5f'
      ctx.font = '600 15px "Prompt", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('NBU | OIT AssetLink', W / 2, TOP_H / 2 + 6)

      // Divider below header
      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(0, TOP_H, W, 1)

      // ── QR image ──
      ctx.drawImage(img, 0, TOP_H, W, QR_H)

      // Divider above text
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, TOP_H + QR_H, W, 1)

      const base = TOP_H + QR_H

      // Room code (large, bold)
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 26px "Prompt", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`ห้อง ${roomCode}`, W / 2, base + 34)

      // Building name
      ctx.fillStyle = '#4b5563'
      ctx.font = '15px "Prompt", sans-serif'
      ctx.fillText(buildingName, W / 2, base + 58)

      // Campus name
      ctx.fillStyle = '#9ca3af'
      ctx.font = '13px "Prompt", sans-serif'
      ctx.fillText(campusName, W / 2, base + 78)

      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = qrDataUrl
  })
}
