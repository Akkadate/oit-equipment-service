'use client'

import Script from 'next/script'
import { useEffect } from 'react'

export function ChatbotEmbed() {
  // Try to auto-open the widget popup after it loads
  useEffect(() => {
    const tryOpen = (attempt = 0) => {
      if (attempt > 20) return // give up after 10 sec
      // The widget creates a button in the DOM — query common selectors
      const btn = document.querySelector<HTMLElement>(
        '[class*="chatbot-button"], [class*="chat-button"], [id*="chatbot"] button, [data-chatbot] button'
      )
      if (btn) {
        btn.click()
      } else {
        setTimeout(() => tryOpen(attempt + 1), 500)
      }
    }
    const timer = setTimeout(() => tryOpen(), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <Script
        src="https://xulgyfceuxewnx4tlamchswh.agents.do-ai.run/static/chatbot/widget.js"
        strategy="afterInteractive"
        data-agent-id="12247678-12bd-11f1-b074-4e013e2ddde4"
        data-chatbot-id="WBLpeDR7NlXtlnspDXtulOy2vIV2kTIT"
        data-name="OIT AssetLink Service Chatbot"
        data-primary-color="#031B4E"
        data-secondary-color="#E5E8ED"
        data-button-background-color="#0061EB"
        data-starting-message="สวัสดีครับ! วันนี้ต้องการสอบถามข้อมูลเกี่ยวกับห้องเรียนส่วนไหนครับ?"
        data-logo="/static/chatbot/icons/default-agent.svg"
      />

      {/* Background hint while widget loads */}
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] gap-5 text-center px-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-xl shadow-blue-200">
          <span className="text-4xl">🤖</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">OIT AssetLink Chatbot</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            หน้าต่าง Chatbot จะเปิดขึ้นอัตโนมัติ
            <br />
            หรือคลิกปุ่ม <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold mx-0.5">💬</span> ที่มุมขวาล่างของหน้าจอ
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
          กำลังโหลด AI Agent...
        </div>
        <p className="text-xs text-gray-300">Powered by DigitalOcean AI Agents</p>
      </div>
    </>
  )
}
