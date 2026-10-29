import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { shopsApi } from '../api/api.js'

export default function JoinByQR() {
  const { shopId } = useParams()
  const [shop, setShop] = useState(null)
  const [name, setName] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    shopsApi.detail(shopId)
      .then(({ data }) => {
        setShop(data)
        setServiceId(String(data.services[0]?.id || ''))
      })
      .catch((error) => setMessage(error.response?.data?.detail || 'Could not load this shop.'))
  }, [shopId])

  async function submit(event) {
    event.preventDefault()
    try {
      const payload = { name }
      if (serviceId) payload.service_id = serviceId
      const { data } = await shopsApi.walkIn(shopId, payload)
      setMessage(`You joined the queue at position ${data.position}.`)
      setName('')
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Could not join the walk-in queue.')
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      <Link to="/" className="text-sm font-medium text-blue-700">← QueueNear</Link>
      <h1 className="text-2xl font-bold text-slate-950">{shop ? `Join ${shop.name}` : 'Join this shop queue'}</h1>
      {shop && (
        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-700">
            Your name
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Service
            <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={serviceId} onChange={(event) => setServiceId(event.target.value)} required>
              {shop.services.map((service) => <option key={service.id} value={service.id}>{service.name} · ₹{service.price}</option>)}
            </select>
          </label>
          <button className="w-full rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white" disabled={!shop.is_open || !serviceId}>Join queue</button>
        </form>
      )}
      {message && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900" role="status">{message}</p>}
    </section>
  )
}
