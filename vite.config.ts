import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss  from '@tailwindcss/vite';
// https://vite.dev/config/
export default defineConfig({
  server: {
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (
            id.includes('react') ||
            id.includes('react-dom') ||
            id.includes('scheduler') ||
            id.includes('react-router')
          ) return 'react-vendor';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts-vendor';
          if (id.includes('@radix-ui') || id.includes('lucide-react')) return 'ui-vendor';
          if (id.includes('zod') || id.includes('react-hook-form')) return 'forms-vendor';
        },
      },
    },
  },
  plugins: [react(), tailwindcss(),],
})
