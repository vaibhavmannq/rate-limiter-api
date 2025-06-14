const request = require('supertest');
const express = require('express');
const rateLimiter = require('../src/middleware/rateLimiter');
const apiRoutes = require('../src/routes/api');
const redisClient = require('../src/config/redis');

// Set test environment
process.env.NODE_ENV = 'test';

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.set('trust proxy', true);
  app.use('/api', rateLimiter);
  app.use('/api', apiRoutes);
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });
  return app;
};

describe('Rate Limiter API', () => {
  let app;
  
  beforeAll(async () => {
    // Connect Redis for tests
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });
  
  beforeEach(() => {
    app = createTestApp();
  });

  afterAll(async () => {
    // Close Redis connection after tests
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  });

  test('should allow requests under the limit', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);
    
    expect(response.body.message).toBe('API request successful');
  });

  test('should block requests over the limit', async () => {
    const testIP = `192.168.1.${Math.floor(Math.random() * 255)}`;
    
    const responses = [];
    for (let i = 0; i < 12; i++) {
      const response = await request(app)
        .get('/api/test')
        .set('X-Forwarded-For', testIP);
      responses.push(response);
    }
    
    const rateLimited = responses.some(res => res.status === 429);
    expect(rateLimited).toBe(true);
  }, 15000);

  test('health endpoint should not be rate limited', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
  });
});