import { useState } from 'react'

import { assistantApi } from '../api/api.js'

export default function ChatWidget() {
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState('')
  const [shops, setShops] = useState([])
  const [location, setLocation] = useState(null)
  const [busy, setBusy] = useState(false)

  async function send(event) {
    event.preventDefault()
    if (!message.trim() || busy) return
    setBusy(true)
    setReply('')
    try {
      const { data } = await assistantApi.chat(message, location || {})
      setReply(data.message)
      setShops(data.shops)
      setMessage('')
    } catch (error) {
      setReply(error.response?.data?.detail || 'Could not search shops. Please try again.')
      setShops([])
    } finally {
      setBusy(false)
    }
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setReply('Location is not available in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lon: coords.longitude })
        setReply('Location ready for nearby shop ranking.')
      },
      () => setReply('Location permission was denied. Ask for the fastest shop instead.'),
    )
  }

  return (
    <details className="fixed bottom-4 right-4 z-[1000] w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-slate-300 bg-white p-4 shadow-xl">
      <summary className="cursor-pointer font-semibold text-slate-900">Find a shop with QueueNear</summary>
      <form className="mt-3 flex gap-2" onSubmit={send}>
        <input
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="e.g. haircut under 250, fastest"
          maxLength={500}
        />
        <button className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={busy}>
          {busy ? '…' : 'Ask'}
        </button>
      </form>
      <button className="mt-2 text-xs font-medium text-blue-700" onClick={useLocation}>
        {location ? 'Location enabled' : 'Use my location for nearest results'}
      </button>
      {reply && <p className="mt-3 text-sm text-slate-700">{reply}</p>}
      {shops.length > 0 && (
        <ul className="mt-2 space-y-2">
          {shops.map((shop) => (
            <li key={shop.id} className="text-sm">
              <a className="font-medium text-blue-700" href={`/shops/${shop.id}`}>{shop.name}</a>
              <span className="text-slate-600"> · {shop.estimated_wait_min} min</span>
            </li>
          ))}
        </ul>
      )}
    </details>
  )
}
