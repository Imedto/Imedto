import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import eslint from 'vite-plugin-eslint'

// https://vitejs.dev/config/
export default async ({ mode }: { mode: string }) => {
  const env = await loadEnv(mode, process.cwd(), 'VITE_APP_')

  return defineConfig({
    base: env.VITE_APP_BASE_URL,
    define: {
      'import.meta.env': env,
      'process.env': env,
    },
    plugins: [vue(), eslint()],
    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },
    build: {
      target: 'esnext',
    },
  })
}
