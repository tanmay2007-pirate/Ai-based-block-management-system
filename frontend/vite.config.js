import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/react-big-calendar/')) return 'calendar-vendor';
          if (id.includes('/node_modules/recharts/')) return 'charts-vendor';
          if (id.includes('/node_modules/d3')) return 'd3-vendor';
          return undefined;
        },
      },
    },
  },
});
