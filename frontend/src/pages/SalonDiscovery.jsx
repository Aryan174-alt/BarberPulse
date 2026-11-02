import { useCallback, useEffect, useState } from 'react'

import { shopsApi } from '../api/api.js'
import SalonCard from '../components/SalonCard.jsx'
import ShopMap from '../components/ShopMap.jsx'

const JAIPUR = { lat: 26.9124, lon: 75.7873 }

const FILTERS = [
  { id: 'all', label: 'All Ateliers', icon: 'auto_awesome' },
  { id: 'open', label: 'Open Now', icon: 'storefront' },
  { id: 'fast', label: 'Fast Queue', icon: 'bolt' },
  { id: 'budget', label: 'Budget', icon: 'savings' },
]

export default function SalonDiscovery() {
  const [location, setLocation] = useState(JAIPUR)
  const [shops, setShops] = useState([])
  const [sort, setSort] = useState('distance')
  const [filterType, setFilterType] = useState('all') // all, open, fast, budget
  const [searchQuery, setSearchQuery] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  const loadShops = useCallback(async () => {
    try {
      const { data } = await shopsApi.nearby({ ...location, sort, radius_km: 15 })
      setShops(data)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not load nearby shops.')
    } finally {
      setBusy(false)
    }
  }, [location, sort])

  useEffect(() => {
    loadShops()
    const timer = window.setInterval(loadShops, 8000)
    return () => window.clearInterval(timer)
  }, [loadShops])

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Location is not available in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lon: coords.longitude })
        setBusy(true)
      },
      () => setError('Location permission was denied. Showing Jaipur shops.'),
    )
  }

  // Filter logic
  const filteredShops = shops.filter((shop) => {
    if (filterType === 'open' && !shop.is_open) return false
    if (filterType === 'fast' && shop.estimated_wait_min > 15) return false
    if (filterType === 'budget') {
      const hasBudgetService = shop.services?.some((s) => Number(s.price) <= 200)
      if (!hasBudgetService) return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = shop.name.toLowerCase().includes(q)
      const matchAddress = shop.address.toLowerCase().includes(q)
      const matchService = shop.services?.some((s) => s.name.toLowerCase().includes(q))
      if (!matchName && !matchAddress && !matchService) return false
    }
    return true
  })

  const openShops = shops.filter((shop) => shop.is_open).length
  const peopleWaiting = shops.reduce((total, shop) => total + Number(shop.queue_length || 0), 0)

  return (
    <section className="min-h-screen bg-background">
      {/* ─── Editorial Directory Header ─── */}
      <div className="px-4 pt-12 pb-2 sm:px-8 lg:px-16">
        {/* Verified Badge */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">verified</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
            Atelier Directory 2025
          </span>
        </div>

        {/* Headline */}
        <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
          Discover Your Next{' '}
          <em className="not-italic font-display italic text-primary">Favourite Salon</em>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 max-w-xl text-base leading-relaxed text-on-surface-variant sm:text-lg">
          Curated ateliers with live queue updates, transparent pricing, and estimated chair times — all refreshed in real-time.
        </p>

        {/* Filter Badges */}
        <div className="mt-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                filterType === f.id
                  ? 'bg-primary text-[#ffdea8] shadow-md'
                  : 'border border-[#cfc5b8]/40 bg-[#f1ede5] text-on-surface hover:border-primary/30 hover:bg-[#ece7dd]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
              {f.label}
              {f.id === 'all' && ` (${shops.length})`}
              {f.id === 'open' && ` (${openShops})`}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="mx-4 mt-8 sm:mx-8 lg:mx-16">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e6e2da] bg-surface-container-lowest p-3 shadow-sm">
          {/* Search Input */}
          <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl bg-[#f8f5ee] px-4 py-2.5">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Search salon, area, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-on-surface placeholder-on-surface-variant/60 outline-none"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 rounded-xl border border-[#e6e2da] bg-[#f8f5ee] px-3 py-2.5">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">sort</span>
            <select
              className="bg-transparent text-xs font-semibold text-on-surface outline-none cursor-pointer"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort shops"
            >
              <option value="distance">Nearest First</option>
              <option value="wait">Shortest Wait</option>
            </select>
          </div>

          {/* Use My Location */}
          <button
            onClick={useMyLocation}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-[#ffdea8] uppercase tracking-wider transition-all duration-200 hover:bg-secondary hover:text-white hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[16px]">my_location</span>
            Use My Location
          </button>
        </div>
      </div>

      {/* ─── Live Stats Bar ─── */}
      <div className="mx-4 mt-6 sm:mx-8 lg:mx-16">
        <div className="flex flex-wrap items-center gap-6 rounded-xl border border-[#e6e2da] bg-surface-container-lowest px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">storefront</span>
            <p className="text-sm text-on-surface-variant">
              <span className="font-bold text-on-surface">{shops.length}</span> Salons Found
            </p>
          </div>
          <span className="hidden h-5 w-px bg-[#e6e2da] sm:block" />
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-green-600">check_circle</span>
            <p className="text-sm text-on-surface-variant">
              <span className="font-bold text-on-surface">{openShops}</span> Open Now
            </p>
          </div>
          <span className="hidden h-5 w-px bg-[#e6e2da] sm:block" />
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-amber-600">group</span>
            <p className="text-sm text-on-surface-variant">
              <span className="font-bold text-on-surface">{peopleWaiting}</span> People Waiting
            </p>
          </div>
          <span className="hidden h-5 w-px bg-[#e6e2da] sm:block" />
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-xs text-on-surface-variant">Auto-refreshes every 8s</p>
          </div>
        </div>
      </div>

      {/* ─── Error Display ─── */}
      {error && (
        <div className="mx-4 mt-6 sm:mx-8 lg:mx-16">
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4" role="status">
            <span className="material-symbols-outlined text-[20px] text-amber-700">warning</span>
            <p className="text-sm font-semibold text-amber-900">{error}</p>
          </div>
        </div>
      )}

      {/* ─── Skeleton Loaders ─── */}
      {busy && shops.length === 0 && (
        <div className="mx-4 mt-8 grid gap-6 sm:mx-8 sm:grid-cols-2 lg:mx-16 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="animate-pulse overflow-hidden rounded-2xl border border-[#e6e2da] bg-surface-container-lowest">
              <div className="aspect-[4/3] bg-[#ece7dd]" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-1/3 rounded bg-[#e6e2da]" />
                <div className="h-5 w-3/4 rounded bg-[#e6e2da]" />
                <div className="h-3 w-1/2 rounded bg-[#e6e2da]" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-16 rounded-full bg-[#e6e2da]" />
                  <div className="h-6 w-16 rounded-full bg-[#e6e2da]" />
                </div>
              </div>
              <div className="border-t border-[#e6e2da] px-5 py-3 flex justify-between">
                <div className="h-4 w-16 rounded bg-[#e6e2da]" />
                <div className="h-8 w-28 rounded-full bg-[#e6e2da]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Empty State ─── */}
      {!busy && filteredShops.length === 0 && !error && (
        <div className="mx-4 mt-8 sm:mx-8 lg:mx-16">
          <div className="rounded-2xl border border-[#e6e2da] bg-surface-container-lowest p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">search_off</span>
            <p className="mt-4 font-display text-xl font-semibold text-on-surface">No matching salons found</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Try clearing your filters or adjusting the search query.
            </p>
            <button
              onClick={() => {
                setFilterType('all')
                setSearchQuery('')
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#cfc5b8]/40 bg-[#f1ede5] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-on-surface transition hover:bg-[#ece7dd]"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* ─── Salon Grid ─── */}
      {filteredShops.length > 0 && (
        <div id="nearby-shops" className="scroll-mt-24 mx-4 mt-8 sm:mx-8 lg:mx-16">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant">
              Showing {filteredShops.length} of {shops.length} ateliers
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredShops.map((shop) => (
              <SalonCard key={shop.id} shop={shop} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Map Section ─── */}
      <div className="mx-4 mt-12 mb-12 sm:mx-8 lg:mx-16">
        <div className="overflow-hidden rounded-2xl border border-[#e6e2da] bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e6e2da] px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-primary">map</span>
              <div>
                <p className="text-sm font-semibold text-on-surface">Interactive Map</p>
                <p className="text-xs text-on-surface-variant">Click markers to preview queue details</p>
              </div>
            </div>
            <span className="rounded-full bg-[#f1ede5] px-3 py-1 text-xs font-semibold text-on-surface-variant">
              {filteredShops.length} pins
            </span>
          </div>
          <ShopMap shops={filteredShops} location={[location.lat, location.lon]} />
        </div>
      </div>
    </section>
  )
}
