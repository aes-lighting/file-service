const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { Readable } = require('stream');
const config = require('../config');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload - Upload file to file service
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { filename, metadata } = req.body;

    if (!filename) {
      return res.status(400).json({
        error: 'Missing filename parameter',
        hint: 'Filename format: DIRECTORY_SHIPMENT_TIMESTAMP_HASH.ext (e.g., INTAKE_SHIP-12345_2026-08-28T14-23-00_abc123.jpg)'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Prepare form data for file service using form-data package
    const formData = new FormData();
    const stream = Readable.from(req.file.buffer);
    formData.append('file', stream, req.file.originalname);
    formData.append('filename', filename);

    if (metadata) {
      formData.append('metadata', metadata);
    }

    // Upload to file service
    const fileServiceUrl = `${config.getFileServiceUrl()}/api/upload`;
    const response = await axios.post(fileServiceUrl, formData, {
      headers: {
        'X-API-Key': config.getFileServiceApiKey(),
        ...formData.getHeaders()
      },
      timeout: 30000
    });

    // Return success response
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: response.data.filename,
        directory: response.data.directory,
        size: response.data.size,
        uploadedAt: response.data.uploadedAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data?.error || 'File service error',
        details: error.message
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'File service is unavailable',
        details: `Cannot connect to ${config.getFileServiceUrl()}`
      });
    }

    res.status(500).json({
      error: 'Upload failed',
      details: error.message
    });
  }
});

// GET /api/upload/test - Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Upload endpoint is working',
    method: 'POST',
    endpoint: '/api/upload',
    fileService: config.getFileServiceUrl(),
    requiredFields: ['file', 'filename'],
    optionalFields: ['metadata']
  });
});

module.exports = router;
