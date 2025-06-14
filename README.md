# Rate Limiter API

A robust API rate limiter built with Node.js, Express, and Redis that implements sliding window rate limiting to prevent API abuse.

## Features

- **Sliding Window Rate Limiting**: Limits requests per IP address (default: 10 requests per minute)
- **Redis Backend**: Distributed rate limiting with Redis storage
- **Graceful Error Handling**: Continues to serve requests even if Redis is unavailable
- **Clean API Responses**: Proper HTTP status codes and error messages
- **Test Coverage**: Comprehensive unit tests with Jest and Supertest

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Redis server
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vaibhavmannq/rate-limiter-api.git
   cd rate-limiter-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration.

4. **Start Redis server**
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 --name redis redis:latest
   
   # Or start your local Redis installation
   ```

5. **Run the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Rate Limited Endpoints

All endpoints under `/api/*` are rate limited:

- `GET /api/test` - Test endpoint for rate limiting
- `GET /api/data` - Sample data endpoint
- `GET /api/items` - Get items
- `POST /api/items` - Create item

### Non-Rate Limited Endpoints

- `GET /health` - Health check endpoint

## Rate Limiting Configuration

| Setting | Default Value | Description |
|---------|---------------|-------------|
| Max Requests | 10 | Maximum requests per time window |
| Time Window | 60 seconds | Rate limiting window duration |
| Redis TTL | 60 seconds | Key expiration time in Redis |

## Example Usage

```bash
# Make a successful request
curl http://localhost:3000/api/test

# Make multiple requests to trigger rate limiting
for i in {1..15}; do curl http://localhost:3000/api/test; done
```

## Response Examples

### Successful Request (200)
```json
{
  "message": "API request successful",
  "timestamp": "2025-06-13T17:30:00.000Z",
  "ip": "127.0.0.1"
}
```

### Rate Limited Request (429)
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Max 10 requests per 60 seconds.",
  "retryAfter": 45
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `REDIS_URL` | Redis connection URL | redis://localhost:6379 |
| `RATE_LIMIT_WINDOW` | Time window in seconds | 60 |
| `RATE_LIMIT_MAX` | Max requests per window | 10 |
| `NODE_ENV` | Environment (development/production) | development |

## Testing

```bash
# Run all tests
npm test
```

## Development

```bash
# Start development server with auto-reload
npm run dev
```

## Docker Support

```bash
# Build Docker image
docker build -t rate-limiter-api .

# Run with Docker Compose
docker-compose up
```

## Monitoring Redis

Connect to Redis CLI:
```bash
redis-cli
```

### Common Redis Commands

```bash
# List all rate limit keys
127.0.0.1:6379> KEYS rate_limit:*

# Check current count for localhost (IPv6)
127.0.0.1:6379> GET rate_limit:::1

# Check time remaining until reset
127.0.0.1:6379> TTL rate_limit:::1

# Monitor all Redis operations in real-time
127.0.0.1:6379> MONITOR
```

## Redis Command Reference

### 🎯 Essential Redis Commands

```bash
# Check your current rate limit count
127.0.0.1:6379> GET rate_limit:::1

# Check time remaining until reset
127.0.0.1:6379> TTL rate_limit:::1

# List all rate limit keys
127.0.0.1:6379> KEYS rate_limit:*

# Monitor real-time Redis operations
127.0.0.1:6379> MONITOR
```

### 🧪 Testing Your Rate Limiter

```bash
# 1. Check current status
127.0.0.1:6379> GET rate_limit:::1
"3"

# 2. Make API request in another terminal:
curl http://127.0.0.1:3000/api/test

# 3. Check incremented count:
127.0.0.1:6379> GET rate_limit:::1
"4"

# 4. Check time remaining:
127.0.0.1:6379> TTL rate_limit:::1
(integer) 52
```

### 🛠️ Management Commands

```bash
# Reset your rate limit
127.0.0.1:6379> DEL rate_limit:::1

# Set custom count for testing
127.0.0.1:6379> SETEX rate_limit:::1 60 "9"

# Force to rate limit (set to 10)
127.0.0.1:6379> SETEX rate_limit:::1 60 "10"
```

### 🚀 Quick Rate Limit Test

```bash
# 1. Set yourself close to limit
127.0.0.1:6379> SETEX rate_limit:::1 60 "9"

# 2. Check it's set
127.0.0.1:6379> GET rate_limit:::1
"9"

# 3. Make one more request - should still work
curl http://127.0.0.1:3000/api/test

# 4. Make another request - should get 429 error
curl http://127.0.0.1:3000/api/test
```

### 📊 Monitor Multiple Requests

```bash
# Start monitoring
127.0.0.1:6379> MONITOR

# In another terminal, make rapid requests:
for /l %i in (1,1,15) do @curl http://127.0.0.1:3000/api/test

# You'll see Redis operations like:
# "GET" "rate_limit:::1"
# "INCR" "rate_limit:::1"
```

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌───────────┐
│   Client    │───▶│ Rate Limiter │───▶│   Redis   │
│             │    │  Middleware  │    │   Store   │
└─────────────┘    └──────────────┘    └───────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │ API Endpoints│
                   └──────────────┘
```

## Algorithm: Sliding Window

The rate limiter uses a sliding window algorithm:

1. **Request arrives** for IP address
2. **Check Redis** for existing counter
3. **If no counter exists**: Set counter to 1 with TTL
4. **If counter exists**: Check if limit exceeded
5. **If under limit**: Increment counter and allow request
6. **If over limit**: Return 429 error with retry information