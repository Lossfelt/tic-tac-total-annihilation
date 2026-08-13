import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Filer med JSX har filendelsen .jsx, så plugin-react finner dem selv. Vi
// hadde tidligere JSX i .js-filer (arv fra CRA), noe som krevde en egen
// esbuild-loader her. Det oppsettet finnes ikke i Vite 8, som bygger på
// rolldown i stedet for esbuild.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});
