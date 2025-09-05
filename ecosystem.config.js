module.exports = {
  apps: [
    {
      name: 'tippingpoint-configurator',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/opt/tippingpointconfigurator',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      // Logging
      log_file: '/var/log/tippingpoint-configurator/combined.log',
      out_file: '/var/log/tippingpoint-configurator/out.log',
      error_file: '/var/log/tippingpoint-configurator/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process management
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 5,
      autorestart: true,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Performance
      node_args: '--max-old-space-size=2048',
      
      // Environment-specific overrides
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001
      },
      
      // Watch and restart (disable in production)
      watch: false,
      ignore_watch: [
        'node_modules',
        '.next',
        'logs',
        '*.log'
      ]
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/tclabsjay/tippingpointconfigurator.git',
      path: '/opt/tippingpointconfigurator',
      'post-deploy': 'npm ci --production && npm run build && pm2 reload ecosystem.config.js --env production && pm2 save',
      'pre-setup': 'sudo mkdir -p /opt/tippingpointconfigurator && sudo chown deploy:deploy /opt/tippingpointconfigurator'
    },
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/tclabsjay/tippingpointconfigurator.git',
      path: '/opt/tippingpointconfigurator-staging',
      'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.config.js --env staging && pm2 save'
    }
  }
};
