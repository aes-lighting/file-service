# File Service - Railway Upload Relay

A simple Node.js application deployed on Railway that relays file uploads to the AES File Service.

## Features

- 🌐 Clean web interface for file uploads
- 📤 Drag & drop file uploads
- 📊 Upload history tracking
- 🔗 API endpoints for programmatic uploads
- 🏥 Service health monitoring
- 📝 Comprehensive error messages

## Setup

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Railway account
- AES File Service running and accessible

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/aes-lighting/file-service.git
cd file-service
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your file service details:
```env
PORT=3000
HOST=0.0.0.0
FILE_SERVICE_HOST=71.172.107.128
FILE_SERVICE_PORT=3001
FILE_SERVICE_API_KEY=test-api-key-12345
NODE_ENV=development
```

5. Start the application:
```bash
npm start
```

6. Open http://localhost:3000 in your browser

## Railway Deployment

### 1. Connect GitHub Repository

1. Go to https://railway.app
2. Create a new project
3. Connect your GitHub repository
4. Railway will auto-detect the Node.js application

### 2. Configure Environment Variables

In Railway dashboard, add these variables:

```
PORT=3000
HOST=0.0.0.0
FILE_SERVICE_HOST=71.172.107.128
FILE_SERVICE_PORT=3001
FILE_SERVICE_API_KEY=test-api-key-12345
NODE_ENV=production
```

### 3. Deploy

Railway will automatically deploy when you push to GitHub.

## API Endpoints

### POST /api/upload

Upload a file to the file service.

**Request:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@myfile.jpg" \
  -F "filename=INTAKE_SHIP-12345_2026-08-28T14-30-00_abc123.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "filename": "INTAKE_SHIP-12345_2026-08-28T14-30-00_abc123.jpg",
    "directory": "INTAKE",
    "size": 12345,
    "uploadedAt": "2026-08-28T14:30:00.000Z"
  }
}
```

### GET /api/status

Check the status of both the Railway app and the file service.

**Request:**
```bash
curl http://localhost:3000/api/status
```

**Response:**
```json
{
  "status": "connected",
  "railway": {
    "status": "running",
    "url": "http://localhost:3000"
  },
  "fileService": {
    "status": "ok",
    "url": "http://71.172.107.128:3001",
    "service": "AES File Service V0"
  },
  "timestamp": "2026-08-28T14:30:00.000Z"
}
```

### GET /health

Health check endpoint.

**Request:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "AES File Service Relay",
  "timestamp": "2026-08-28T14:30:00.000Z",
  "fileServiceUrl": "http://71.172.107.128:3001"
}
```

### GET /

Web interface for file uploads.

Open http://localhost:3000 in your browser.

## Filename Format

Files must follow this format:
```
DIRECTORY_SHIPMENT_TIMESTAMP_HASH.ext
```

**Example:**
```
INTAKE_SHIP-12345_2026-08-28T14-30-00_abc123.jpg
DELIVERY_TRUCK-001_2026-08-28T15-00-00_def456.pdf
```

**Components:**
- `DIRECTORY`: One of `INTAKE`, `DELIVERY`, or `IN-TRANSIT`
- `SHIPMENT`: Unique shipment identifier
- `TIMESTAMP`: ISO timestamp without colons
- `HASH`: Random hash for uniqueness
- `ext`: File extension

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Port to run the app on |
| HOST | 0.0.0.0 | Host to bind to |
| FILE_SERVICE_HOST | localhost | File service hostname/IP |
| FILE_SERVICE_PORT | 3001 | File service port |
| FILE_SERVICE_API_KEY | - | API key for file service |
| NODE_ENV | development | Environment (development/production) |

## Troubleshooting

### "Cannot connect to file service"

1. Verify file service is running
2. Check `FILE_SERVICE_HOST` and `FILE_SERVICE_PORT` are correct
3. Verify the API key is correct
4. Check network connectivity and firewall rules

### "Upload failed"

1. Check the filename format
2. Verify the file size is within limits
3. Check available disk space on file service
4. Review error message in response

### Health check shows "disconnected"

1. File service may be down
2. Network connectivity issue
3. Check firewall/security settings
4. Verify IP address and port configuration

## Development

### Project Structure

```
.
├── src/
│   ├── index.js          # Main entry point
│   ├── config.js         # Configuration management
│   └── routes/
│       ├── upload.js     # Upload endpoints
│       └── status.js     # Status endpoints
├── public/
│   └── index.html        # Web UI
├── package.json
├── .env.example          # Environment template
├── .gitignore
├── Dockerfile
├── railway.json          # Railway config
└── README.md
```

### Running Tests

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Create an issue on GitHub

---

**File Service Relay** - Deployed on Railway
