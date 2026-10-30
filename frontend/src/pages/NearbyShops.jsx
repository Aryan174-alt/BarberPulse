import { useCallback, useEffect, useState } from 'react'

import { shopsApi } from '../api/api.js'
import ShopCard from '../components/ShopCard.jsx'
import ShopMap from '../components/ShopMap.jsx'

const JAIPUR = { lat: 26.9124, lon: 75.7873 }

export default function NearbyShops() {
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
    <div className="space-y-8">
      {/* Hero Header */}
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-[#10201d] px-6 py-8 text-white shadow-xl shadow-emerald-950/10 sm:px-10 sm:py-11">
        <div aria-hidden="true" className="absolute -right-20 -top-32 -z-10 size-96 rounded-full border-[3rem] border-white/[0.04]" />
        <div aria-hidden="true" className="absolute -bottom-36 right-1/4 -z-10 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="grid items-center gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px] shadow-emerald-300" />
              Live barber queues & wait times
            </p>
            <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl">
              Compare nearby barbers,
              <span className="block text-amber-400">skip the waiting room.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Check live queues, transparent prices, and estimated chair times in Jaipur before you leave home.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a className="rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-[#10201d] shadow-lg shadow-amber-950/20 transition hover:-translate-y-0.5 hover:bg-amber-300" href="#nearby-shops">
                Find Shops Below
              </a>
              <button className="rounded-full border border-white/20 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10" onClick={useMyLocation}>
                📍 Use my location
              </button>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm sm:p-6">
            <p className="text-sm font-semibold text-slate-300">Live area stats</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/[0.07] p-4 text-center">
                <p className="text-3xl font-black text-white">{shops.length}</p>
                <p className="mt-1 text-xs font-medium text-slate-400">total shops</p>
              </div>
              <div className="rounded-2xl bg-white/[0.07] p-4 text-center">
                <p className="text-3xl font-black text-emerald-300">{openShops}</p>
                <p className="mt-1 text-xs font-medium text-slate-400">open now</p>
              </div>
              <div className="rounded-2xl bg-white/[0.07] p-4 text-center">
                <p className="text-3xl font-black text-amber-300">{peopleWaiting}</p>
                <p className="mt-1 text-xs font-medium text-slate-400">waiting</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">Auto-refreshes every 8 seconds via DRF polling.</p>
          </div>
        </div>
      </header>

      {error && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900" role="status">{error}</p>}

      {/* Main Content Layout */}
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]" aria-label="Map and nearby shops">
        {/* Leaflet Map Column */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-2 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-950">Interactive Map</p>
              <p className="text-xs text-slate-500">Click shop markers to preview queue</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{filteredShops.length} pins</span>
          </div>
          <ShopMap shops={filteredShops} location={[location.lat, location.lon]} />
        </div>

        {/* Shop List Column */}
        <div id="nearby-shops" className="scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-800">Verified Salons</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Available Barber Chairs</h2>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
              Sort:
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Sort shops"
              >
                <option value="distance">Nearest First</option>
                <option value="wait">Shortest Wait First</option>
              </select>
            </label>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search shop, area, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: `All (${shops.length})` },
                { id: 'open', label: `🟢 Open (${openShops})` },
                { id: 'fast', label: '⚡ <15m Wait' },
                { id: 'budget', label: '💰 Under ₹200' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setFilterType(pill.id)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    filterType === pill.id
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skeleton Loaders */}
          {busy && shops.length === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="h-28 rounded-2xl bg-slate-100 mb-4" />
                  <div className="h-5 w-2/3 rounded bg-slate-100 mb-2" />
                  <div className="h-4 w-1/2 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {!busy && filteredShops.length === 0 && !error && (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600">
              <span className="text-3xl">🔍</span>
              <p className="mt-3 font-bold text-slate-900">No matching shops found</p>
              <p className="mt-1 text-xs text-slate-500">Try clearing filters or resetting search query.</p>
              <button
                onClick={() => {
                  setFilterType('all')
                  setSearchQuery('')
                }}
                className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Grid of Shops */}
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
