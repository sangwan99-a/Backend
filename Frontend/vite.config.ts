let defineConfig: any;

try {
  defineConfig = require('vite').defineConfig;
} catch (e) {
  defineConfig = (config: any) => config;
}

import path from 'path';

let react: any;
let visualizer: any;
let compression: any;
let VitePWA: any;

try {
  react = require('@vitejs/plugin-react');
} catch (e) {
  react = () => ({});
}

try {
  visualizer = require('rollup-plugin-visualizer').visualizer;
} catch (e) {
  visualizer = () => ({});
}

try {
  compression = require('vite-plugin-compression').default;
} catch (e) {
  compression = () => ({});
}

try {
  VitePWA = require('vite-plugin-pwa').VitePWA;
} catch (e) {
  VitePWA = () => ({});
}

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-private-methods',
        ],
      },
    }),
    // PWA support
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'robots.txt',
        'apple-touch-icon.png',
        'icon-*.png',
        'icon-*-maskable.png',
      ],
      manifest: {
        name: 'FusionDesk - Unified Workspace',
        short_name: 'FusionDesk',
        description: 'Enterprise-grade unified workspace for collaboration and productivity',
        theme_color: '#0078d4',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot,wasm}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|woff|woff2)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
        suppressWarnings: true,
        navigateFallback: 'index.html',
        type: 'module',
      },
    }),
    // Bundle size visualization
    visualizer({
      filename: 'bundle-report.html',
      open: false,
      gzipSize: true,
    }),
    // Gzip compression for production
    compression({
      verbose: true,
      disable: false,
      threshold: 10240, // 10KB
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/modules': path.resolve(__dirname, './src/modules'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/styles': path.resolve(__dirname, './src/styles'),
    },
  },
  build: {
    // Target modern browsers only
    target: 'ES2020',
    
    // Output configuration
    outDir: 'dist',
    assetsDir: 'assets',
    
    // Enable source maps for debugging in production
    sourcemap: 'hidden', // .map files only, not included in bundle
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
    
    // Code splitting configuration
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-fluent': [
            '@fluentui/react-components',
            '@fluentui/react-icons',
            '@fluentui/react',
          ],
          'vendor-query': ['react-query', 'axios'],
          'vendor-state': ['zustand'],
          'vendor-utils': [
            'date-fns',
            'lodash-es',
            'uuid',
            'js-cookie',
            'recharts',
          ],
          'vendor-db': ['dexie'],
          'vendor-ws': ['ws', 'sockjs-client', 'stompjs'],
          
          // Feature chunks - lazy loaded
          'module-chat': [
            './src/components/Chat.tsx',
            './src/components/chat/**',
            './src/hooks/useChatData.ts',
            './src/services/chatDatabase.ts',
            './src/services/chatWebSocket.ts',
            './src/store/chatStore.ts',
          ],
          'module-calendar': [
            './src/components/Calendar.tsx',
            './src/components/calendar/**',
            './src/hooks/useCalendarData.ts',
            './src/services/calendarDatabase.ts',
            './src/services/calendarNotifications.ts',
            './src/store/calendarStore.ts',
          ],
          'module-email': [
            './src/components/Email.tsx',
            './src/components/email/**',
            './src/hooks/useEmailData.ts',
            './src/services/emailDatabase.ts',
            './src/services/emailNotifications.ts',
            './src/store/emailStore.ts',
          ],
          'module-tasks': [
            './src/components/Tasks.tsx',
            './src/components/tasks/**',
            './src/hooks/useTasksData.ts',
            './src/services/tasksDatabase.ts',
            './src/store/taskStore.ts',
          ],
          'module-admin': [
            './src/components/Admin.tsx',
            './src/hooks/useAdminData.ts',
            './src/services/adminAPIClient.ts',
            './src/store/adminStore.ts',
          ],
        },
        
        // Asset file names
        assetFileNames: (assetInfo: { name: string }) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/.test(ext)) {
            return `fonts/[name]-[hash][extname]`;
          } else if (ext === 'css') {
            return `css/[name]-[hash][extname]`;
          }
          return `[name]-[hash][extname]`;
        },
        
        // Chunk file names
        chunkFileNames: '[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
      },
    },
    
    // Performance hints
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1024, // 1MB warning threshold
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Asset inline limit
    assetsInlineLimit: 4096, // 4KB inline images
  },
  
  // Server configuration for development
  server: {
    port: 3010,
    strictPort: false,
    open: true,
    cors: true,
  },
  
  // Preview configuration
  preview: {
    port: 4173,
    strictPort: false,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@fluentui/react-components',
      '@fluentui/react-icons',
      'zustand',
      'react-query',
      'axios',
      'date-fns',
      'lodash-es',
      'dexie',
    ],
    exclude: ['electron'],
  },
});
