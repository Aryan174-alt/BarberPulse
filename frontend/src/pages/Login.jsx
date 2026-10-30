import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { authApi, saveTokens } from '../api/api.js'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [register, setRegister] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', role: 'customer', phone: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data } = register
        ? await authApi.register(form)
        : await authApi.login({ username: form.username, password: form.password })
      const role = data.user?.role || form.role
      saveTokens(data, role)
      const requestedPath = new URLSearchParams(location.search).get('next')
      const safeNextPath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : null
      navigate(role === 'owner' ? '/owner' : safeNextPath || '/queue')
    } catch (requestError) {
      const detail = requestError.response?.data
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail || 'Could not sign in.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-950">{register ? 'Create account' : 'Sign in'}</h1>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-medium text-slate-700">
          Username
          <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="username" value={form.username} onChange={update} autoComplete="username" required />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="password" type="password" value={form.password} onChange={update} autoComplete={register ? 'new-password' : 'current-password'} required />
        </label>
        {register && (
          <>
            <label className="block text-sm font-medium text-slate-700">
              Phone (optional)
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" name="phone" value={form.phone} onChange={update} />
            </label>
          </>
        )}
        {error && <p className="break-words rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
        <button className="w-full rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={busy}>
          {busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
        </button>
      </form>
      <button className="mt-4 text-sm font-medium text-blue-700" onClick={() => setRegister(!register)}>
        {register ? 'Already have an account? Sign in' : 'Create a customer or owner account'}
      </button>
      <p className="mt-4 text-sm text-slate-600">
        Own a barber shop? <Link className="font-medium text-blue-700" to="/owner/register">Register your shop</Link>
      </p>
    </section>
  )
}
