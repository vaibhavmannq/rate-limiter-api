// filepath: rate-limiter-api/src/routes/api.js
const express = require('express');
const router = express.Router();

// Example controller functions (to be implemented)
const getItems = (req, res) => {
    res.send('Get items');
};

const createItem = (req, res) => {
    res.send('Create item');
};

// Define API routes
router.get('/items', getItems);
router.post('/items', createItem);

router.get('/test', (req, res) => {
  res.json({
    message: 'API request successful',
    timestamp: new Date().toISOString(),
    ip: req.ip
  });
});

router.get('/data', (req, res) => {
  res.json({
    data: 'Some sample data',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;