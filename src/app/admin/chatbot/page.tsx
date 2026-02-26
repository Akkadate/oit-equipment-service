import { Navbar } from '@/components/shared/Navbar'
import { ChatbotEmbed } from './ChatbotEmbed'

export default function AdminChatbotPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 flex flex-col">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">OIT AssetLink Chatbot</h1>
          <p className="text-sm text-gray-500 mt-1">
            ทดสอบ AI Chatbot ของระบบ — ตอบคำถามเกี่ยวกับห้องเรียนและอุปกรณ์
          </p>
        </div>
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <ChatbotEmbed />
        </div>
      </main>
    </div>
  )
}
