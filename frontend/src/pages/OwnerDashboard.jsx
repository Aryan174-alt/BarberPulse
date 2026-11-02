import { useEffect, useState, useCallback } from 'react'
import { queueApi, shopsApi } from '../api/api.js'

export default function AtelierDashboard() {
  const [shop, setShop] = useState(null)
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionBusy, setActionBusy] = useState(false)
  const [walkinForm, setWalkinForm] = useState({ customer_name: '', customer_phone: '', service_id: '' })

  const loadDashboard = useCallback(async () => {
    try {
      const shopRes = await queueApi.ownerShop()
      setShop(shopRes.data)
      const queueRes = await queueApi.ownerQueue()
      setQueue(Array.isArray(queueRes.data) ? queueRes.data : queueRes.data?.results || [])
    } catch {
      // Ignored
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
    const timer = setInterval(loadDashboard, 6000)
    return () => clearInterval(timer)
  }, [loadDashboard])

  async function handleToggleStatus() {
    if (!shop) return
    setActionBusy(true)
    try {
      await queueApi.updateOwnerShop({ is_open: !shop.is_open })
      loadDashboard()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to toggle status.')
    } finally {
      setActionBusy(false)
    }
  }

  async function handleQueueAction(entryId, action) {
    setActionBusy(true)
    try {
      await queueApi.ownerAction(entryId, action)
      loadDashboard()
    } catch (err) {
      alert(err.response?.data?.detail || 'Action failed.')
    } finally {
      setActionBusy(false)
    }
  }

  async function handleAddWalkin(e) {
    e.preventDefault()
    if (!walkinForm.service_id || !shop) return
    setActionBusy(true)
    try {
      await shopsApi.walkIn(shop.id, walkinForm)
      setWalkinForm({ customer_name: '', customer_phone: '', service_id: '' })
      loadDashboard()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add walk-in customer.')
    } finally {
      setActionBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-secondary animate-spin">progress_activity</span>
        <p className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
          Accessing Atelier Suite...
        </p>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-error font-display text-lg">No Atelier profile found for this proprietor account.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Proprietor Status Banner */}
      <section className="bg-surface-container-high border border-outline-variant/30 rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${
                shop.is_open ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary'
              }`}
            >
              {shop.is_open ? 'Accepting Clients' : 'Atelier Closed'}
            </span>
            <span className="text-xs text-on-surface-variant">Live Proprietor Portal</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-on-surface">{shop.name}</h1>
          <p className="text-xs text-on-surface-variant mt-1">{shop.address}</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleStatus}
            disabled={actionBusy}
            className={`px-6 py-3 rounded-xl text-xs uppercase font-bold tracking-widest transition-all cursor-pointer shadow-md ${
              shop.is_open
                ? 'bg-error text-on-error hover:bg-error/90'
                : 'bg-secondary text-on-secondary hover:bg-secondary/90'
            }`}
          >
            {shop.is_open ? 'Pause / Close Queue' : 'Open for Clients'}
          </button>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 text-center">
          <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block mb-1">
            Waiting in Queue
          </span>
          <span className="font-display text-3xl font-bold text-primary">
            {queue.filter((q) => q.status === 'waiting').length}
          </span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 text-center">
          <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block mb-1">
            In Chair / Serving
          </span>
          <span className="font-display text-3xl font-bold text-secondary">
            {queue.filter((q) => q.status === 'serving').length}
          </span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 text-center">
          <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block mb-1">
            Completed Today
          </span>
          <span className="font-display text-3xl font-bold text-primary">
            {queue.filter((q) => q.status === 'completed').length}
          </span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 text-center">
          <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block mb-1">
            Max Capacity
          </span>
          <span className="font-display text-3xl font-bold text-on-surface">
            {shop.max_queue_size ?? 15}
          </span>
        </div>
      </section>

      {/* Main Grid: Live Queue List + Add Walk-in */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Live Queue Cards */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <h2 className="font-display text-xl font-bold text-on-surface">
              Active Client Roster ({queue.filter(q => ['waiting', 'serving', 'called'].includes(q.status)).length})
            </h2>
            <button
              onClick={loadDashboard}
              className="text-xs uppercase font-bold tracking-wider text-secondary flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Sync</span>
            </button>
          </div>

          {queue.filter(q => ['waiting', 'serving', 'called'].includes(q.status)).length === 0 ? (
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-3xl text-secondary mb-2">event_available</span>
              <p className="font-display text-lg font-bold text-on-surface">Queue is currently clear</p>
              <p className="text-xs text-on-surface-variant mt-1">
                New online reservations or walk-ins will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue
                .filter(q => ['waiting', 'serving', 'called'].includes(q.status))
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display text-lg font-bold text-on-surface">
                          #{entry.position} {entry.customer_name}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${
                            entry.status === 'serving'
                              ? 'bg-secondary text-on-secondary'
                              : entry.status === 'called'
                              ? 'bg-primary text-secondary-fixed'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        Service: <span className="font-semibold text-on-surface">{entry.service_name || entry.service?.name}</span> &bull;{' '}
                        Phone: {entry.customer_phone}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {entry.status === 'waiting' && (
                        <button
                          onClick={() => handleQueueAction(entry.id, 'call')}
                          disabled={actionBusy}
                          className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/40 text-xs font-bold uppercase tracking-wider text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
                        >
                          Notify / Call
                        </button>
                      )}
                      {['waiting', 'called'].includes(entry.status) && (
                        <button
                          onClick={() => handleQueueAction(entry.id, 'serve')}
                          disabled={actionBusy}
                          className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-bold uppercase tracking-wider hover:bg-secondary/90 transition-colors cursor-pointer"
                        >
                          Seat in Chair
                        </button>
                      )}
                      {entry.status === 'serving' && (
                        <button
                          onClick={() => handleQueueAction(entry.id, 'complete')}
                          disabled={actionBusy}
                          className="px-3 py-1.5 rounded-lg bg-primary text-secondary-fixed text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-colors cursor-pointer"
                        >
                          Complete Session
                        </button>
                      )}
                      <button
                        onClick={() => handleQueueAction(entry.id, 'cancel')}
                        disabled={actionBusy}
                        className="px-2.5 py-1.5 rounded-lg text-error hover:bg-error-container/20 text-xs font-bold cursor-pointer"
                        title="Cancel entry"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Walk-in Entry Form */}
        <div className="lg:col-span-4">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display text-lg font-bold text-on-surface">Add Walk-in Client</h3>
            <p className="text-xs text-on-surface-variant">
              Quickly register a guest who walked into the salon atelier.
            </p>

            <form onSubmit={handleAddWalkin} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Guest Name"
                  value={walkinForm.customer_name}
                  onChange={(e) => setWalkinForm({ ...walkinForm, customer_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs text-on-surface focus:border-secondary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91..."
                  value={walkinForm.customer_phone}
                  onChange={(e) => setWalkinForm({ ...walkinForm, customer_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs text-on-surface focus:border-secondary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                  Select Service
                </label>
                <select
                  required
                  value={walkinForm.service_id}
                  onChange={(e) => setWalkinForm({ ...walkinForm, service_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs text-on-surface focus:border-secondary focus:outline-none"
                >
                  <option value="">Select treatment...</option>
                  {shop.services?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (₹{s.price})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionBusy}
                className="w-full py-3 mt-2 rounded-xl bg-primary text-secondary-fixed text-xs uppercase font-bold tracking-widest hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Enroll in Queue</span>
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
