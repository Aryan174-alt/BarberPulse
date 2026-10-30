import { useState } from 'react'
import { Link } from 'react-router-dom'

import { assistantApi } from '../api/api.js'

const QUICK_PROMPTS = [
  '⚡ Fastest haircut near me',
  '💰 Sasta haircut under ₹200',
  '🧔 Beard trim under ₹150',
  '🕒 Shortest wait right now',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Namaste! I can find barbers around Jaipur by wait time, price, or service. Type in English or Hinglish (e.g., "sasta haircut under 250").',
      shops: [],
    },
  ])
  const [location, setLocation] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSend(queryText) {
    const textToSend = (queryText || message).trim()
    if (!textToSend || busy) return

    const userEntry = { role: 'user', text: textToSend }
    setMessages((prev) => [...prev, userEntry])
    setMessage('')
    setBusy(true)

    try {
      const { data } = await assistantApi.chat(textToSend, location || {})
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.message || 'Here are the matching shops:',
          shops: data.shops || [],
          filters: data.filters || {},
        },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: error.response?.data?.detail || 'Could not find matching shops. Please try again.',
          shops: [],
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  function useLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lon: coords.longitude })
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: '📍 Location updated! Upcoming searches will rank nearest shops first.',
            shops: [],
          },
        ])
      },
      () => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'Location permission was denied. You can still ask for the fastest or cheapest shop.',
            shops: [],
          },
        ])
      },
    )
  }

  return (
    <aside aria-label="QueueNear Assistant" className="fixed bottom-5 right-5 z-[1000]">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2.5 rounded-full bg-[#10201d] px-5 py-3.5 text-sm font-bold text-white shadow-2xl shadow-emerald-950/40 ring-2 ring-amber-400/80 transition-all duration-200 hover:-translate-y-1 hover:bg-[#152a26] hover:shadow-emerald-900/50"
          aria-label="Open QueueNear Smart Assistant"
        >
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
          </span>
          <span className="text-amber-400">Ask Assistant</span>
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">AI</span>
        </button>
      )}

      {open && (
        <div className="flex h-[32rem] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25 ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-[#10201d] px-5 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-xl bg-amber-400 text-xs font-black text-[#10201d]">
                QN
              </span>
              <div>
                <h3 className="text-sm font-bold leading-tight text-white">QueueNear Assistant</h3>
                <p className="text-[11px] text-emerald-300">Natural search & Hinglish parser</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={useLocation}
                title={location ? 'Location active' : 'Enable device location'}
                className={`rounded-lg p-1.5 text-xs transition ${location ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
              >
                📍
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Close assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 ${
                    m.role === 'user'
                      ? 'bg-emerald-700 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                </div>

                {/* Returned Shop Cards */}
                {m.shops && m.shops.length > 0 && (
                  <div className="mt-2.5 w-full space-y-2">
                    {m.shops.slice(0, 4).map((shop) => (
                      <div
                        key={shop.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-[#fbfbfa] p-3 transition hover:border-emerald-300 hover:bg-white"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <Link
                            to={`/shops/${shop.id}`}
                            className="block truncate font-bold text-slate-900 hover:text-emerald-800"
                            onClick={() => setOpen(false)}
                          >
                            {shop.name}
                          </Link>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                            <span>⏱️ {shop.estimated_wait_min}m wait</span>
                            <span>•</span>
                            <span>👥 {shop.queue_length} ahead</span>
                            {shop.distance_km != null && (
                              <>
                                <span>•</span>
                                <span>{Number(shop.distance_km).toFixed(1)}km</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Link
                          to={`/shops/${shop.id}`}
                          onClick={() => setOpen(false)}
                          className="shrink-0 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-800"
                        >
                          Join
                        </Link>
                      </div>
                    ))}
                    {m.shops.length > 4 && (
                      <p className="text-center text-xs text-slate-500">
                        +{m.shops.length - 4} more shops available
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="size-2 animate-bounce rounded-full bg-emerald-600" />
                <span className="size-2 animate-bounce rounded-full bg-emerald-600 [animation-delay:0.2s]" />
                <span className="size-2 animate-bounce rounded-full bg-emerald-600 [animation-delay:0.4s]" />
                <span>Checking live queue and prices…</span>
              </div>
            )}
          </div>

          {/* Quick prompt chips */}
          <div className="border-t border-slate-100 bg-slate-50/80 px-3 py-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  disabled={busy}
                  className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. beard trim under 200..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              maxLength={400}
            />
            <button
              type="submit"
              disabled={!message.trim() || busy}
              className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-[#10201d] transition hover:bg-amber-300 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </aside>
  )
}
