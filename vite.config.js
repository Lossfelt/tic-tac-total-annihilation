import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Kildefilene bruker JSX i .js-filer (arv fra CRA). La plugin-react og esbuild
// tolke alt under src/ som JSX slik at vi slipper å rename hver fil.
export default defineConfig({
  plugins: [
    react({
      include: '**/*.{js,jsx}',
    }),
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    port: 3000,
  },
});
