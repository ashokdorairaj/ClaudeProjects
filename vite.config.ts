import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: process.env.NODE_ENV === 'production'
    ? '/ashokdorairaj/ClaudeProjects/FioriDemos/'
    : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/tokens': path.resolve(__dirname, 'src/tokens/index.ts'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
    },
  },
  build: {
    outDir: 'docs/FioriDemos',
    cssMinify: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@ui5/webcomponents')) return 'ui5-vendor'
          if (id.includes('node_modules/react')) return 'react-vendor'
        },
      },
    },
  },
})
