require('dotenv').config();
const express = require('express');
const path = require('path');
const config = require('./config');
const uploadRoutes = require('./routes/upload');
const statusRoutes = require('./routes/status');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/status', statusRoutes);

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AES File Service Relay',
    timestamp: new Date().toISOString(),
    fileServiceUrl: config.getFileServiceUrl()
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
const PORT = config.getPort();
const HOST = config.getHost();

app.listen(PORT, HOST, () => {
  console.log(`\n✓ File Service Relay started on http://${HOST}:${PORT}`);
  console.log(`✓ File Service URL: ${config.getFileServiceUrl()}`);
  console.log(`✓ API Key configured: ${config.getApiKey() ? 'Yes' : 'No'}`);
  console.log(`✓ Upload endpoint: POST /api/upload`);
  console.log(`✓ Status endpoint: GET /api/status`);
  console.log(`✓ Health check: GET /health`);
  console.log('\n📁 Ready to relay uploads!\n');
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});
