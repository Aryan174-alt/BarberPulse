import { useCallback, useEffect, useState } from 'react'

import { queueApi } from '../api/api.js'

export default function OwnerDashboard() {
  const [shop, setShop] = useState(null)
  const [entries, setEntries] = useState([])
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const [shopResponse, queueResponse] = await Promise.all([queueApi.ownerShop(), queueApi.ownerQueue()])
      setShop(shopResponse.data)
      setEntries(queueResponse.data)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Sign in with an owner account linked to a shop.')
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, 8000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function act(id, action) {
    try {
      await queueApi.ownerAction(id, action)
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || `Could not ${action} this queue entry.`)
    }
  }

  async function toggleShop() {
    try {
      await queueApi.updateOwnerShop({ is_closed_override: shop.is_open })
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not update shop status.')
    }
  }

  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Owner dashboard</h1>
          {shop && <p className="mt-1 text-slate-600">{shop.name}</p>}
        </div>
        {shop && (
          <button className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white" onClick={toggleShop}>
            {shop.is_open ? 'Close shop' : 'Open shop'}
          </button>
        )}
      </header>
      {error && <p className="rounded-lg bg-amber-50 p-3 text-amber-900" role="alert">{error}</p>}
      {entries.length === 0 && !error && <p className="rounded-xl bg-white p-5 text-slate-600">No active customers in the queue.</p>}
      <ul className="space-y-3">
        {entries.map((entry) => {
          const action = entry.status === 'waiting' ? 'call' : entry.status === 'called' ? 'start' : 'done'
          const label = { call: 'Call next', start: 'Start service', done: 'Done' }[action]
          return (
            <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm" key={entry.id}>
              <div>
                <h2 className="font-semibold text-slate-900">{entry.customer_name}</h2>
                <p className="text-sm text-slate-600">{entry.service_name} · <span className="capitalize">{entry.status.replace('_', ' ')}</span></p>
              </div>
              <div className="flex gap-2">
                {entry.status === 'called' && <button className="rounded-lg border border-amber-300 px-3 py-2 text-sm text-amber-800" onClick={() => act(entry.id, 'no-show')}>No-show</button>}
                {(entry.status !== 'waiting' || entry.position === 1) && (
                  <button className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white" onClick={() => act(entry.id, action)}>{label}</button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
