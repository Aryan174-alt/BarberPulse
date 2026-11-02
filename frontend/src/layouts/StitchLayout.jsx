import { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearTokens } from '../api/api.js'

export default function StitchLayout() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const token = localStorage.getItem('queuenear_access')
  const role = localStorage.getItem('queuenear_role')
  const isSignedIn = !!token
  const isCustomer = role === 'customer'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function signOut() {
    clearTokens()
    navigate('/')
  }

  const navLinkClass = ({ isActive }) =>
    `text-xs uppercase tracking-[0.18em] transition-colors duration-200 pb-1 ${
      isActive
        ? 'text-primary font-semibold border-b-2 border-secondary'
        : 'text-on-surface-variant hover:text-primary'
    }`

  return (
    <div className="min-h-screen flex flex-col bg-[#fdf9f1] font-sans text-primary">
      {/* ── Header ────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 bg-[#fdf9f1]/95 backdrop-blur-md border-b transition-shadow duration-300 ${
          scrolled ? 'shadow-md border-[#e6e2da]' : 'border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-3 lg:py-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="material-symbols-outlined text-secondary text-[28px] group-hover:rotate-[-15deg] transition-transform duration-300">
              content_cut
            </span>
            <div className="leading-tight">
              <span className="text-lg font-display font-bold tracking-wide text-primary">
                Barber Pulse
              </span>
              <span className="hidden sm:block text-[9px] uppercase tracking-[0.28em] text-on-surface-variant/70">
                Atelier de Haute Beauté
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/salons" className={navLinkClass}>
              Explore Salons
            </NavLink>
            {isSignedIn && isCustomer && (
              <NavLink to="/queue" className={navLinkClass}>
                Live Queue
              </NavLink>
            )}
            {!isSignedIn && (
              <NavLink to="/owner/register" className={navLinkClass}>
                For Shop Owners
              </NavLink>
            )}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {!isSignedIn ? (
              <Link
                to="/login"
                className="text-xs uppercase tracking-[0.18em] text-on-surface-variant hover:text-primary transition-colors"
              >
                Sign In
              </Link>
            ) : (
              <button
                onClick={signOut}
                className="text-xs uppercase tracking-[0.18em] text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            )}
            <Link
              to="/salons"
              className="px-5 py-2 text-xs uppercase tracking-[0.18em] font-semibold bg-primary text-[#ffdea8] rounded border border-[#e2c28d]/40 hover:bg-primary/90 transition-colors"
            >
              Book Atelier
            </Link>
            <div className="w-8 h-8 rounded-full bg-[#e6e2da] border border-[#cfc5b8] flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-base">
                person
              </span>
            </div>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden flex flex-col gap-1.5 p-2 cursor-pointer"
            aria-label="Toggle navigation"
          >
            <span
              className={`block h-0.5 w-6 bg-primary rounded transition-transform duration-300 ${
                mobileOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-primary rounded transition-opacity duration-300 ${
                mobileOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-primary rounded transition-transform duration-300 ${
                mobileOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-[#fdf9f1] border-t border-[#e6e2da] px-5 pb-5 pt-3 space-y-4 animate-[slideDown_0.25s_ease-out]">
            <nav className="flex flex-col gap-4">
              <NavLink to="/" end className={navLinkClass} onClick={() => setMobileOpen(false)}>
                Home
              </NavLink>
              <NavLink to="/salons" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                Explore Salons
              </NavLink>
              {isSignedIn && isCustomer && (
                <NavLink to="/queue" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                  Live Queue
                </NavLink>
              )}
              {!isSignedIn && (
                <NavLink
                  to="/owner/register"
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  For Shop Owners
                </NavLink>
              )}
            </nav>
            <div className="flex items-center gap-4 pt-2 border-t border-[#e6e2da]">
              {!isSignedIn ? (
                <Link
                  to="/login"
                  className="text-xs uppercase tracking-[0.18em] text-on-surface-variant hover:text-primary transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
              ) : (
                <button
                  onClick={() => {
                    signOut()
                    setMobileOpen(false)
                  }}
                  className="text-xs uppercase tracking-[0.18em] text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              )}
              <Link
                to="/salons"
                className="px-5 py-2 text-xs uppercase tracking-[0.18em] font-semibold bg-primary text-[#ffdea8] rounded border border-[#e2c28d]/40"
                onClick={() => setMobileOpen(false)}
              >
                Book Atelier
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Page Content ──────────────────────────────────────── */}
      <main className="flex-1 pt-[68px]">
        <Outlet />
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#181310] text-[#ede0d9]">
        <div className="max-w-7xl mx-auto px-5 py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {/* Brand Column */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2.5 group">
                <span className="material-symbols-outlined text-secondary text-[28px] group-hover:rotate-[-15deg] transition-transform duration-300">
                  content_cut
                </span>
                <span className="text-lg font-display font-bold tracking-wide text-[#ede0d9]">
                  Barber Pulse
                </span>
              </Link>
              <p className="text-sm text-[#ede0d9]/60 leading-relaxed max-w-xs">
                Redefining the grooming experience. Discover premier salons, skip the wait, and
                indulge in the art of looking sharp.
              </p>
              <div className="flex gap-3 pt-2">
                {['favorite', 'star', 'verified'].map((icon) => (
                  <span
                    key={icon}
                    className="material-symbols-outlined text-secondary/60 text-xl hover:text-secondary transition-colors cursor-pointer"
                  >
                    {icon}
                  </span>
                ))}
              </div>
            </div>

            {/* The Portfolios */}
            <div>
              <h4 className="text-xs uppercase tracking-[0.28em] text-secondary mb-5 font-semibold">
                The Portfolios
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Explore Salons', to: '/salons' },
                  { label: 'Live Queue', to: '/queue' },
                  { label: 'Register Shop', to: '/owner/register' },
                ].map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="text-sm text-[#ede0d9]/70 hover:text-secondary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* The Collective */}
            <div>
              <h4 className="text-xs uppercase tracking-[0.28em] text-secondary mb-5 font-semibold">
                The Collective
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Our Story', to: '/' },
                  { label: 'The Artisans', to: '/' },
                  { label: 'Press', to: '/' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-sm text-[#ede0d9]/70 hover:text-secondary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-xs uppercase tracking-[0.28em] text-secondary mb-5 font-semibold">
                The Gazette
              </h4>
              <p className="text-sm text-[#ede0d9]/60 mb-4">
                Receive curated grooming insights &amp; exclusive atelier offers.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex rounded overflow-hidden border border-[#ede0d9]/20"
              >
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-[#ede0d9] placeholder:text-[#ede0d9]/40 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-secondary text-primary text-xs uppercase tracking-wider font-semibold hover:bg-secondary/90 transition-colors cursor-pointer"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-[#ede0d9]/10">
          <div className="max-w-7xl mx-auto px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-[#ede0d9]/40">
              &copy; {new Date().getFullYear()} Barber Pulse — QueueNear. All rights reserved.
            </p>
            <p className="text-xs text-[#ede0d9]/30">
              Crafted with precision &amp; passion.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
