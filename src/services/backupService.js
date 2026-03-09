class BackupService {
  constructor() {
    // Direct backend URL for testing
    this.directURL = 'http://localhost:3000';
    this.apiBase = '/api';
  }

  async testConnection() {
    // Try multiple methods
    const methods = [
      this.testViaProxy.bind(this),
      this.testDirect.bind(this)
    ];

    for (const method of methods) {
      try {
        const result = await method();
        if (result) return result;
      } catch (e) {
        console.log('Method failed:', e.message);
      }
    }
    
    throw new Error('All connection methods failed');
  }

  async testViaProxy() {
    console.log('Testing via proxy...');
    const response = await fetch('/api/ping', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async testDirect() {
    console.log('Testing direct connection...');
    const response = await fetch(`${this.directURL}/api/ping`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async downloadBackup() {
    // Try direct connection first for file downloads
    console.log('Downloading backup directly from:', `${this.directURL}/api/backup/download`);
    
    const response = await fetch(`${this.directURL}/api/backup/download`, {
      method: 'GET',
      headers: {
        'Accept': 'application/zip',
      },
      mode: 'cors'
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
    }

    return response;
  }
}

export default new BackupService();