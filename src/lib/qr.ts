import QRCode from 'qrcode'

export function getQRUrl(qrToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/scan/${qrToken}`
}

export async function generateQRDataURL(qrToken: string): Promise<string> {
  const url = getQRUrl(qrToken)
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  })
}

export async function generateQRSVG(qrToken: string): Promise<string> {
  const url = getQRUrl(qrToken)
  return QRCode.toString(url, { type: 'svg', margin: 2 })
}
