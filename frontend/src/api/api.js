import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
const client = axios.create({ baseURL, timeout: 10000 })

client.interceptors.request.use((config) => {
  const access = localStorage.getItem('queuenear_access')
  if (access) config.headers.Authorization = `Bearer ${access}`
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const refresh = localStorage.getItem('queuenear_refresh')
    if (error.response?.status === 401 && refresh && !original?._retried) {
      original._retried = true
      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh/`, { refresh })
        localStorage.setItem('queuenear_access', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return client(original)
      } catch {
        localStorage.removeItem('queuenear_access')
        localStorage.removeItem('queuenear_refresh')
      }
    }
    return Promise.reject(error)
  },
)

export const authApi = {
  register: (payload) => client.post('/auth/register/', payload),
  registerOwnerShop: (payload) => client.post('/auth/register/owner/', payload),
  login: (payload) => client.post('/auth/login/', payload),
}

export const shopsApi = {
  nearby: (params) => client.get('/shops/nearby/', { params }),
  detail: (id) => client.get(`/shops/${id}/`),
  join: (id, serviceId) => client.post(`/shops/${id}/queue/`, { service_id: serviceId }),
  walkIn: (id, payload) => client.post(`/shops/${id}/walk-in/`, payload),
  search: (params) => client.get('/shops/search/', { params }),
}

export const queueApi = {
  mine: () => client.get('/queue/me/'),
  cancel: (id) => client.delete(`/queue/${id}/`),
  ownerShop: () => client.get('/owner/shop/'),
  updateOwnerShop: (payload) => client.patch('/owner/shop/', payload),
  ownerQueue: () => client.get('/owner/queue/'),
  ownerAction: (id, action) => client.post(`/owner/queue/${id}/${action}/`),
}

export const assistantApi = {
  chat: (message, location) => client.post('/assistant/chat/', { message, ...location }),
}

export function saveTokens(data, role = null) {
  localStorage.setItem('queuenear_access', data.access)
  if (data.refresh) localStorage.setItem('queuenear_refresh', data.refresh)
  if (role) localStorage.setItem('queuenear_role', role)
}

export function clearTokens() {
  localStorage.removeItem('queuenear_access')
  localStorage.removeItem('queuenear_refresh')
  localStorage.removeItem('queuenear_role')
}
