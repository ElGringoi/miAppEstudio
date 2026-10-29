import { defineConfig } from 'vitest/config'

// Tests de lógica pura (sin DOM ni Firebase). Ver docs/06-calidad/estrategia-pruebas.md
export default defineConfig({
  test: {
    include: ['front/src/**/*.test.ts', 'server/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['front/src/utils/helpers.ts', 'front/src/utils/fecha.ts', 'front/src/utils/markdown.ts', 'server/cerebro/limites.ts'],
      reporter: ['text'],
    },
  },
})
