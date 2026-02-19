// Telegram Bot Notification
export async function sendTelegramNotify(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || token === 'your_bot_token_here') return
  if (!chatId || chatId === 'your_chat_id_here') return

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  })
}

export function buildRepairNotifyMessage(data: {
  roomCode: string
  buildingName: string
  campusName: string
  equipmentName: string
  assetCode: string
  reportedBy: string
  reporterPhone?: string
  description: string
}): string {
  return [
    '🔧 <b>มีแจ้งซ่อมอุปกรณ์ใหม่</b>',
    `📍 ${data.campusName} · ${data.buildingName} · ห้อง ${data.roomCode}`,
    `🖥 ${data.equipmentName} (<code>${data.assetCode}</code>)`,
    `📝 ${data.description}`,
    `👤 ${data.reportedBy}${data.reporterPhone ? ` · ${data.reporterPhone}` : ''}`,
  ].join('\n')
}
