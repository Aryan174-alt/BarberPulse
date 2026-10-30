import { Link } from 'react-router-dom'

import StaleLabel from './StaleLabel.jsx'

export default function ShopCard({ shop }) {
  const service = shop.services?.[0]

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-900/5">
      {shop.photo_url && (
        <Link to={`/shops/${shop.id}`} aria-label={`View ${shop.name}`}>
          <img className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.02]" src={shop.photo_url} alt={`${shop.name} shop`} />
        </Link>
      )}
      {!shop.photo_url && (
        <div aria-hidden="true" className="relative flex h-28 items-end overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-[#a5a36d] px-5 pb-4">
          <span className="absolute -right-3 -top-10 size-36 rounded-full border-[1.5rem] border-white/10" />
          <span className="absolute right-10 top-4 size-10 rounded-full bg-amber-300/80 blur-sm" />
          <span className="relative grid size-11 place-items-center rounded-2xl border border-white/20 bg-white/10 text-xl font-black text-white backdrop-blur-sm">{shop.name?.charAt(0).toUpperCase()}</span>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link className="text-lg font-bold leading-tight text-slate-950 transition group-hover:text-emerald-800" to={`/shops/${shop.id}`}>
              {shop.name}
            </Link>
            <p className="mt-1.5 line-clamp-1 text-sm text-slate-500">{shop.address}</p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${shop.is_open ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
            <span className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${shop.is_open ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {shop.is_open ? 'Open' : 'Closed'}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-[#f7f8f5] py-3 text-center">
          <div>
            <p className="text-lg font-black text-slate-900">{shop.queue_length}</p>
            <p className="text-[11px] font-medium text-slate-500">in queue</p>
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">{shop.estimated_wait_min}<span className="ml-0.5 text-xs font-semibold">m</span></p>
            <p className="text-[11px] font-medium text-slate-500">estimated wait</p>
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">{shop.distance_km != null ? Number(shop.distance_km).toFixed(1) : '—'}<span className="ml-0.5 text-xs font-semibold">km</span></p>
            <p className="text-[11px] font-medium text-slate-500">away</p>
          </div>
        </div>
        <div className="mt-4 flex min-h-7 items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-700">
            {service ? `${service.name} · ₹${service.price}` : shop.phone || 'Services available in shop details'}
          </p>
          {service && shop.services.length > 1 && <span className="shrink-0 text-xs text-slate-500">+{shop.services.length - 1} more</span>}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-xs"><StaleLabel updatedAt={shop.last_updated_at} /></p>
          <Link className="text-sm font-bold text-emerald-800 transition group-hover:text-emerald-950" to={`/shops/${shop.id}`}>
            View shop <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
