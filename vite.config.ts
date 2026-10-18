import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('firebase') || id.includes('@firebase')) return 'vendor-firebase';
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            return 'vendor';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr:
        process.env.DISABLE_HMR === 'true'
          ? false
          : process.env.VITE_HMR_PORT
            ? { port: Number(process.env.VITE_HMR_PORT) }
            : true,
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/*.docx', '**/*.vsdx', '**/*.xlsx', '**/*.pptx', '**/~$*', '**/*.pdf', '**/*.png', '**/*.jpg', '**/*.tmp', '**/*.log', '**/.git/**', '**/scratch/**'],
      },
    },
  };
});
