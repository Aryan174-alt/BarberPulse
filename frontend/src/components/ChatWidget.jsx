import { useState, useRef, useEffect } from 'react'
import { assistantApi } from '../api/api.js'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Greetings. I am your Barber Pulse concierge. How may I assist your grooming schedule today?',
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || busy) return

    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }])
    setBusy(true)

    try {
      const { data } = await assistantApi.chat(userMsg)
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: data.reply || data.response || 'I have noted your request.',
          shops: data.shops || [],
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Pardon me, our concierge service is momentarily indisposed. Please explore ateliers directly.',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full bg-primary text-secondary-fixed shadow-2xl flex items-center justify-center hover:scale-105 transition-transform duration-300 border border-secondary/40 cursor-pointer"
          aria-label="Open Concierge"
        >
          <span className="material-symbols-outlined text-2xl">chat_bubble</span>
        </button>
      )}

      {/* Concierge Window */}
      {open && (
        <div className="w-[360px] sm:w-[400px] h-[520px] rounded-3xl bg-surface-container-low border border-outline-variant/40 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-on-primary px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-base">support_agent</span>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold tracking-wide">
                  Atelier Concierge
                </h3>
                <p className="text-[10px] text-secondary-fixed uppercase tracking-widest">
                  Live Assistant
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-on-primary/70 hover:text-on-primary cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-primary text-secondary-fixed rounded-tr-none'
                      : 'bg-surface-container border border-outline-variant/30 text-on-surface rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>

                {/* Optional mini cards if concierge returns shops */}
                {m.shops?.length > 0 && (
                  <div className="mt-2 space-y-1.5 w-full">
                    {m.shops.map((s) => (
                      <a
                        key={s.id}
                        href={`/shops/${s.id}`}
                        className="block p-2 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface hover:border-secondary transition-colors"
                      >
                        <p className="font-bold text-[11px]">{s.name}</p>
                        <p className="text-[10px] text-on-surface-variant truncate">{s.address}</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-on-surface-variant text-[11px]">
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                <span>Concierge is deliberating...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-surface-container border-t border-outline-variant/20 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inquire about salons or wait times..."
              className="flex-1 bg-surface-container-lowest px-3 py-2 rounded-xl border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-secondary"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="p-2 rounded-xl bg-primary text-secondary-fixed disabled:opacity-50 hover:bg-primary-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
