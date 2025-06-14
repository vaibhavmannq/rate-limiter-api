const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 1000 || 60000, // Convert to milliseconds
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 10,
  },
};

module.exports = config;
