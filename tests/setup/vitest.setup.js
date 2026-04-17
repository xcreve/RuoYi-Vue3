import { beforeEach, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  document.title = ''
  window.history.replaceState({}, '', '/login')
  vi.stubEnv('VITE_APP_BASE_API', '/dev-api')
  vi.stubEnv('VITE_APP_TITLE', 'MyEMS PV')
})
