const express = require('express');
const axios = require('axios');
const config = require('../config');

const router = express.Router();

// GET /api/status - Check file service status
router.get('/', async (req, res) => {
  try {
    const fileServiceUrl = `${config.getFileServiceUrl()}/api/health`;

    const response = await axios.get(fileServiceUrl, { timeout: 5000 });

    res.json({
      status: 'connected',
      railway: {
        status: 'running',
        url: `http://localhost:${config.getPort()}`
      },
      fileService: {
        status: response.data.status,
        url: config.getFileServiceUrl(),
        service: response.data.service,
        timestamp: response.data.timestamp
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status check error:', error.message);

    res.status(503).json({
      status: 'disconnected',
      railway: {
        status: 'running',
        url: `http://localhost:${config.getPort()}`
      },
      fileService: {
        status: 'unreachable',
        url: config.getFileServiceUrl(),
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
