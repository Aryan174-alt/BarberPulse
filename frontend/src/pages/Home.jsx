import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { shopsApi } from '../api/api.js'
import SalonCard from '../components/SalonCard.jsx'

export default function Home() {
  const [featuredShops, setFeaturedShops] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    shopsApi.nearby({ lat: 26.9124, lon: 75.7873, radius_km: 25 })
      .then(({ data }) => setFeaturedShops(data.slice(0, 3)))
      .catch(() => setFeaturedShops([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-container-high border border-outline-variant/30 px-6 py-20 md:py-28 text-center flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs uppercase tracking-widest font-semibold mb-6">
          <span className="material-symbols-outlined text-sm">sparkles</span>
          Editorial Luxury Grooming
        </div>
        <h1 className="max-w-4xl font-display text-4xl sm:text-5xl md:text-6xl text-primary font-bold tracking-tight leading-tight mb-6">
          The Art of Precision. <br />
          <span className="italic font-normal text-secondary">Zero Queue Wait.</span>
        </h1>
        <p className="max-w-xl text-on-surface-variant text-base sm:text-lg mb-10 leading-relaxed">
          Reserve signature grooming slots and live-track salon queues in real time. Crafted exclusively for discerning gentlemen and luxury salons.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/salons"
            className="px-8 py-4 rounded-xl bg-primary text-secondary-fixed text-xs uppercase font-bold tracking-widest hover:bg-primary-container transition-all shadow-lg flex items-center gap-2"
          >
            <span>Explore Ateliers</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
          <Link
            to="/owner/register"
            className="px-8 py-4 rounded-xl bg-surface-container border border-outline-variant/50 text-on-surface text-xs uppercase font-bold tracking-widest hover:bg-surface-container-highest transition-all"
          >
            List Your Atelier
          </Link>
        </div>
      </section>

      {/* Philosophy / Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-8 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-2xl">radar</span>
            </div>
            <h3 className="font-display text-xl font-bold text-on-surface mb-3">
              Live Queue Tracking
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Transparent live wait times calibrated by real-time atelier throughput. Arrive exactly when your chair is ready.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wider">
            <span>Synchronized Wait</span>
            <span className="material-symbols-outlined text-sm">trending_flat</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-8 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <h3 className="font-display text-xl font-bold text-on-surface mb-3">
              Curated Craftsmanship
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Every master barber and boutique salon is vetted for uncompromising standards of hygiene, technique, and bespoke care.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wider">
            <span>Verified Masters</span>
            <span className="material-symbols-outlined text-sm">trending_flat</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-8 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-2xl">qr_code_2</span>
            </div>
            <h3 className="font-display text-xl font-bold text-on-surface mb-3">
              Seamless QR Entry
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Walk-in customers join immediately via our front-desk QR code, receiving SMS updates and automated reminders.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wider">
            <span>Instant Access</span>
            <span className="material-symbols-outlined text-sm">trending_flat</span>
          </div>
        </div>
      </section>

      {/* Featured Ateliers */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-secondary block mb-2">
              Featured Ateliers
            </span>
            <h2 className="font-display text-3xl font-bold text-on-surface">
              Premier Salons in Spotlight
            </h2>
          </div>
          <Link
            to="/salons"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors"
          >
            <span>View All Salons</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-surface-container rounded-2xl" />
            ))}
          </div>
        ) : featuredShops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredShops.map((shop) => (
              <SalonCard key={shop.id} shop={shop} />
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl p-12 text-center border border-outline-variant/30">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">storefront</span>
            <p className="text-on-surface font-display text-lg font-bold">No ateliers found yet</p>
            <p className="text-on-surface-variant text-sm mt-1">Be the first salon to register in this region.</p>
            <Link
              to="/owner/register"
              className="mt-4 inline-block px-5 py-2.5 rounded-lg bg-primary text-secondary-fixed text-xs uppercase font-bold tracking-wider"
            >
              Register Atelier
            </Link>
          </div>
        )}
      </section>

      {/* Quote / Editorial Manifesto */}
      <section className="rounded-3xl bg-primary text-on-primary p-10 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-2xl space-y-4">
          <span className="text-xs uppercase tracking-widest text-secondary-fixed font-semibold">
            The Barber Pulse Standard
          </span>
          <blockquote className="font-display text-2xl sm:text-3xl font-medium leading-relaxed italic text-surface-container-lowest">
            "True luxury is not merely impeccable technique; it is absolute respect for the gentleman's time."
          </blockquote>
          <p className="text-sm text-on-primary-container">
            Atelier Collective &bull; Founded on the premise of zero waiting, effortless queue transparency, and artisan grooming.
          </p>
        </div>
        <Link
          to="/salons"
          className="shrink-0 px-8 py-4 rounded-xl bg-secondary text-on-secondary text-xs uppercase font-bold tracking-widest hover:bg-secondary/90 transition-all shadow-md"
        >
          Discover Experience
        </Link>
      </section>
    </div>
  )
}

