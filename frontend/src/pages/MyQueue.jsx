import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { queueApi } from '../api/api.js'

function playChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15) // A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
  } catch {
    // Audio context may be restricted by autoplay policy
  }
}

export default function MyQueue() {
  const [entries, setEntries] = useState([])
  const [error, setError] = useState('')
  const prevStatusRef = useRef({})

  const refresh = useCallback(async () => {
    try {
      const { data } = await queueApi.mine()
      setEntries(data)
      setError('')

      // Check if status transitioned to 'called'
      data.forEach((entry) => {
        const prev = prevStatusRef.current[entry.id]
        if (prev && prev !== 'called' && entry.status === 'called') {
          playChime()
        }
        prevStatusRef.current[entry.id] = entry.status
      })
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
    if (!window.confirm('Are you sure you want to leave this queue?')) return
    try {
      await queueApi.cancel(id)
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not cancel this entry.')
    }
  }

  const steps = [
    { key: 'waiting', label: 'In Queue' },
    { key: 'called', label: 'Called (Turn Now)' },
    { key: 'in_service', label: 'In Chair' },
    { key: 'done', label: 'Completed' },
  ]

  function getStepIndex(status) {
    switch (status) {
      case 'waiting':
        return 0
      case 'called':
        return 1
      case 'in_service':
        return 2
      case 'done':
        return 3
      default:
        return 0
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">My Queue Status</h1>
          <p className="mt-1 text-sm text-slate-500">Live ticket updates every 8 seconds</p>
        </div>
        <button
          onClick={refresh}
          className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          🔄 Refresh
        </button>
      </div>

      {error && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</p>}

      {entries.length === 0 && !error && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-2xl">🎟️</span>
          <h2 className="mt-4 text-xl font-black text-slate-950">No Active Queue Tickets</h2>
          <p className="mt-2 text-sm text-slate-500">
            You are currently not waiting in any barber queue. Browse nearby shops to join.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-800"
            >
              Explore Nearby Shops →
            </Link>
          </div>
        </div>
      )}

      {entries.map((entry) => {
        const stepIdx = getStepIndex(entry.status)
        const isCalled = entry.status === 'called'

        return (
          <article
            key={entry.id}
            className={`overflow-hidden rounded-3xl border bg-white shadow-md transition duration-200 ${
              isCalled
                ? 'border-amber-400 ring-4 ring-amber-100'
                : 'border-slate-200/80'
            }`}
          >
            {/* Urgent Call Alert Banner */}
            {isCalled && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 px-6 py-3 text-[#10201d]">
                <span className="text-xl animate-bounce">📢</span>
                <div>
                  <p className="text-sm font-black uppercase tracking-wider">It's your turn!</p>
                  <p className="text-xs font-semibold">Please head inside the shop now. Your barber is ready.</p>
                </div>
              </div>
            )}

            <div className="p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black uppercase text-emerald-800">
                    Active Ticket
                  </span>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{entry.shop.name}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">{entry.service_name}</p>
                </div>

                <div className="rounded-2xl bg-[#f7f8f5] px-5 py-3 text-right">
                  <p className="text-xs font-semibold text-slate-500">Queue Position</p>
                  <p className="text-3xl font-black text-slate-950">
                    {entry.position ? `#${entry.position}` : 'Now'}
                  </p>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="mt-7">
                <div className="grid grid-cols-4 gap-2">
                  {steps.map((st, i) => {
                    const isPassed = i <= stepIdx
                    const isCurrent = i === stepIdx
                    return (
                      <div key={st.key} className="text-center">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isPassed ? (isCalled ? 'bg-amber-400' : 'bg-emerald-600') : 'bg-slate-100'
                          }`}
                        />
                        <p
                          className={`mt-2 text-[11px] font-bold ${
                            isCurrent
                              ? 'text-slate-950 font-black'
                              : isPassed
                              ? 'text-slate-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {st.label}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mt-6 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-[#f7f8f5] py-4 text-center">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Wait Ahead</p>
                  <p className="mt-0.5 text-xl font-black text-slate-950">{entry.estimated_wait_min}m</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Joined At</p>
                  <p className="mt-0.5 text-base font-bold text-slate-900">
                    {new Date(entry.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Status</p>
                  <p className="mt-0.5 text-base font-bold capitalize text-emerald-800">
                    {entry.status.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <div className="flex gap-2">
                  {entry.shop.phone && (
                    <a
                      href={`tel:${entry.shop.phone}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      📞 Call Shop
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entry.shop.name + ' ' + entry.shop.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    🗺️ Directions
                  </a>
                </div>

                {['waiting', 'called'].includes(entry.status) && (
                  <button
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                    onClick={() => cancel(entry.id)}
                  >
                    Leave Queue
                  </button>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
