// Thin fetch wrapper for the Express backend.
// In development VITE_API_URL is empty and Vite proxies /api to localhost:5000.
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const TOKEN_KEY = 'token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Set by AuthProvider so an expired or invalid token logs the user out
let unauthorizedHandler = null
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload = body
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload, signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError("Can't reach the server. Check that the backend is running.", 0)
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) unauthorizedHandler?.()
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status)
  }
  return data
}

export const api = {
  health: () => request('/api/health'),

  register: ({ username, email, password }) =>
    request('/api/users/register', { method: 'POST', body: { username, email, password } }),

  login: ({ email, password }) =>
    request('/api/users/login', { method: 'POST', body: { email, password } }),

  getPosts: ({ signal } = {}) => request('/api/posts', { signal }),

  getMyPosts: ({ signal } = {}) => request('/api/posts/me', { signal }),

  createPost: ({ file, tone, length }) => {
    const form = new FormData()
    form.append('image', file)
    form.append('tone', tone)
    form.append('length', length)
    return request('/api/posts', { method: 'POST', body: form })
  },

  regenerateCaption: (id, { tone, length }) =>
    request(`/api/posts/${id}/regenerate`, { method: 'POST', body: { tone, length } }),

  deletePost: (id) => request(`/api/posts/${id}`, { method: 'DELETE' }),

  searchPosts: (query, { signal } = {}) =>
    request(`/api/posts/search?q=${encodeURIComponent(query)}`, { signal }),

  getSimilarPosts: (id, { signal } = {}) => request(`/api/posts/${id}/similar`, { signal }),
}
