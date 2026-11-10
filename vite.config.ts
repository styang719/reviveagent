import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

// Two apps: the agent prototype (index.html) and the Flip360 opportunity map (flip360.html, served at /flip360).
const flip360Route = (): Plugin => ({
  name: 'flip360-route',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url && /^\/flip360\/?(\?.*)?$/.test(req.url)) req.url = req.url.replace(/^\/flip360\/?/, '/flip360.html')
      next()
    })
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), flip360Route()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        flip360: fileURLToPath(new URL('./flip360.html', import.meta.url)),
      },
    },
  },
})
