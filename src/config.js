class Config {
  constructor() {
    // File service connection details
    this.fileServiceHost = process.env.FILE_SERVICE_HOST || 'localhost';
    this.fileServicePort = process.env.FILE_SERVICE_PORT || 3001;
    this.fileServiceApiKey = process.env.FILE_SERVICE_API_KEY || 'test-api-key-12345';

    // Server configuration
    this.port = parseInt(process.env.PORT) || 3000;
    this.host = process.env.HOST || '0.0.0.0';

    // Environment
    this.env = process.env.NODE_ENV || 'development';

    this.validate();
  }

  validate() {
    if (!this.fileServiceHost) {
      throw new Error('FILE_SERVICE_HOST environment variable is required');
    }
    if (!this.fileServicePort) {
      throw new Error('FILE_SERVICE_PORT environment variable is required');
    }
    if (!this.fileServiceApiKey) {
      throw new Error('FILE_SERVICE_API_KEY environment variable is required');
    }
  }

  getFileServiceUrl() {
    return `http://${this.fileServiceHost}:${this.fileServicePort}`;
  }

  getFileServiceApiKey() {
    return this.fileServiceApiKey;
  }

  getPort() {
    return this.port;
  }

  getHost() {
    return this.host;
  }

  getApiKey() {
    return this.fileServiceApiKey;
  }

  getEnvironment() {
    return this.env;
  }

  isProduction() {
    return this.env === 'production';
  }
}

module.exports = new Config();
