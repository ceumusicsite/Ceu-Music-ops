import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import AutoImport from "unplugin-auto-import/vite";

const base = process.env.BASE_PATH || "/";
const isPreview = process.env.IS_PREVIEW ? true : false;
// https://vite.dev/config/
export default defineConfig({
  define: {
    __BASE_PATH__: JSON.stringify(base),
    __IS_PREVIEW__: JSON.stringify(isPreview),
    __READDY_PROJECT_ID__: JSON.stringify(process.env.PROJECT_ID || ""),
    __READDY_VERSION_ID__: JSON.stringify(process.env.VERSION_ID || ""),
    __READDY_AI_DOMAIN__: JSON.stringify(process.env.READDY_AI_DOMAIN || ""),
  },
  plugins: [
    react(),
    AutoImport({
      imports: [
        {
          react: [
            "React",
            "useState",
            "useEffect",
            "useContext",
            "useReducer",
            "useCallback",
            "useMemo",
            "useRef",
            "useImperativeHandle",
            "useLayoutEffect",
            "useDebugValue",
            "useDeferredValue",
            "useId",
            "useInsertionEffect",
            "useSyncExternalStore",
            "useTransition",
            "startTransition",
            "lazy",
            "memo",
            "forwardRef",
            "createContext",
            "createElement",
            "cloneElement",
            "isValidElement",
          ],
        },
        {
          "react-router-dom": [
            "useNavigate",
            "useLocation",
            "useParams",
            "useSearchParams",
            "Link",
            "NavLink",
            "Navigate",
            "Outlet",
          ],
        },
        // React i18n
        {
          "react-i18next": ["useTranslation", "Trans"],
        },
      ],
      dts: true,
    }),
  ],
  base,
  build: {
    sourcemap: true,
    outDir: "out",
    chunkSizeWarningLimit: 1000, // Aumentar limite para 1MB (padrão é 500KB)
    rollupOptions: {
      onwarn(warning, warn) {
        // Suprimir avisos sobre importações dinâmicas/estáticas misturadas
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
          warning.message?.includes('dynamically imported') ||
          warning.message?.includes('statically imported')
        ) {
          return;
        }
        warn(warning);
      },
      output: {
        // Code splitting manual para otimizar chunks
        manualChunks: {
          // Vendor chunks - bibliotecas principais
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'aws-vendor': ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
          'charts-vendor': ['recharts'],
          'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          'stripe-vendor': ['@stripe/react-stripe-js'],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    open: true,
    strictPort: false, // Permite usar outra porta se 3000 estiver ocupada
  },
  logLevel: 'warn', // Reduzir verbosidade dos logs
  optimizeDeps: {
    // Ignorar avisos sobre dependências otimizadas
    exclude: [],
  },
});
