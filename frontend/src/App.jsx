import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'

import { clearTokens } from './api/api.js'
import ChatWidget from './components/ChatWidget.jsx'
import JoinByQR from './pages/JoinByQR.jsx'
import Login from './pages/Login.jsx'
import MyQueue from './pages/MyQueue.jsx'
import NearbyShops from './pages/NearbyShops.jsx'
import OwnerDashboard from './pages/OwnerDashboard.jsx'
import ShopDetails from './pages/ShopDetails.jsx'

function Navigation() {
  const navigate = useNavigate()
  const signedIn = Boolean(localStorage.getItem('queuenear_access'))
  const role = localStorage.getItem('queuenear_role')

  function signOut() {
    clearTokens()
    navigate('/')
  }

  const linkClass = ({ isActive }) => `text-sm font-medium ${isActive ? 'text-blue-700' : 'text-slate-600 hover:text-slate-950'}`

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link className="text-xl font-extrabold tracking-tight text-slate-950" to="/">QueueNear</Link>
        <div className="flex flex-wrap items-center gap-4">
          <NavLink className={linkClass} to="/">Nearby shops</NavLink>
          {signedIn && role === 'customer' && <NavLink className={linkClass} to="/queue">My queue</NavLink>}
          {signedIn && role === 'owner' && <NavLink className={linkClass} to="/owner">Owner</NavLink>}
          {!signedIn && <NavLink className={linkClass} to="/login">Sign in</NavLink>}
          {signedIn && <button className="text-sm font-medium text-slate-600 hover:text-slate-950" onClick={signOut}>Sign out</button>}
        </div>
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8 pb-32">
        <Routes>
          <Route path="/" element={<NearbyShops />} />
          <Route path="/shops/:shopId" element={<ShopDetails />} />
          <Route path="/queue" element={<MyQueue />} />
          <Route path="/login" element={<Login />} />
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/join/:shopId" element={<JoinByQR />} />
          <Route path="*" element={<p className="rounded-xl bg-white p-6">Page not found.</p>} />
        </Routes>
      </main>
      <ChatWidget />
    </div>
  )
}
