import { NextRequest, NextResponse } from 'next/server'

const AGENT_ENDPOINT = process.env.DO_AGENT_ENDPOINT // e.g. https://xulgyfceuxewnx4tlamchswh.agents.do-ai.run
const AGENT_ACCESS_KEY = process.env.DO_AGENT_ACCESS_KEY

export async function POST(req: NextRequest) {
  if (!AGENT_ENDPOINT || !AGENT_ACCESS_KEY) {
    return NextResponse.json(
      { error: 'Agent endpoint not configured. Set DO_AGENT_ENDPOINT and DO_AGENT_ACCESS_KEY in .env' },
      { status: 503 }
    )
  }

  const body = await req.json()
  const { messages } = body

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 })
  }

  try {
    const res = await fetch(`${AGENT_ENDPOINT}/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AGENT_ACCESS_KEY}`,
      },
      body: JSON.stringify({
        messages,
        stream: false,
        include_retrieval_info: true,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Agent error: ${res.status} ${text}` }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
