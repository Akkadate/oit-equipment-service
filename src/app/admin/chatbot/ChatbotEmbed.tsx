'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTING_MESSAGE = 'สวัสดีครับ! ผมคือ AI Assistant ของ OIT AssetLink ยินดีช่วยตอบคำถามเกี่ยวกับห้องเรียน อุปกรณ์ และการแจ้งซ่อมครับ'

export function ChatbotEmbed() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: STARTING_MESSAGE },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [configured, setConfigured] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setError('')
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 503) setConfigured(false)
        setError(data.error ?? 'เกิดข้อผิดพลาด')
        return
      }

      const reply = data.choices?.[0]?.message?.content ?? '(ไม่มีคำตอบ)'
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setError('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!configured) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] gap-4 px-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 text-lg">ยังไม่ได้ตั้งค่า Agent</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            กรุณาเพิ่ม environment variables ใน <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.env</code>
          </p>
        </div>
        <div className="bg-gray-900 text-gray-100 text-xs font-mono rounded-xl px-5 py-4 text-left w-full max-w-sm">
          <p className="text-gray-400 mb-1"># DigitalOcean AI Agent</p>
          <p>DO_AGENT_ENDPOINT=https://xulgyfceuxewnx4tlamchswh.agents.do-ai.run</p>
          <p className="text-yellow-400 mt-1">DO_AGENT_ACCESS_KEY=your_access_key_here</p>
        </div>
        <p className="text-xs text-gray-400">
          สร้าง Access Key ได้ที่ DigitalOcean Control Panel →<br />
          Agent Platform → [agent] → Settings → Endpoint Access Keys
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-sm flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">OIT AssetLink AI</p>
          <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            พร้อมใช้งาน
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMessages([{ role: 'assistant', content: STARTING_MESSAGE }])}
          className="ml-auto text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-white transition-colors"
        >
          เริ่มใหม่
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              msg.role === 'assistant'
                ? 'bg-gradient-to-br from-blue-600 to-blue-500'
                : 'bg-gradient-to-br from-violet-500 to-blue-500'
            }`}>
              {msg.role === 'assistant'
                ? <Bot className="w-4 h-4 text-white" />
                : <User className="w-4 h-4 text-white" />
              }
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'assistant'
                ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
                : 'bg-blue-600 text-white rounded-tr-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading bubble */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-400">กำลังคิด...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 px-4 py-3 bg-white rounded-b-2xl">
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-shadow">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์ข้อความ... (Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none min-h-[24px] max-h-32"
            disabled={loading}
            autoFocus
          />
          <button
            type="button"
            title="ส่งข้อความ"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <Send className="w-4 h-4 text-white disabled:text-gray-400" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          AI อาจให้ข้อมูลที่ไม่ถูกต้อง กรุณาตรวจสอบก่อนนำไปใช้
        </p>
      </div>
    </div>
  )
}
