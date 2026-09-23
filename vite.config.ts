import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { aiChatDevPlugin } from './src/server/devApiPlugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), aiChatDevPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    watch: {
      ignored: ['**/*.exe', '**/*.log', '**/tunnel.js']
    }
  }
});
