import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { queueApi } from '../api/api.js'

export default function QueueTracker() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const fetchQueue = useCallback(async () => {
    try {
      const { data } = await queueApi.mine()
      setEntries(Array.isArray(data) ? data : data?.results || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to refresh queue status.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 5000)
    return () => clearInterval(interval)
  }, [fetchQueue])

  async function handleCancel(entryId) {
    if (!window.confirm('Are you sure you wish to cancel this appointment slot?')) return
    setBusyId(entryId)
    try {
      await queueApi.cancel(entryId)
      fetchQueue()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel appointment.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-secondary animate-spin">progress_activity</span>
        <p className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
          Synchronizing Live Queue...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-secondary block mb-1">
            Real-Time Sessions
          </span>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            My Active Queue Tracker
          </h1>
        </div>
        <button
          onClick={fetchQueue}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-semibold uppercase tracking-wider text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/20 text-error text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-12 text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-secondary">hourglass_empty</span>
          <h3 className="font-display text-xl font-bold text-on-surface">No Active Reservations</h3>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            You are not currently in any atelier queues. Discover premier salons near you and reserve your spot effortlessly.
          </p>
          <div className="pt-2">
            <Link
              to="/salons"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-secondary-fixed text-xs uppercase font-bold tracking-widest hover:bg-primary-container transition-all"
            >
              <span>Explore Salons</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => {
            const isServing = entry.status === 'serving'
            const isWaiting = entry.status === 'waiting'
            return (
              <div
                key={entry.id}
                className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full mb-3 ${
                        isServing
                          ? 'bg-secondary text-on-secondary animate-pulse'
                          : isWaiting
                          ? 'bg-primary text-secondary-fixed'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">
                        {isServing ? 'content_cut' : 'schedule'}
                      </span>
                      <span>{entry.status}</span>
                    </span>
                    <h2 className="font-display text-2xl font-bold text-on-surface">
                      {entry.shop_name || entry.shop?.name}
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Service: <span className="font-semibold text-on-surface">{entry.service_name || entry.service?.name}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block">
                      Queue Position
                    </span>
                    <span className="font-display text-3xl font-bold text-secondary">
                      #{entry.position}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 my-6 p-4 bg-surface-container rounded-2xl text-center">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant">
                      Est. Wait
                    </span>
                    <span className="font-display text-xl font-bold text-on-surface">
                      ~{entry.estimated_wait_min} <span className="text-xs font-normal">mins</span>
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant">
                      Total Cost
                    </span>
                    <span className="font-display text-xl font-bold text-secondary">
                      ₹{entry.service_price || entry.service?.price}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-on-surface-variant">
                    Please arrive 5 minutes prior to your projected seating.
                  </p>
                  {isWaiting && (
                    <button
                      onClick={() => handleCancel(entry.id)}
                      disabled={busyId === entry.id}
                      className="px-4 py-2 rounded-xl border border-error/30 text-error hover:bg-error-container/20 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {busyId === entry.id ? 'Cancelling...' : 'Cancel Reservation'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
