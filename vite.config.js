import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { securityHeaders } from './scripts/security-headers.mjs';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Guard against deploying production build without Supabase configuration
  if (command === 'build' && mode === 'production') {
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
      throw new Error(
        '🚨 Production build blocked: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set for super-admin-app production builds.'
      );
    }
  }

  return {
    plugins: [react()],
    server: {
      // localhost by default; set VITE_DEV_HOST=0.0.0.0 to test from a phone on the LAN.
      host: env.VITE_DEV_HOST || 'localhost',
      port: 4176,
      strictPort: true
    },
    // `vite preview` serves the production build with the same security
    // headers as the hosting config.
    preview: {
      headers: securityHeaders(),
    },
  };
});
