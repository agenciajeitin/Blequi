import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { blequiAgencyServerPlugin } from './server/agencyPlugin'

export default defineConfig({
  plugins: [react(), tailwindcss(), blequiAgencyServerPlugin()],
  resolve: {
    alias: {
      '@ambiente': path.resolve(__dirname, 'ambiente-3d'),
      '@funcionarios': path.resolve(__dirname, 'funcionarios'),
      '@projetos': path.resolve(__dirname, 'projetos'),
      '@plataforma': path.resolve(__dirname, 'plataforma'),
    },
  },
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/estado-mundo/**', '**/.blequi-backups/**'],
    },
  },
})
