import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'

import { clearTokens } from './api/api.js'
import ChatWidget from './components/ChatWidget.jsx'
import JoinByQR from './pages/JoinByQR.jsx'
import Login from './pages/Login.jsx'
import MyQueue from './pages/MyQueue.jsx'
import NearbyShops from './pages/NearbyShops.jsx'
import OwnerDashboard from './pages/OwnerDashboard.jsx'
import OwnerRegister from './pages/OwnerRegister.jsx'
import ShopDetails from './pages/ShopDetails.jsx'

function Navigation() {
  const navigate = useNavigate()
  const signedIn = Boolean(localStorage.getItem('queuenear_access'))
  const role = localStorage.getItem('queuenear_role')

  function signOut() {
    clearTokens()
    navigate('/')
  }

  const linkClass = ({ isActive }) => `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`

  return (
    <header className="sticky top-0 z-[1000] border-b border-white/10 bg-[#10201d] text-white shadow-lg shadow-slate-950/10">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-white" to="/">
          <span className="grid size-10 place-items-center rounded-xl bg-amber-400 text-lg font-black text-[#10201d]">Q</span>
          <span>QueueNear<span className="text-amber-400">.</span></span>
        </Link>
        <div className="flex flex-wrap items-center gap-1">
          <NavLink className={linkClass} to="/">Nearby shops</NavLink>
          {signedIn && role === 'customer' && <NavLink className={linkClass} to="/queue">My queue</NavLink>}
          {signedIn && role === 'owner' && <NavLink className={linkClass} to="/owner">Owner</NavLink>}
          {!signedIn && <NavLink className={linkClass} to="/owner/register">For shop owners</NavLink>}
          {!signedIn && <NavLink className="ml-1 rounded-full bg-amber-400 px-5 py-2 text-sm font-bold text-[#10201d] transition hover:bg-amber-300" to="/login">Sign in</NavLink>}
          {signedIn && <button className={linkClass({ isActive: false })} onClick={signOut}>Sign out</button>}
        </div>
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#f5f4ef] text-slate-900">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-7 pb-32 sm:px-6 sm:py-10">
        <Routes>
          <Route path="/" element={<NearbyShops />} />
          <Route path="/shops/:shopId" element={<ShopDetails />} />
          <Route path="/queue" element={<MyQueue />} />
          <Route path="/login" element={<Login />} />
          <Route path="/owner/register" element={<OwnerRegister />} />
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/join/:shopId" element={<JoinByQR />} />
          <Route path="*" element={<p className="rounded-xl bg-white p-6">Page not found.</p>} />
        </Routes>
      </main>
      <ChatWidget />
    </div>
  )
}
