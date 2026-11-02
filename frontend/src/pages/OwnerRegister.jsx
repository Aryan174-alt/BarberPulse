import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, saveTokens } from '../api/api.js'
import LocationPicker from '../components/LocationPicker.jsx'

export default function OwnerRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    password: '',
    shop_name: '',
    address: '',
    phone: '',
    latitude: 26.9124,
    longitude: 75.7873,
    avg_service_time_min: 25,
    max_queue_size: 15,
  })

  const [services, setServices] = useState([
    { name: 'Signature Haircut', price: '450', duration_min: 30 },
  ])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function updateService(idx, key, val) {
    const next = [...services]
    next[idx][key] = val
    setServices(next)
  }

  function addService() {
    setServices([...services, { name: '', price: '', duration_min: 30 }])
  }

  function removeService(idx) {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== idx))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)

    try {
      const payload = {
        username: form.username,
        password: form.password,
        shop_name: form.shop_name,
        address: form.address,
        phone: form.phone,
        latitude: form.latitude,
        longitude: form.longitude,
        avg_service_time_min: parseInt(form.avg_service_time_min, 10),
        max_queue_size: parseInt(form.max_queue_size, 10),
        services: services
          .filter((s) => s.name.trim() && s.price)
          .map((s) => ({
            name: s.name,
            price: parseFloat(s.price),
            duration_min: parseInt(s.duration_min, 10) || 30,
          })),
      }

      const res = await authApi.registerOwnerShop(payload)
      if (res.data?.access) {
        saveTokens(res.data, 'owner')
        navigate('/owner')
      } else {
        // Fallback login
        const loginRes = await authApi.login({ username: form.username, password: form.password })
        saveTokens(loginRes.data, loginRes.data.role)
        navigate('/owner')
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          JSON.stringify(err.response?.data) ||
          'Failed to complete registration. Please review inputs.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto my-12">
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-8 sm:p-12 shadow-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/10 text-secondary mb-3">
            <span className="material-symbols-outlined text-2xl">storefront</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            Register Your Salon Atelier
          </h1>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant mt-2">
            Showcase your craftsmanship and modernize queue reservations
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error-container/40 border border-error/20 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Account */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-on-surface border-b border-outline-variant/20 pb-2">
              1. Proprietor Account
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface text-sm focus:border-secondary focus:outline-none"
                  placeholder="atelier_admin"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface text-sm focus:border-secondary focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Section: Shop Details */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-on-surface border-b border-outline-variant/20 pb-2">
              2. Atelier Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2">
                  Salon / Atelier Name
                </label>
                <input
                  type="text"
                  required
                  value={form.shop_name}
                  onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface text-sm focus:border-secondary focus:outline-none"
                  placeholder="e.g. The Imperial Barber Club"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2">
                  Full Street Address
                </label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface text-sm focus:border-secondary focus:outline-none"
                  placeholder="Plot 42, Heritage Boulevard, C-Scheme"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2">
                  Direct Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface text-sm focus:border-secondary focus:outline-none"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Section: Operational Settings */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-on-surface border-b border-outline-variant/20 pb-2">
              3. Queue &amp; Service Defaults
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2">
                  Average Service Duration (Mins)
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={form.avg_service_time_min}
                  onChange={(e) => setForm({ ...form, avg_service_time_min: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface text-sm focus:border-secondary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2">
                  Maximum Queue Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={form.max_queue_size}
                  onChange={(e) => setForm({ ...form, max_queue_size: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface text-sm focus:border-secondary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Location Coordinates */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-on-surface border-b border-outline-variant/20 pb-2">
              4. Geographic Coordinates
            </h2>
            <LocationPicker
              lat={form.latitude}
              lng={form.longitude}
              onChange={(coords) => setForm({ ...form, latitude: coords.lat, longitude: coords.lng })}
            />
          </div>

          {/* Section: Menu & Services */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <h2 className="font-display text-lg font-bold text-on-surface">
                5. Curated Services Menu
              </h2>
              <button
                type="button"
                onClick={addService}
                className="text-xs uppercase font-bold tracking-wider text-secondary flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add Service</span>
              </button>
            </div>
            {services.map((s, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-surface-container rounded-2xl items-center"
              >
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    required
                    placeholder="Service Name (e.g. Royal Beard Trim)"
                    value={s.name}
                    onChange={(e) => updateService(idx, 'name', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="number"
                    required
                    placeholder="Price (₹)"
                    value={s.price}
                    onChange={(e) => updateService(idx, 'price', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="number"
                    required
                    placeholder="Mins"
                    value={s.duration_min}
                    onChange={(e) => updateService(idx, 'duration_min', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface"
                  />
                </div>
                <div className="sm:col-span-1 text-center">
                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(idx)}
                      className="text-error hover:text-error/80 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-4 rounded-xl bg-primary text-secondary-fixed text-xs uppercase font-bold tracking-widest hover:bg-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg"
          >
            {busy ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                <span>Configuring Atelier Profile...</span>
              </>
            ) : (
              <>
                <span>Complete Atelier Registration</span>
                <span className="material-symbols-outlined text-sm">verified</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/20 text-center">
          <p className="text-xs text-on-surface-variant">
            Already registered as an atelier owner?{' '}
            <Link to="/login" className="font-semibold text-secondary hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
