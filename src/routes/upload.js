const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { Readable } = require('stream');
const config = require('../config');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload - Upload file to file service (legacy endpoint)
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

// Phase 2: POST /api/upload/packing-slip - Upload packing slip image
router.post('/packing-slip', upload.single('file'), async (req, res) => {
  try {
    const { po_number } = req.body;

    if (!po_number) {
      return res.status(400).json({
        error: 'Missing po_number parameter',
        hint: 'PO number format: NNNNN-XX (e.g., 26016-01)'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Prepare form data for file service
    const formData = new FormData();
    const stream = Readable.from(req.file.buffer);
    formData.append('file', stream, req.file.originalname);
    formData.append('po_number', po_number);

    // Forward to file-service-client backend
    const fileServiceUrl = `${config.getFileServiceUrl()}/api/upload/packing-slip`;
    const response = await axios.post(fileServiceUrl, formData, {
      headers: {
        'X-API-Key': config.getFileServiceApiKey(),
        ...formData.getHeaders()
      },
      timeout: 30000
    });

    // Return success response
    res.json(response.data);
  } catch (error) {
    console.error('Packing slip upload error:', error.message);

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
      error: 'Packing slip upload failed',
      details: error.message
    });
  }
});

// Phase 2: POST /api/upload/intake - Upload intake/content photo
router.post('/intake', upload.single('file'), async (req, res) => {
  try {
    const { po_number } = req.body;

    if (!po_number) {
      return res.status(400).json({
        error: 'Missing po_number parameter',
        hint: 'PO number format: NNNNN-XX (e.g., 26016-01)'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Prepare form data for file service
    const formData = new FormData();
    const stream = Readable.from(req.file.buffer);
    formData.append('file', stream, req.file.originalname);
    formData.append('po_number', po_number);

    // Forward to file-service-client backend
    const fileServiceUrl = `${config.getFileServiceUrl()}/api/upload/intake`;
    const response = await axios.post(fileServiceUrl, formData, {
      headers: {
        'X-API-Key': config.getFileServiceApiKey(),
        ...formData.getHeaders()
      },
      timeout: 30000
    });

    // Return success response
    res.json(response.data);
  } catch (error) {
    console.error('Intake photo upload error:', error.message);

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
      error: 'Intake photo upload failed',
      details: error.message
    });
  }
});

// GET /api/upload/test - Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Upload endpoint is working',
    legacy: {
      method: 'POST',
      endpoint: '/api/upload',
      requiredFields: ['file', 'filename'],
      optionalFields: ['metadata']
    },
    phase2: {
      packingSlip: {
        method: 'POST',
        endpoint: '/api/upload/packing-slip',
        requiredFields: ['file', 'po_number'],
        description: 'Upload packing slip image'
      },
      intakePhoto: {
        method: 'POST',
        endpoint: '/api/upload/intake',
        requiredFields: ['file', 'po_number'],
        description: 'Upload content/intake photo with auto-numbering'
      }
    },
    fileService: config.getFileServiceUrl()
  });
});

module.exports = router;
