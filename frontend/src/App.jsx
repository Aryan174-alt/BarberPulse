import { Routes, Route } from 'react-router-dom'
import StitchLayout from './layouts/StitchLayout.jsx'
import Home from './pages/Home.jsx'
import SalonDiscovery from './pages/SalonDiscovery.jsx'
import SalonDetails from './pages/SalonDetails.jsx'
import MyQueue from './pages/MyQueue.jsx'
import Login from './pages/Login.jsx'
import OwnerRegister from './pages/OwnerRegister.jsx'
import OwnerDashboard from './pages/OwnerDashboard.jsx'
import JoinByQR from './pages/JoinByQR.jsx'
import ChatWidget from './components/ChatWidget.jsx'

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<StitchLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/salons" element={<SalonDiscovery />} />
          <Route path="/shops/:shopId" element={<SalonDetails />} />
          <Route path="/queue" element={<MyQueue />} />
          <Route path="/login" element={<Login />} />
          <Route path="/owner/register" element={<OwnerRegister />} />
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/join/:shopId" element={<JoinByQR />} />
          <Route
            path="*"
            element={
              <div className="py-20 text-center space-y-4">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">search_off</span>
                <p className="font-display text-2xl font-bold text-on-surface">Page Not Found</p>
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                  The requested atelier destination does not exist.
                </p>
              </div>
            }
          />
        </Route>
      </Routes>
      <ChatWidget />
    </>
  )
}
