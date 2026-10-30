import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { authApi, saveTokens } from '../api/api.js'
import LocationPicker from '../components/LocationPicker.jsx'

const initialForm = {
  owner_name: '',
  email: '',
  phone: '',
  password: '',
  shop_name: '',
  address: '',
  lat: '26.9124',
  lon: '75.7873',
  opens_at: '09:00',
  closes_at: '21:00',
  break_start: '',
  break_end: '',
}

export default function OwnerRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [services, setServices] = useState([{ name: 'Haircut', minutes: '30', price: '' }])
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updateService(index, event) {
    const updated = [...services]
    updated[index] = { ...updated[index], [event.target.name]: event.target.value }
    setServices(updated)
  }

  function setLocation(location) {
    setForm((current) => ({
      ...current,
      lat: location.lat.toFixed(6),
      lon: location.lon.toFixed(6),
    }))
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Location is not available in this browser. You can click the map or enter coordinates.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocation({ lat: coords.latitude, lon: coords.longitude }),
      () => setError('Location permission was denied. Click the map or enter coordinates instead.'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (value !== '') payload.append(key, value)
    })
    payload.append('services', JSON.stringify(services))
    if (photo) payload.append('photo', photo)
    try {
      const { data } = await authApi.registerOwnerShop(payload)
      saveTokens(data, 'owner')
      navigate('/owner')
    } catch (requestError) {
      const details = requestError.response?.data
      setError(
        typeof details === 'object'
          ? Object.entries(details).map(([field, messages]) => `${field}: ${[].concat(messages).join(', ')}`).join(' · ')
          : details || 'Could not create the owner account.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
      <Link to="/login" className="text-sm font-medium text-blue-700">← Sign in</Link>
      <h1 className="mt-4 text-3xl font-bold text-slate-950">Register your barber shop</h1>
      <p className="mt-2 text-slate-600">Create an owner account and add your shop details so customers can find you.</p>

      <form className="mt-7 space-y-8" onSubmit={submit}>
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-lg font-semibold text-slate-900">Owner account</legend>
          <label className="text-sm font-medium text-slate-700">Owner name
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="owner_name" value={form.owner_name} onChange={update} autoComplete="name" required />
          </label>
          <label className="text-sm font-medium text-slate-700">Email
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="email" type="email" value={form.email} onChange={update} autoComplete="email" required />
          </label>
          <label className="text-sm font-medium text-slate-700">Phone
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="phone" type="tel" value={form.phone} onChange={update} autoComplete="tel" required />
          </label>
          <label className="text-sm font-medium text-slate-700">Password
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="password" type="password" minLength={8} value={form.password} onChange={update} autoComplete="new-password" required />
          </label>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-lg font-semibold text-slate-900">Shop details</legend>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Shop name
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="shop_name" value={form.shop_name} onChange={update} required />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Street address and area
            <textarea className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="address" rows="2" value={form.address} onChange={update} required />
          </label>
          <label className="text-sm font-medium text-slate-700">Opens at
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="opens_at" type="time" value={form.opens_at} onChange={update} required />
          </label>
          <label className="text-sm font-medium text-slate-700">Closes at
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="closes_at" type="time" value={form.closes_at} onChange={update} required />
          </label>
          <label className="text-sm font-medium text-slate-700">Break starts (optional)
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="break_start" type="time" value={form.break_start} onChange={update} />
          </label>
          <label className="text-sm font-medium text-slate-700">Break ends (optional)
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="break_end" type="time" value={form.break_end} onChange={update} />
          </label>
        </fieldset>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Services and prices</h2>
              <p className="text-sm text-slate-600">Customers see these choices before joining your queue.</p>
            </div>
            <button type="button" className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700" disabled={services.length >= 20} onClick={() => setServices([...services, { name: '', minutes: '30', price: '' }])}>
              Add service
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {services.map((service, index) => (
              <div className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_8rem_8rem_auto]" key={index}>
                <input aria-label="Service name" className="rounded-lg border border-slate-300 px-3 py-2" name="name" placeholder="Service name" value={service.name} onChange={(event) => updateService(index, event)} required />
                <input aria-label="Duration in minutes" className="rounded-lg border border-slate-300 px-3 py-2" name="minutes" type="number" min="1" max="600" placeholder="Minutes" value={service.minutes} onChange={(event) => updateService(index, event)} required />
                <input aria-label="Price in rupees" className="rounded-lg border border-slate-300 px-3 py-2" name="price" type="number" min="0" step="0.01" placeholder="Price ₹" value={service.price} onChange={(event) => updateService(index, event)} required />
                {services.length > 1 && <button type="button" className="px-2 text-sm text-red-700" aria-label="Remove service" onClick={() => setServices(services.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>}
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Shop location</h2>
              <p className="text-sm text-slate-600">Click the map, use your device location, or adjust the coordinates.</p>
            </div>
            <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium" onClick={useMyLocation}>Use my location</button>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg">
            <LocationPicker location={{ lat: Number(form.lat), lon: Number(form.lon) }} onSelect={setLocation} />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Latitude
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="lat" type="number" min="-90" max="90" step="0.000001" value={form.lat} onChange={update} required />
            </label>
            <label className="text-sm font-medium text-slate-700">Longitude
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="lon" type="number" min="-180" max="180" step="0.000001" value={form.lon} onChange={update} required />
            </label>
          </div>
        </section>

        <label className="block text-sm font-medium text-slate-700">Shop photo (JPG, PNG, or WebP; up to 5 MB)
          <input className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
        </label>

        {error && <p className="break-words rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
        <button className="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50" disabled={busy}>
          {busy ? 'Creating shop…' : 'Create owner account and publish shop'}
        </button>
      </form>
    </section>
  )
}
