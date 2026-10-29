import { useCallback, useEffect, useState } from 'react'

import { shopsApi } from '../api/api.js'
import ShopCard from '../components/ShopCard.jsx'
import ShopMap from '../components/ShopMap.jsx'

const JAIPUR = { lat: 26.9124, lon: 75.7873 }

export default function NearbyShops() {
  const [location, setLocation] = useState(JAIPUR)
  const [shops, setShops] = useState([])
  const [sort, setSort] = useState('distance')
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
      ({ coords }) => setLocation({ lat: coords.latitude, lon: coords.longitude }),
      () => setError('Location permission was denied. Showing Jaipur shops.'),
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Live barber queues</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Find a nearby barber</h1>
          <p className="mt-2 text-slate-600">Compare open shops, current queues, and estimated waits.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="rounded-lg border border-slate-300 bg-white px-3 py-2" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort shops">
            <option value="distance">Nearest first</option>
            <option value="wait">Shortest wait</option>
          </select>
          <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium" onClick={useMyLocation}>
            Use my location
          </button>
        </div>
      </header>
      {error && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="status">{error}</p>}
      <ShopMap shops={shops} location={[location.lat, location.lon]} />
      {busy && shops.length === 0 && <p className="text-slate-600">Loading shops…</p>}
      {!busy && shops.length === 0 && !error && <p className="rounded-xl bg-white p-6 text-slate-600">No shops found nearby.</p>}
      <section className="grid gap-3 md:grid-cols-2" aria-label="Nearby shops">
        {shops.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
      </section>
    </div>
  )
}
