import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En producción /api/edicion es una función de Vercel (api/edicion.ts).
// En desarrollo la sirve este middleware con la misma lógica.
function diarioApiDev(): Plugin {
  return {
    name: 'diario-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/edicion', async (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        try {
          const mod = (await server.ssrLoadModule('/server/diario/edicion.ts')) as typeof import('./server/diario/edicion')
          const { edicion } = await mod.obtenerEdicion()
          res.end(JSON.stringify(edicion))
        } catch (e) {
          server.config.logger.error(`[diario] ${e instanceof Error ? e.stack ?? e.message : String(e)}`)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'No se pudo armar la edición' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [tailwindcss(), react(), diarioApiDev()],
})
