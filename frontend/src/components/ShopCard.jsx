import { Link } from 'react-router-dom'

import StaleLabel from './StaleLabel.jsx'

export default function ShopCard({ shop }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link className="text-lg font-semibold text-slate-900 hover:text-blue-700" to={`/shops/${shop.id}`}>
            {shop.name}
          </Link>
          <p className="mt-1 text-sm text-slate-600">{shop.address}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${shop.is_open ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
          {shop.is_open ? 'Open' : 'Closed'}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
        <span>{shop.queue_length} in queue</span>
        <span>About {shop.estimated_wait_min} min wait</span>
        {shop.distance_km != null && <span>{Number(shop.distance_km).toFixed(1)} km away</span>}
      </div>
      <p className="mt-3 text-xs"><StaleLabel updatedAt={shop.last_updated_at} /></p>
    </article>
  )
}
