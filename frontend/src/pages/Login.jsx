import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, saveTokens } from '../api/api.js'

export default function SignIn() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data } = await authApi.login(form)
      saveTokens(data, data.role)
      if (data.role === 'owner') {
        navigate('/owner')
      } else {
        navigate('/salons')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or credentials.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-8 sm:p-10 shadow-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/10 text-secondary mb-3">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-on-surface">Atelier Access</h1>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant mt-2">
            Sign in to your client or proprietor portfolio
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error-container/40 border border-error/20 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2">
              Username
            </label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface text-sm focus:border-secondary focus:outline-none transition-colors"
              placeholder="Enter your registered username"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface text-sm focus:border-secondary focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-4 mt-2 rounded-xl bg-primary text-secondary-fixed text-xs uppercase font-bold tracking-widest hover:bg-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {busy ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Atelier</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/20 text-center space-y-3">
          <p className="text-xs text-on-surface-variant">
            Proprietor wanting to register your salon?{' '}
            <Link to="/owner/register" className="font-semibold text-secondary hover:underline">
              Create an account
            </Link>
          </p>
          <p className="text-xs text-on-surface-variant">
            Looking to browse?{' '}
            <Link to="/salons" className="font-semibold text-primary hover:underline">
              Explore Salons
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
