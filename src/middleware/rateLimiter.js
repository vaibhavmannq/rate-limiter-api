const redisClient = require('../config/redis');
const config = require('../config/config');

const rateLimiter = async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const window = config.rateLimit.windowMs / 1000; // Convert back to seconds for Redis
  const maxRequests = config.rateLimit.maxRequests;
  const key = `rate_limit:${ip}`;
  
  try {
    // Ensure Redis is connected
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    
    const current = await redisClient.get(key);
    
    if (current === null) {
      await redisClient.setEx(key, window, '1');
      return next();
    }
    
    if (parseInt(current) >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Max ${maxRequests} requests per ${window} seconds.`,
        retryAfter: await redisClient.ttl(key)
      });
    }
    
    await redisClient.incr(key);
    next();
    
  } catch (error) {
    console.error('Rate limiter error:', error);
    next(); // Allow request to proceed on Redis error
  }
};

module.exports = rateLimiter;