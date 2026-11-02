import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { shopsApi } from '../api/api.js'
import StaleLabel from '../components/StaleLabel.jsx'

export default function SalonDetails() {
  const { shopId } = useParams()
  const navigate = useNavigate()

  const [shop, setShop] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchDetails = useCallback(async () => {
    try {
      const { data } = await shopsApi.detail(shopId)
      setShop(data)
      if (data.services?.length && !selectedService) {
        setSelectedService(data.services[0])
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load atelier details.')
    } finally {
      setLoading(false)
    }
  }, [shopId, selectedService])

  useEffect(() => {
    fetchDetails()
    const timer = setInterval(fetchDetails, 10000)
    return () => clearInterval(timer)
  }, [fetchDetails])

  async function handleJoinQueue(e) {
    e.preventDefault()
    if (!selectedService) {
      setError('Please select a grooming service.')
      return
    }

    setBusy(true)
    setError('')
    setSuccess('')

    try {
      await shopsApi.join(shop.id, selectedService.id)
      setSuccess('Queue spot reserved successfully!')
      setTimeout(() => {
        navigate('/queue')
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not join the queue. The salon may be full or requires login.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-secondary animate-spin">progress_activity</span>
        <p className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
          Curating Atelier Experience...
        </p>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="py-16 text-center">
        <p className="text-error font-display text-lg">Atelier not found or unavailable.</p>
        <Link to="/salons" className="mt-4 inline-block text-xs uppercase font-bold text-secondary">
          Return to Discovery
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Back button */}
      <Link
        to="/salons"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span>Back to Salons</span>
      </Link>

      {/* Hero Showcase Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-container-high border border-outline-variant/30">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${
                    shop.is_open ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary'
                  }`}
                >
                  {shop.is_open ? 'Open Now' : 'Closed for Sessions'}
                </span>
                <span className="text-xs text-on-surface-variant">
                  <StaleLabel updatedAt={shop.last_updated_at} />
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-on-surface leading-tight">
                {shop.name}
              </h1>
              <p className="text-sm text-on-surface-variant flex items-center gap-2 mt-3">
                <span className="material-symbols-outlined text-base text-secondary">location_on</span>
                <span>{shop.address}</span>
              </p>
              {shop.phone && (
                <p className="text-sm text-on-surface-variant flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-base text-secondary">call</span>
                  <span>{shop.phone}</span>
                </p>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-outline-variant/30">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant">
                  Current Queue
                </span>
                <span className="font-display text-2xl font-bold text-primary">
                  {shop.queue_length ?? 0}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant">
                  Est. Wait Time
                </span>
                <span className="font-display text-2xl font-bold text-secondary">
                  ~{shop.estimated_wait_min ?? 0} <span className="text-xs font-normal text-on-surface-variant">min</span>
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant">
                  Avg Duration
                </span>
                <span className="font-display text-2xl font-bold text-primary">
                  {shop.avg_service_time_min ?? 25} <span className="text-xs font-normal text-on-surface-variant">min</span>
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[250px] lg:min-h-full bg-surface-container overflow-hidden">
            {shop.photo_url ? (
              <img
                src={shop.photo_url}
                alt={shop.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary via-primary-container to-secondary/40 text-center">
                <span className="material-symbols-outlined text-5xl text-secondary mb-3">content_cut</span>
                <p className="font-display text-2xl font-bold text-on-primary tracking-wide">
                  {shop.name}
                </p>
                <p className="text-xs uppercase tracking-widest text-secondary-fixed mt-1">
                  Private Salon Atelier
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content: Services Menu + Reservation Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Services Menu */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-secondary block mb-1">
              The Menu
            </span>
            <h2 className="font-display text-2xl font-bold text-on-surface">
              Curated Services &amp; Treatments
            </h2>
          </div>

          <div className="space-y-3">
            {shop.services?.map((svc) => {
              const isSelected = selectedService?.id === svc.id
              return (
                <div
                  key={svc.id}
                  onClick={() => setSelectedService(svc)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-secondary/10 border-secondary shadow-sm'
                      : 'bg-surface-container-low border-outline-variant/30 hover:border-secondary/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-base font-bold text-on-surface">
                        {svc.name}
                      </span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-secondary text-base">
                          check_circle
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      <span>{svc.duration_min} minutes</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-lg font-bold text-secondary">
                      ₹{svc.price}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Reservation / Queue Entry Form */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-md">
            <h3 className="font-display text-xl font-bold text-on-surface mb-2">
              Reserve Your Chair
            </h3>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-6">
              Instant Queue Placement
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-error-container/40 border border-error/20 text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-secondary-fixed/50 border border-secondary/30 text-on-secondary-fixed text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleJoinQueue} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
                  Selected Service
                </label>
                <div className="p-3 bg-surface-container rounded-xl text-xs font-semibold text-on-surface flex justify-between items-center">
                  <span>{selectedService ? selectedService.name : 'Select a service above'}</span>
                  <span className="text-secondary font-bold">
                    {selectedService ? `₹${selectedService.price}` : ''}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container text-xs text-on-surface-variant">
                <p className="font-semibold text-on-surface mb-1">Queue &amp; Payment Notice</p>
                <p>Advance booking places you into the salon's live queue. Pay in person upon arrival or completion.</p>
              </div>

              <button
                type="submit"
                disabled={busy || !shop.is_open}
                className="w-full py-3.5 mt-2 rounded-xl bg-primary text-secondary-fixed text-xs uppercase font-bold tracking-widest hover:bg-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
              >
                {busy ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    <span>Securing Place...</span>
                  </>
                ) : !shop.is_open ? (
                  <span>Salon Currently Closed</span>
                ) : (
                  <>
                    <span>Join Atelier Queue</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
