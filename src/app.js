const express = require('express');
const config = require('./config/config');
const rateLimiter = require('./middleware/rateLimiter');
const apiRoutes = require('./routes/api');
const redisClient = require('./config/redis');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);

// Apply rate limiter to all API routes
app.use('/api', rateLimiter);

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Connect Redis and start server (only if not in test environment)
if (config.nodeEnv !== 'test') {
  (async () => {
    try {
      await redisClient.connect();
      console.log('Redis connected successfully');
      
      app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
        console.log(`Environment: ${config.nodeEnv}`);
        console.log(`Redis URL: ${config.redis.url}`);
      });
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      process.exit(1);
    }
  })();
}

module.exports = app;