import { useCallback, useEffect, useState } from 'react'

import { queueApi, shopsApi } from '../api/api.js'

function generateSimpleQRDataURL(url) {
  // Generate an embeddable Google Charts QR code or inline SVG for instant crisp display
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(url)}`
}

function GracePeriodTimer({ calledAt }) {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    function calculate() {
      if (!calledAt) return
      const elapsed = Math.floor((Date.now() - new Date(calledAt).getTime()) / 1000)
      const remaining = Math.max(0, 300 - elapsed)
      setSecondsLeft(remaining)
    }
    calculate()
    const timer = setInterval(calculate, 1000)
    return () => clearInterval(timer)
  }, [calledAt])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const isExpiring = secondsLeft < 60

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
        secondsLeft === 0
          ? 'bg-rose-100 text-rose-800'
          : isExpiring
          ? 'bg-amber-100 text-amber-900 animate-pulse'
          : 'bg-emerald-50 text-emerald-800'
      }`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {secondsLeft === 0
        ? 'Grace period expired'
        : `Auto no-show: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
    </span>
  )
}

export default function OwnerDashboard() {
  const [shop, setShop] = useState(null)
  const [shopDetails, setShopDetails] = useState(null)
  const [entries, setEntries] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showQRModal, setShowQRModal] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Quick Walk-In Form State
  const [walkInName, setWalkInName] = useState('')
  const [walkInServiceId, setWalkInServiceId] = useState('')
  const [addingWalkIn, setAddingWalkIn] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [shopResponse, queueResponse] = await Promise.all([
        queueApi.ownerShop(),
        queueApi.ownerQueue(),
      ])
      setShop(shopResponse.data)
      setEntries(queueResponse.data)
      setError('')

      if (shopResponse.data?.id && !shopDetails) {
        const { data } = await shopsApi.detail(shopResponse.data.id)
        setShopDetails(data)
        if (data.services?.length > 0 && !walkInServiceId) {
          setWalkInServiceId(String(data.services[0].id))
        }
      }
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Sign in with an owner account linked to a shop.')
    }
  }, [shopDetails, walkInServiceId])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, 8000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function act(id, action) {
    try {
      await queueApi.ownerAction(id, action)
      setSuccess(`Action '${action}' completed.`)
      setTimeout(() => setSuccess(''), 3000)
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || `Could not ${action} this queue entry.`)
    }
  }

  async function toggleShop() {
    if (!shop) return
    try {
      await queueApi.updateOwnerShop({ is_closed_override: shop.is_open })
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not update shop status.')
    }
  }

  async function handleAddWalkIn(e) {
    e.preventDefault()
    if (!walkInName.trim() || !shop) return
    setAddingWalkIn(true)
    setError('')
    try {
      await shopsApi.walkIn(shop.id, {
        name: walkInName.trim(),
        service_id: walkInServiceId ? Number(walkInServiceId) : undefined,
      })
      setWalkInName('')
      setSuccess(`Added walk-in: ${walkInName.trim()}`)
      setTimeout(() => setSuccess(''), 3000)
      await refresh()
    } catch (err) {
      setError(err.response?.data?.name?.[0] || err.response?.data?.detail || 'Could not add walk-in.')
    } finally {
      setAddingWalkIn(false)
    }
  }

  const joinUrl = shop ? `${window.location.origin}/join/${shop.id}` : ''

  function copyJoinLink() {
    navigator.clipboard.writeText(joinUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const waitingCount = entries.filter((e) => e.status === 'waiting').length
  const calledCount = entries.filter((e) => e.status === 'called').length
  const inServiceCount = entries.filter((e) => e.status === 'in_service').length

  return (
    <section className="mx-auto max-w-5xl space-y-7">
      {/* Top Banner */}
      <header className="overflow-hidden rounded-3xl bg-[#10201d] p-6 text-white shadow-xl shadow-emerald-950/20 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-400 px-2 py-0.5 text-xs font-black uppercase text-[#10201d]">
                Owner Console
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${shop?.is_open ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                <span className="size-1.5 rounded-full bg-current" />
                {shop?.is_open ? 'Shop Open' : 'Shop Closed'}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight">{shop?.name || 'Owner Dashboard'}</h1>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">Manage queue flow, call next customers, and print counter QR</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {shop && (
              <>
                <button
                  onClick={() => setShowQRModal(true)}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  📱 Walk-In QR Code
                </button>
                <button
                  onClick={toggleShop}
                  className={`rounded-full px-5 py-2.5 text-xs font-bold transition ${
                    shop.is_open
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {shop.is_open ? 'Override: Close Shop' : 'Open Shop'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Counters */}
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
          <div className="rounded-2xl bg-white/[0.06] p-4 text-center">
            <p className="text-2xl font-black text-white">{waitingCount}</p>
            <p className="text-xs text-slate-300">Waiting in line</p>
          </div>
          <div className="rounded-2xl bg-white/[0.06] p-4 text-center">
            <p className="text-2xl font-black text-amber-300">{calledCount}</p>
            <p className="text-xs text-slate-300">Called (in grace)</p>
          </div>
          <div className="rounded-2xl bg-white/[0.06] p-4 text-center">
            <p className="text-2xl font-black text-emerald-300">{inServiceCount}</p>
            <p className="text-xs text-slate-300">In chair / service</p>
          </div>
        </div>
      </header>

      {/* Alerts */}
      {error && <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900 border border-amber-200" role="alert">{error}</p>}
      {success && <p className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 border border-emerald-200">{success}</p>}

      {/* Quick Walk-In Enqueue Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">Quick Walk-In Entry (Counter)</h2>
        <form onSubmit={handleAddWalkIn} className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Customer name (e.g. Ramesh)"
            value={walkInName}
            onChange={(e) => setWalkInName(e.target.value)}
            className="flex-1 min-w-[200px] rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            required
          />
          {shopDetails?.services && (
            <select
              value={walkInServiceId}
              onChange={(e) => setWalkInServiceId(e.target.value)}
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              {shopDetails.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.minutes}m - ₹{s.price})
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            disabled={addingWalkIn || !walkInName.trim()}
            className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {addingWalkIn ? 'Adding…' : '+ Add to Queue'}
          </button>
        </form>
      </div>

      {/* Active Queue List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950">Active Queue ({entries.length})</h2>
          <span className="text-xs font-semibold text-slate-500">Auto-refreshes every 8 seconds</span>
        </div>

        {entries.length === 0 && !error && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-xl">✂️</span>
            <h3 className="mt-3 text-lg font-bold text-slate-900">Your queue is clear</h3>
            <p className="mt-1 text-sm text-slate-500">No customers are currently waiting. Walk-ins can scan your QR code.</p>
          </div>
        )}

        <ul className="space-y-3">
          {entries.map((entry) => {
            const isWaiting = entry.status === 'waiting'
            const isCalled = entry.status === 'called'
            const isInService = entry.status === 'in_service'

            return (
              <li
                key={entry.id}
                className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm transition duration-150 ${
                  isCalled
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : isInService
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`grid size-11 place-items-center rounded-2xl font-black text-sm ${
                      isCalled
                        ? 'bg-amber-400 text-[#10201d]'
                        : isInService
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    #{entry.position || '★'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-950">{entry.customer_name}</h3>
                      {entry.walk_in_name && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          Walk-in
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {entry.service_name} · Joined {new Date(entry.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {isCalled && entry.called_at && (
                      <div className="mt-2">
                        <GracePeriodTimer calledAt={entry.called_at} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Owner Actions */}
                <div className="flex items-center gap-2">
                  {isWaiting && (
                    <button
                      onClick={() => act(entry.id, 'call')}
                      disabled={entry.position !== 1}
                      className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-[#10201d] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {entry.position === 1 ? '📢 Call Next' : `Wait (#${entry.position})`}
                    </button>
                  )}

                  {isCalled && (
                    <>
                      <button
                        onClick={() => act(entry.id, 'no-show')}
                        className="rounded-xl border border-rose-300 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                      >
                        Mark No-Show
                      </button>
                      <button
                        onClick={() => act(entry.id, 'start')}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                      >
                        💺 Start Service
                      </button>
                    </>
                  )}

                  {isInService && (
                    <button
                      onClick={() => act(entry.id, 'done')}
                      className="rounded-xl bg-blue-700 px-5 py-2 text-xs font-bold text-white transition hover:bg-blue-800"
                    >
                      ✓ Complete Service
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* QR Code Modal for Counter Printing */}
      {showQRModal && shop && (
        <div className="fixed inset-0 z-[1200] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Counter Display</span>
              <button onClick={() => setShowQRModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <h3 className="text-xl font-black text-slate-950">{shop.name}</h3>
            <p className="mt-1 text-xs text-slate-500">Scan to join the live queue instantly</p>

            <div className="my-5 flex justify-center">
              <div className="rounded-2xl border-4 border-slate-900 p-2 shadow-inner">
                <img
                  src={generateSimpleQRDataURL(joinUrl)}
                  alt="Shop QR Code"
                  className="size-48 rounded-lg"
                />
              </div>
            </div>

            <p className="text-xs font-mono text-slate-600 truncate bg-slate-100 p-2 rounded-lg">
              {joinUrl}
            </p>

            <div className="mt-5 flex gap-2">
              <button
                onClick={copyJoinLink}
                className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Print Sign
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
