import React, { useState, useEffect } from 'react';
import api from '../api/api';

function MEGAConnectionManager() {
  const [status, setStatus] = useState({
    isRunning: false,
    lastBackup: null,
    lastBackupFile: null,
    schedule: '0 2 * * *',
    maxBackups: 10,
    remotePath: '/Backups',
    email: '',
    history: [],
    megaCmdPath: ''
  });
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [showBackups, setShowBackups] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    checkStatus();
    getStorageInfo();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await api.get('/backup-manager/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to check status:', error);
      setMessage({ 
        text: '❌ Failed to check backup status', 
        type: 'error' 
      });
    }
  };

  const getStorageInfo = async () => {
    try {
      const response = await api.get('/backup-manager/storage');
      setStorageInfo(response.data);
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
  };

  const listBackups = async () => {
    setLoading(true);
    try {
      const response = await api.get('/backup-manager/list');
      setBackups(response.data);
      setShowBackups(true);
      setMessage({ 
        text: `✅ Found ${response.data.length} backups`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('Failed to list backups:', error);
      setMessage({ 
        text: `❌ Error: ${error.response?.data?.error || error.message}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerBackup = async () => {
    setLoading(true);
    try {
      const response = await api.post('/backup-manager/trigger');
      
      if (response.data.success) {
        setMessage({ 
          text: `✅ Backup created: ${response.data.filename || 'Success'}`, 
          type: 'success' 
        });
        await checkStatus();
        await getStorageInfo();
        if (showBackups) {
          await listBackups();
        }
      } else {
        setMessage({ 
          text: `❌ Backup failed: ${response.data.error}`, 
          type: 'error' 
        });
      }
    } catch (error) {
      setMessage({ 
        text: `❌ Error: ${error.response?.data?.error || error.message}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = async (filename) => {
    try {
      setMessage({ text: `📥 Downloading ${filename}...`, type: 'info' });
      
      const response = await api.get(`/backup-manager/download/${encodeURIComponent(filename)}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setMessage({ text: `✅ Downloaded ${filename}`, type: 'success' });
    } catch (error) {
      setMessage({ 
        text: `❌ Download failed: ${error.response?.data?.error || error.message}`, 
        type: 'error' 
      });
    }
  };

  const deleteBackup = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;
    
    setLoading(true);
    try {
      const response = await api.delete(`/backup-manager/delete/${encodeURIComponent(filename)}`);
      
      if (response.data.success) {
        setMessage({ text: `✅ Deleted ${filename}`, type: 'success' });
        await getStorageInfo();
        await listBackups();
      } else {
        setMessage({ text: `❌ Delete failed: ${response.data.error}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ 
        text: `❌ Error: ${error.response?.data?.error || error.message}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (filename) => {
    if (!window.confirm(`⚠️ Restoring will overwrite current data. Continue?`)) return;
    
    setLoading(true);
    try {
      const response = await api.post(`/backup-manager/restore/${encodeURIComponent(filename)}`);
      
      if (response.data.success) {
        setMessage({ text: `✅ Restored from ${filename}`, type: 'success' });
      } else {
        setMessage({ text: `❌ Restore failed: ${response.data.error}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ 
        text: `❌ Error: ${error.response?.data?.error || error.message}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await api.get('/backup-manager/test-connection');
      
      if (response.data.success) {
        setMessage({ 
          text: `✅ ${response.data.message} - ${response.data.account || ''}`, 
          type: 'success' 
        });
        if (response.data.storage) {
          setStorageInfo(response.data.storage);
        }
      } else {
        setMessage({ 
          text: `❌ ${response.data.message}`, 
          type: 'error' 
        });
      }
    } catch (error) {
      setMessage({ 
        text: `❌ Error: ${error.response?.data?.error || error.message}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getBackupInfo = async (filename) => {
    try {
      const response = await api.get(`/backup-manager/info/${encodeURIComponent(filename)}`);
      
      alert(`
Backup Info:
📄 Name: ${response.data.name}
📦 Size: ${formatBytes(response.data.size)}
📅 Date: ${response.data.date}
🔑 Permissions: ${response.data.permissions}
      `);
    } catch (error) {
      setMessage({ 
        text: `❌ Error: ${error.response?.data?.error || error.message}`, 
        type: 'error' 
      });
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Clear backup history?')) return;
    
    try {
      await api.post('/backup-manager/clear-history');
      await checkStatus();
      setMessage({ text: '✅ History cleared', type: 'success' });
    } catch (error) {
      setMessage({ 
        text: `❌ Error: ${error.message}`, 
        type: 'error' 
      });
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString || 'Never';
    }
  };

  const getCronDescription = (cronExpr) => {
    if (cronExpr === '0 2 * * *') return 'Daily at 2:00 AM';
    if (cronExpr === '0 */6 * * *') return 'Every 6 hours';
    if (cronExpr === '0 0 * * *') return 'Daily at midnight';
    return cronExpr;
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0">
          <i className="bi bi-cloud-arrow-up me-2"></i>
          MEGA Cloud Backup
        </h4>
        <span className={`badge ${status.isRunning ? 'bg-success' : 'bg-warning'}`}>
          {status.isRunning ? '🟢 Running' : '🟡 Idle'}
        </span>
      </div>
      
      <div className="card-body">
        {/* Account Info */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card bg-light">
              <div className="card-body">
                <h6 className="mb-3">Account Information</h6>
                <p className="mb-2">
                  <strong>Email:</strong> {status.email || 'Not logged in'}
                </p>
                <p className="mb-2">
                  <strong>Remote Path:</strong> {status.remotePath}
                </p>
                <p className="mb-2">
                  <strong>Schedule:</strong> {getCronDescription(status.schedule)}
                </p>
                <p className="mb-0">
                  <strong>Max Backups:</strong> {status.maxBackups}
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card bg-light">
              <div className="card-body">
                <h6 className="mb-3">Storage Usage</h6>
                {storageInfo ? (
                  <>
                    <p className="mb-2">
                      <strong>Used:</strong> {storageInfo.usedFormatted}
                    </p>
                    <p className="mb-2">
                      <strong>Total:</strong> {storageInfo.totalFormatted}
                    </p>
                    <div className="progress mb-2" style={{ height: '10px' }}>
                      <div 
                        className="progress-bar bg-info" 
                        role="progressbar" 
                        style={{ 
                          width: storageInfo.percentUsed === 'Unknown' ? '0%' : storageInfo.percentUsed 
                        }}
                        aria-valuenow={storageInfo.percentUsed} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                    </div>
                    <small className="text-muted">
                      {storageInfo.percentUsed} used
                    </small>
                  </>
                ) : (
                  <p className="mb-0 text-muted">Loading storage info...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Last Backup Info */}
        {status.lastBackup && (
          <div className="alert alert-info mb-4">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Last Backup:</strong> {formatDate(status.lastBackup)}
            {status.lastBackupFile && (
              <span> - <code>{status.lastBackupFile}</code></span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-flex gap-2 mb-4 flex-wrap">
          <button 
            className="btn btn-success"
            onClick={triggerBackup}
            disabled={loading}
          >
            <i className="bi bi-cloud-upload me-2"></i>
            Create MEGA Backup
          </button>
          
          <button 
            className="btn btn-info"
            onClick={listBackups}
            disabled={loading}
          >
            <i className="bi bi-list me-2"></i>
            {showBackups ? 'Refresh Backups' : 'List Backups'}
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={checkStatus}
            disabled={loading}
          >
            <i className="bi bi-arrow-repeat me-2"></i>
            Refresh Status
          </button>

          <button 
            className="btn btn-outline-primary"
            onClick={testConnection}
            disabled={loading}
          >
            <i className="bi bi-wifi me-2"></i>
            Test Connection
          </button>

          <button 
            className="btn btn-outline-secondary"
            onClick={getStorageInfo}
            disabled={loading}
          >
            <i className="bi bi-hdd-stack me-2"></i>
            Storage Info
          </button>

          <button 
            className="btn btn-outline-danger"
            onClick={clearHistory}
            disabled={loading}
          >
            <i className="bi bi-trash me-2"></i>
            Clear History
          </button>
        </div>

        {/* Backups List */}
        {showBackups && (
          <div className="mt-4">
            <h5 className="mb-3">
              <i className="bi bi-files me-2"></i>
              Available Backups {backups.length > 0 && `(${backups.length})`}
            </h5>
            
            {backups.length === 0 ? (
              <div className="alert alert-info">
                No backups found in MEGA cloud. Click "Create MEGA Backup" to create your first backup.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Size</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup, index) => (
                      <tr key={index}>
                        <td>
                          <i className="bi bi-file-zip me-2 text-primary"></i>
                          <code>{backup.name}</code>
                        </td>
                        <td>{backup.formattedSize || formatBytes(backup.size)}</td>
                        <td>{backup.formattedDate || formatDate(backup.createdTime || backup.date)}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => downloadBackup(backup.name)}
                              title="Download"
                            >
                              <i className="bi bi-download"></i>
                            </button>
                            <button
                              className="btn btn-outline-info"
                              onClick={() => getBackupInfo(backup.name)}
                              title="Info"
                            >
                              <i className="bi bi-info-circle"></i>
                            </button>
                            <button
                              className="btn btn-outline-warning"
                              onClick={() => restoreBackup(backup.name)}
                              title="Restore"
                            >
                              <i className="bi bi-arrow-repeat"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => deleteBackup(backup.name)}
                              title="Delete"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Backup History */}
        {status.history && status.history.length > 0 && (
          <div className="mt-4">
            <h6 className="mb-2">Recent Backup History</h6>
            <div className="list-group">
              {status.history.slice(0, 5).map((item, idx) => (
                <div key={idx} className="list-group-item list-group-item-action py-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small>
                        <i className="bi bi-clock me-2"></i>
                        {formatDate(item.date)}
                      </small>
                    </div>
                    <div>
                      <code className="small">{item.filename}</code>
                    </div>
                    <div>
                      <small className="text-muted">{formatBytes(item.size)}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Display */}
        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : message.type === 'info' ? 'info' : 'danger'} mt-4 mb-0`}>
            <i className={`bi bi-${message.type === 'success' ? 'check-circle' : message.type === 'info' ? 'info-circle' : 'exclamation-triangle'} me-2`}></i>
            {message.text}
          </div>
        )}

        {/* System Info */}
        <div className="mt-4 pt-3 border-top">
          <div className="row">
            <div className="col-md-6">
              <small className="text-muted d-block">
                <i className="bi bi-gear me-1"></i>
                Platform: {status.platform || 'unknown'}
              </small>
            </div>
            <div className="col-md-6 text-end">
              <small className="text-muted d-block">
                <i className="bi bi-folder me-1"></i>
                MEGAcmd: {status.megaCmdPath || 'Not set'}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MEGAConnectionManager;