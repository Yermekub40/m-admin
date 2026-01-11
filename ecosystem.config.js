module.exports = {
  apps: [
    {
      name: 'm-admin',
      script: 'npm',
      args: 'run start',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5987,
       // HTTPS: 'true'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5987
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
    },
    {
      name: 'm-admin-ml-api',
      script: 'npm',
      args: 'run ml:start',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        ML_API_PORT: 5000
      },
      env_development: {
        NODE_ENV: 'development',
        ML_API_PORT: 5000
      },
      error_file: './logs/pm2-ml-api-error.log',
      out_file: './logs/pm2-ml-api-out.log',
      log_file: './logs/pm2-ml-api-combined.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      kill_timeout: 5000
    }
  ]
};

