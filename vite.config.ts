
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Try to load local mkcert-generated certs from ./certs
const certDir = path.resolve(__dirname, 'certs')
let httpsConfig: false | { key: Buffer; cert: Buffer } = false
try {
  if (fs.existsSync(certDir)) {
    const files = fs.readdirSync(certDir)
    // find a .pem (not the key) and the corresponding -key.pem
    const pem = files.find((f) => /localhost.*\.pem$/.test(f) && !f.includes('-key'))
    const key = files.find((f) => /localhost.*-key\.pem$/.test(f))
    if (pem && key) {
      httpsConfig = {
        key: fs.readFileSync(path.join(certDir, key)),
        cert: fs.readFileSync(path.join(certDir, pem)),
      }
    }
  }
} catch (e) {
  httpsConfig = false
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  server: {
    host: '0.0.0.0',
    https: false, // Desactivado temporalmente para ngrok
    allowedHosts: [
      '.loca.lt',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok-free.dev',
      'localhost',
      '192.168.10.169'
    ],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: false,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Preservar la IP real del cliente
            const realIp = req.socket.remoteAddress || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            if (realIp) {
              proxyReq.setHeader('X-Real-IP', realIp);
              proxyReq.setHeader('X-Forwarded-For', realIp);
            }
          });
        }
      }
    }
  },
})
