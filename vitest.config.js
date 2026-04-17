import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig({ mode: 'test', command: 'serve' }),
  defineConfig({
    test: {
      environment: 'happy-dom',
      globals: true,
      setupFiles: ['./tests/setup/vitest.setup.js'],
      clearMocks: true,
      restoreMocks: true,
      unstubEnvs: true,
      coverage: {
        provider: 'v8',
        all: true,
        reporter: ['text', 'html'],
        reportsDirectory: './coverage',
        include: [
          'src/api/pv/*.js',
          'src/store/index.js',
          'src/store/modules/*.js'
        ],
        thresholds: {
          lines: 60,
          functions: 60,
          statements: 60,
          branches: 50
        }
      }
    }
  })
)
