import { Link } from 'react-router-dom'
import StaleLabel from './StaleLabel.jsx'

export default function SalonCard({ shop }) {
  const service = shop.services?.[0]

  return (
    <article className="group flex flex-col justify-between bg-surface-container-low border border-outline-variant/30 rounded-2xl overflow-hidden hover:border-secondary/40 hover:shadow-xl transition-all duration-300">
      <div>
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
          {shop.photo_url ? (
            <img
              src={shop.photo_url}
              alt={shop.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary-container to-secondary/30 p-6 text-center">
              <span className="material-symbols-outlined text-secondary text-4xl mb-2">content_cut</span>
              <span className="text-xl font-display font-semibold text-on-primary tracking-wide">
                {shop.name}
              </span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <span
              className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full backdrop-blur-md ${
                shop.is_open
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-primary/70 text-on-primary'
              }`}
            >
              {shop.is_open ? 'Open Now' : 'Closed'}
            </span>
          </div>
          {shop.distance_km != null && (
            <div className="absolute top-3 right-3 bg-primary/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-secondary-fixed flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">near_me</span>
              {Number(shop.distance_km).toFixed(1)} km
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-display text-xl font-bold text-on-surface group-hover:text-secondary transition-colors">
                <Link to={`/shops/${shop.id}`}>{shop.name}</Link>
              </h3>
              <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-xs">location_on</span>
                <span className="truncate max-w-[200px]">{shop.address}</span>
              </p>
            </div>
            {shop.rating && (
              <div className="flex items-center gap-1 text-secondary text-xs font-bold">
                <span className="material-symbols-outlined text-sm">star</span>
                <span>{shop.rating}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 my-4 p-3 bg-surface-container rounded-xl text-center">
            <div className="border-r border-outline-variant/30">
              <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">
                Live Queue
              </span>
              <span className="font-display text-lg font-bold text-on-surface">
                {shop.queue_length ?? 0}{' '}
                <span className="text-xs font-normal text-on-surface-variant">waiting</span>
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">
                Est. Wait
              </span>
              <span className="font-display text-lg font-bold text-secondary">
                ~{shop.estimated_wait_min ?? 0}{' '}
                <span className="text-xs font-normal text-on-surface-variant">mins</span>
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Signature Service
            </span>
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-surface font-medium truncate">
                {service ? service.name : 'Grooming Services Available'}
              </span>
              <span className="font-semibold text-secondary shrink-0">
                {service ? `₹${service.price}` : ''}
              </span>
            </div>
            {shop.services?.length > 1 && (
              <p className="text-[10px] text-on-surface-variant">
                +{shop.services.length - 1} more services offered
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-2 border-t border-outline-variant/20 flex items-center justify-between mt-auto">
        <div className="text-[11px] text-on-surface-variant">
          <StaleLabel updatedAt={shop.last_updated_at} />
        </div>
        <Link
          to={`/shops/${shop.id}`}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-primary group-hover:text-secondary transition-colors"
        >
          View Details
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
    </article>
  )
}

