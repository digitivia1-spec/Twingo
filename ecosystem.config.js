// PM2 config for the Hostinger VPS (srv1611023.hstgr.cloud).
// Deployed as /var/www/twingo-erp/ecosystem.config.js.

module.exports = {
  apps: [
    {
      name: 'twingo-erp',
      cwd: '/var/www/twingo-erp',
      script: 'server.js', // Next.js standalone output
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '800M',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // 0.0.0.0 (not 127.0.0.1) — prevents Next.js from emitting redirects
        // with "localhost:3000" as the canonical host when behind Nginx.
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_DEFAULT_LOCALE: 'ar',
        // Phase 3: run against Supabase. Keeps server-runtime process.env
        // consistent with the build-time inlined values. The service-role key
        // is NOT set here — it's provided at runtime via .env.local (secret).
        NEXT_PUBLIC_DATA_SOURCE: 'supabase',
        NEXT_PUBLIC_SUPABASE_URL: 'https://opqjsrmbivifjuhcjctt.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wcWpzcm1iaXZpZmp1aGNqY3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Nzk0ODgsImV4cCI6MjA5NjE1NTQ4OH0.DtbGSinutJz9X5hLC5TQz8erwVKNaH3M6TwfQvryeCA',
        NEXT_PUBLIC_ENABLE_FEEDBACK: 'true',
        // Fixes Next.js 15 "https://localhost:3000" self-fetch bug when
        // running behind an HTTPS-terminating reverse proxy (Nginx + Certbot).
        // Without this, internal RSC/middleware fetches use the external
        // scheme (https) against the internal host (localhost:3000) which
        // is plain HTTP → EPROTO SSL mismatch.
        __NEXT_PRIVATE_ORIGIN: 'http://127.0.0.1:3000',
      },
      out_file: '/var/log/twingo-erp/out.log',
      error_file: '/var/log/twingo-erp/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
