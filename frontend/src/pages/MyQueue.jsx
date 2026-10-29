import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { queueApi } from '../api/api.js'

export default function MyQueue() {
  const [entries, setEntries] = useState([])
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const { data } = await queueApi.mine()
      setEntries(data)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Sign in to see your queue.')
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, 8000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function cancel(id) {
    try {
      await queueApi.cancel(id)
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not cancel this entry.')
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-3xl font-bold text-slate-950">My queue</h1>
      {error && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">{error}</p>}
      {entries.length === 0 && !error && <p className="rounded-xl bg-white p-6 text-slate-600">You are not in an active queue. <Link className="text-blue-700" to="/">Find a shop</Link>.</p>}
      {entries.map((entry) => (
        <article className="rounded-xl bg-white p-5 shadow-sm" key={entry.id}>
          <h2 className="text-xl font-semibold text-slate-900">{entry.shop.name}</h2>
          <p className="mt-1 text-slate-600">{entry.service_name}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <p>Position: <strong>{entry.position || 'Now serving'}</strong></p>
            <p>Estimated wait: <strong>{entry.estimated_wait_min} min</strong></p>
            <p>Status: <strong className="capitalize">{entry.status.replace('_', ' ')}</strong></p>
          </div>
          {['waiting', 'called'].includes(entry.status) && (
            <button className="mt-4 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700" onClick={() => cancel(entry.id)}>
              Cancel queue entry
            </button>
          )}
        </article>
      ))}
    </section>
  )
}
