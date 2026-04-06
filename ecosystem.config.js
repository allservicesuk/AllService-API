/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * PM2 ecosystem configuration for clustered runtime with graceful shutdown and ready signalling.
 */
module.exports = {
  apps: [
    {
      name: 'allservices-api',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      kill_timeout: 30000,
      listen_timeout: 10000,
      wait_ready: true,
      max_restarts: 10,
      restart_delay: 1000,
      error_file: '/dev/null',
      out_file: '/dev/null',
      merge_logs: true,
    },
  ],
};
