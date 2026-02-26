'use client'

import Script from 'next/script'

export function ChatbotWidget() {
  return (
    <Script
      src="https://xulgyfceuxewnx4tlamchswh.agents.do-ai.run/static/chatbot/widget.js"
      strategy="lazyOnload"
      data-agent-id="12247678-12bd-11f1-b074-4e013e2ddde4"
      data-chatbot-id="WBLpeDR7NlXtlnspDXtulOy2vIV2kTIT"
      data-name="OIT AssetLink Service Chatbot"
      data-primary-color="#031B4E"
      data-secondary-color="#E5E8ED"
      data-button-background-color="#0061EB"
      data-starting-message="สวัสดีครับ! วันนี้ต้องการสอบถามข้อมูลเกี่ยวกับห้องเรียนส่วนไหนครับ?"
      data-logo="/static/chatbot/icons/default-agent.svg"
    />
  )
}
