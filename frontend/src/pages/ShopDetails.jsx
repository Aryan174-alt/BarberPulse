import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { shopsApi } from '../api/api.js'
import StaleLabel from '../components/StaleLabel.jsx'

export default function ShopDetails() {
  const { shopId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [shop, setShop] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [joiningId, setJoiningId] = useState(null)
  const handledJoin = useRef('')

  useEffect(() => {
    shopsApi
      .detail(shopId)
      .then(({ data }) => setShop(data))
      .catch(() => setError('Could not load this shop.'))
  }, [shopId])

  async function join(serviceId) {
    if (!localStorage.getItem('queuenear_access')) {
      const returnPath = `/shops/${shop.id}?join=${encodeURIComponent(serviceId)}`
      navigate(`/login?next=${encodeURIComponent(returnPath)}`)
      return
    }
    if (localStorage.getItem('queuenear_role') !== 'customer') {
      setMessage('Shop owner accounts cannot join customer queues. Please sign in as a customer.')
      return
    }
    setJoiningId(serviceId)
    try {
      const { data } = await shopsApi.join(shop.id, serviceId)
      setMessage(`Success! You joined the queue at position #${data.position}.`)
    } catch (requestError) {
      setMessage(requestError.response?.data?.detail || 'Could not join this queue.')
    } finally {
      setJoiningId(null)
    }
  }

  useEffect(() => {
    const serviceId = searchParams.get('join')
    if (!shop || !serviceId || handledJoin.current === `${shopId}:${serviceId}`) return
    handledJoin.current = `${shopId}:${serviceId}`
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('join')
    setSearchParams(nextParams, { replace: true })
    if (shop.services.some((service) => String(service.id) === serviceId)) {
      join(serviceId)
    }
  }, [shop, shopId, searchParams, setSearchParams])

  if (error) return <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">{error}</p>
  if (!shop) return <div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white p-8" />

  const activeBarbers = shop.barbers?.filter((b) => b.is_active) || []

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 transition hover:text-slate-950">
        ← Back to Nearby Shops
      </Link>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        {/* Shop Photo / Header Banner */}
        {shop.photo_url ? (
          <img className="h-64 w-full object-cover sm:h-80" src={shop.photo_url} alt={`${shop.name} shop`} />
        ) : (
          <div className="relative flex h-44 items-end overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-[#928f5c] p-6 text-white">
            <span className="absolute -right-8 -top-12 size-48 rounded-full border-[2rem] border-white/10" />
            <div className="relative z-10">
              <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                Barber Shop
              </span>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-950">{shop.name}</h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    shop.is_open ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${shop.is_open ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {shop.is_open ? 'Open Now' : 'Closed'}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{shop.address}</p>
            </div>

            {/* Quick Metrics Badge */}
            <div className="grid grid-cols-2 divide-x divide-slate-100 rounded-2xl bg-[#f7f8f5] py-2.5 px-4 text-center">
              <div className="pr-3">
                <p className="text-xl font-black text-slate-950">{shop.queue_length}</p>
                <p className="text-[11px] font-semibold text-slate-500">waiting</p>
              </div>
              <div className="pl-3">
                <p className="text-xl font-black text-slate-950">{shop.estimated_wait_min}m</p>
                <p className="text-[11px] font-semibold text-slate-500">est. wait</p>
              </div>
            </div>
          </div>

          {/* Operating Info Grid */}
          <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-[#fafaf9] p-4 text-xs font-medium text-slate-700 sm:grid-cols-3">
            <div>
              <span className="block text-slate-400 text-[10px] font-bold uppercase">Hours Today</span>
              <span>{shop.opens_at?.slice(0, 5)} - {shop.closes_at?.slice(0, 5)}</span>
              {shop.break_start && shop.break_end && (
                <span className="block text-slate-500 text-[11px]">Break: {shop.break_start?.slice(0, 5)} - {shop.break_end?.slice(0, 5)}</span>
              )}
            </div>
            <div>
              <span className="block text-slate-400 text-[10px] font-bold uppercase">Staff on Duty</span>
              <span>{activeBarbers.length > 0 ? `${activeBarbers.length} Active Barbers` : '1 Active Barber'}</span>
            </div>
            <div>
              <span className="block text-slate-400 text-[10px] font-bold uppercase">Queue Reliability</span>
              <StaleLabel updatedAt={shop.last_updated_at} />
            </div>
          </div>

          {/* Contact / Map Links */}
          <div className="mt-4 flex flex-wrap gap-2 pt-2">
            {shop.phone && (
              <a
                href={`tel:${shop.phone}`}
                className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                📞 {shop.phone}
              </a>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name + ' ' + shop.address)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              🗺️ Directions on Map
            </a>
          </div>

          {/* Alert / Feedback message */}
          {message && (
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-950">
              <p>{message}</p>
              {message.includes('Success') && (
                <Link to="/queue" className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800">
                  View in My Queue →
                </Link>
              )}
            </div>
          )}

          {/* Services Section */}
          <section className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">Select Service to Join Queue</h2>
                <p className="mt-0.5 text-xs text-slate-500">Pick a service to secure your live queue position</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {shop.services?.length || 0} services
              </span>
            </div>

            <ul className="mt-4 divide-y divide-slate-100">
              {shop.services?.map((service) => (
                <li
                  key={service.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4 transition hover:bg-slate-50/50 rounded-xl px-2"
                >
                  <div>
                    <h3 className="font-bold text-slate-900">{service.name}</h3>
                    <p className="text-xs text-slate-500">⏱️ {service.minutes} minutes duration</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-base font-black text-slate-900">₹{service.price}</span>
                    <button
                      className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      disabled={!shop.is_open || joiningId === service.id}
                      onClick={() => join(service.id)}
                    >
                      {joiningId === service.id ? 'Joining…' : !shop.is_open ? 'Shop Closed' : 'Join Queue'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </article>
  )
}
