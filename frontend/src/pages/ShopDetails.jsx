import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { shopsApi } from '../api/api.js'
import StaleLabel from '../components/StaleLabel.jsx'

export default function ShopDetails() {
  const { shopId } = useParams()
  const [shop, setShop] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    shopsApi.detail(shopId)
      .then(({ data }) => setShop(data))
      .catch(() => setError('Could not load this shop.'))
  }, [shopId])

  async function join(serviceId) {
    if (!localStorage.getItem('queuenear_access')) {
      setMessage('Sign in as a customer before joining the queue.')
      return
    }
    try {
      const { data } = await shopsApi.join(shop.id, serviceId)
      setMessage(`You joined the queue. Your position is ${data.position}.`)
    } catch (requestError) {
      setMessage(requestError.response?.data?.detail || 'Could not join this queue.')
    }
  }

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>
  if (!shop) return <p className="text-slate-600">Loading shop…</p>

  return (
    <article className="mx-auto max-w-3xl space-y-6 rounded-2xl bg-white p-6 shadow-sm">
      <Link to="/" className="text-sm font-medium text-blue-700">← Nearby shops</Link>
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-950">{shop.name}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${shop.is_open ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
            {shop.is_open ? 'Open' : 'Closed'}
          </span>
        </div>
        <p className="mt-2 text-slate-600">{shop.address}</p>
        <p className="mt-2 text-sm text-slate-600">{shop.queue_length} people · about {shop.estimated_wait_min} min wait</p>
        <p className="mt-1 text-xs"><StaleLabel updatedAt={shop.last_updated_at} /></p>
      </header>
      {message && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900" role="status">{message}</p>}
      <section>
        <h2 className="text-xl font-semibold text-slate-900">Services</h2>
        <ul className="mt-3 divide-y divide-slate-200">
          {shop.services.map((service) => (
            <li className="flex flex-wrap items-center justify-between gap-3 py-4" key={service.id}>
              <div>
                <h3 className="font-medium text-slate-900">{service.name}</h3>
                <p className="text-sm text-slate-600">{service.minutes} minutes · ₹{service.price}</p>
              </div>
              <button
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={!shop.is_open}
                onClick={() => join(service.id)}
              >
                Join queue
              </button>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
