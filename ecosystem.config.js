// PM2 config for the Hetzner VPS.
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
        HOSTNAME: '127.0.0.1',
        NEXT_PUBLIC_DEFAULT_LOCALE: 'ar',
        NEXT_PUBLIC_DATA_SOURCE: 'mock',
        NEXT_PUBLIC_ENABLE_FEEDBACK: 'true',
      },
      out_file: '/var/log/twingo-erp/out.log',
      error_file: '/var/log/twingo-erp/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
