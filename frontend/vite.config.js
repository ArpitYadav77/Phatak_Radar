import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxy target: the origin of VITE_API_URL when it is absolute
// (e.g. http://localhost:5000/api -> http://localhost:5000), else local backend.
function apiProxyTarget(apiUrl) {
  try {
    const url = new URL(apiUrl)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.origin
  } catch {
    // relative URL such as "/api" — fall through to the local backend
  }
  return 'http://localhost:5000'
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiProxyTarget(env.VITE_API_URL),
          changeOrigin: true
        }
      }
    }
  }
})
