const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();

// Configuration from environment
const API_KEY = process.env.API_KEY || 'test-api-key-12345';
const FILE_SERVICE_HOST = process.env.FILE_SERVICE_HOST || '127.0.0.1';
const FILE_SERVICE_PORT = process.env.FILE_SERVICE_PORT || 3001;
const FILE_SERVICE_API_KEY = process.env.FILE_SERVICE_API_KEY || 'test-api-key-12345';
const ENABLE_HEALTH = process.env.ENABLE_HEALTH_ENDPOINT !== 'false';
const ENABLE_STATUS = process.env.ENABLE_STATUS_ENDPOINT !== 'false';
const ENABLE_LIST = process.env.ENABLE_PROJECTS_LIST_ENDPOINT !== 'false';
const ENABLE_LOOKUP = process.env.ENABLE_PROJECT_LOOKUP_ENDPOINT !== 'false';
const ENABLE_UPLOAD = process.env.ENABLE_UPLOAD_ENDPOINT !== 'false';
const CORS_ENABLED = process.env.CORS_ENABLED === 'true';
const CORS_ORIGINS = process.env.CORS_ALLOWED_ORIGINS || 'localhost:3000,localhost:3001';

const BACKEND_URL = `http://${FILE_SERVICE_HOST}:${FILE_SERVICE_PORT}`;

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Validate file type - allow image files only
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${allowedMimes.join(', ')}`));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (if enabled)
if (CORS_ENABLED) {
  const allowedOrigins = CORS_ORIGINS.split(',').map(o => o.trim());
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
    }
    next();
  });
}

// API Key validation middleware for /api/* endpoints
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
  }
  next();
};

// Health check endpoint (no auth required)
if (ENABLE_HEALTH) {
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AES File Service Relay',
      timestamp: new Date().toISOString(),
      fileServiceUrl: BACKEND_URL
    });
  });
}

// Status endpoint - forwards to backend
if (ENABLE_STATUS) {
  app.get('/api/status', validateApiKey, async (req, res) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/status`, {
        headers: {
          'X-API-Key': FILE_SERVICE_API_KEY
        },
        timeout: 30000
      });
      res.json(response.data);
    } catch (err) {
      console.error('Status endpoint error:', err.message);
      res.status(err.response?.status || 500).json({
        error: 'Failed to get status',
        details: err.message
      });
    }
  });
}

// Get all projects endpoint - forwards to backend
if (ENABLE_LIST) {
  app.get('/api/projects', validateApiKey, async (req, res) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/projects`, {
        headers: {
          'X-API-Key': FILE_SERVICE_API_KEY
        },
        timeout: 30000
      });
      res.json(response.data);
    } catch (err) {
      console.error('Projects list error:', err.message);
      res.status(err.response?.status || 500).json({
        error: 'Failed to get projects',
        details: err.message
      });
    }
  });
}

// Get project by project number endpoint - forwards to backend
if (ENABLE_LOOKUP) {
  app.get('/api/projects/:projectNumber', validateApiKey, async (req, res) => {
    try {
      const projectNumber = req.params.projectNumber;

      // Query backend for project information
      const response = await axios.get(`${BACKEND_URL}/api/projects/${projectNumber}`, {
        headers: {
          'X-API-Key': FILE_SERVICE_API_KEY
        },
        timeout: 30000
      });

      // Ensure response has projectName field
      if (response.data && response.data.projectName) {
        res.json({
          projectNumber: projectNumber,
          projectName: response.data.projectName,
          ...response.data
        });
      } else if (response.data) {
        // If backend doesn't return projectName but has other data, try to extract it
        res.json(response.data);
      } else {
        res.status(404).json({
          error: 'Project not found',
          projectNumber: projectNumber
        });
      }
    } catch (err) {
      console.error('Project lookup error:', err.message);
      res.status(err.response?.status || 500).json({
        error: 'Failed to get project',
        details: err.message,
        projectNumber: req.params.projectNumber
      });
    }
  });
}

// Upload endpoints - forwards to backend
if (ENABLE_UPLOAD) {
  // Upload packing slip image
  app.post('/api/upload/packing-slip', validateApiKey, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided'
        });
      }

      const { po_number } = req.body;

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('po_number', po_number);
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });

      // Forward to backend with FILE_SERVICE_API_KEY
      const response = await axios.post(
        `${BACKEND_URL}/api/upload/packing-slip`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'X-API-Key': FILE_SERVICE_API_KEY
          },
          timeout: 30000
        }
      );

      res.json(response.data);
    } catch (err) {
      console.error('Packing slip upload error:', err.message);

      if (err.response) {
        // Backend returned an error
        res.status(err.response.status).json({
          success: false,
          error: err.response.data?.error || 'Upload failed',
          details: err.response.data?.details || err.message
        });
      } else {
        // Network or other error
        res.status(500).json({
          success: false,
          error: 'Upload failed',
          details: err.message
        });
      }
    }
  });

  // Upload intake photo
  app.post('/api/upload/intake', validateApiKey, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided'
        });
      }

      const { po_number } = req.body;

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('po_number', po_number);
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });

      // Forward to backend with FILE_SERVICE_API_KEY
      const response = await axios.post(
        `${BACKEND_URL}/api/upload/intake`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'X-API-Key': FILE_SERVICE_API_KEY
          },
          timeout: 30000
        }
      );

      res.json(response.data);
    } catch (err) {
      console.error('Intake upload error:', err.message);

      if (err.response) {
        // Backend returned an error
        res.status(err.response.status).json({
          success: false,
          error: err.response.data?.error || 'Upload failed',
          details: err.response.data?.details || err.message
        });
      } else {
        // Network or other error
        res.status(500).json({
          success: false,
          error: 'Upload failed',
          details: err.message
        });
      }
    }
  });
}

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

module.exports = app;
