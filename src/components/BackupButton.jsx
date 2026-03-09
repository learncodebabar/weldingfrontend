import React, { useState } from 'react';
import api from '../api/api';
import { useNotifications } from '../context/NotificationContext';

const BackupButton = () => {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const { addNotification } = useNotifications();

  const createBackup = async (type = 'full') => {
    if (loading) return;
    
    setLoading(true);
    try {
      let message = '';
      let apiUrl = ''; // Changed from 'url' to 'apiUrl'
      
      if (type === 'sql') {
        apiUrl = '/backup/sql';
        message = '📄 Generating SQL dump...';
      } else {
        apiUrl = '/backup/download?format=full';
        message = '📦 Creating full backup with uploads...';
      }
      
      addNotification('info', message);
      
      const response = await api.get(apiUrl, {
        responseType: 'blob',
        timeout: 300000 // 5 minutes
      });

      // Get filename from headers or generate one
      const contentDisposition = response.headers['content-disposition'];
      let filename = type === 'sql' 
        ? `database-backup-${new Date().toISOString().split('T')[0]}.sql`
        : `full-backup-${new Date().toISOString().split('T')[0]}.zip`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }

      // Create download link - use 'downloadUrl' instead of 'url'
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      addNotification('success', `✅ Backup downloaded: ${filename}`);
      
    } catch (error) {
      console.error('❌ Backup failed:', error);
      
      let errorMessage = 'Failed to create backup';
      if (error.response?.data?.error) {
        // Try to parse error from response
        try {
          const reader = new FileReader();
          reader.onload = function() {
            const errorData = JSON.parse(reader.result);
            errorMessage = errorData.error || errorMessage;
          };
          reader.readAsText(error.response.data);
        } catch (e) {
          // Ignore parsing error
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      addNotification('error', `❌ Backup failed: ${errorMessage}`);
    } finally {
      setLoading(false);
      setShowOptions(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      {showOptions && (
        <div style={{
          position: 'absolute',
          bottom: '70px',
          right: '0',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: '10px',
          minWidth: '200px'
        }}>
          <button
            onClick={() => createBackup('sql')}
            disabled={loading}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px',
              marginBottom: '5px',
              border: 'none',
              background: '#17a2b8',
              color: 'white',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            <i className="bi bi-file-text me-2"></i>
            SQL Only (Database)
          </button>
          <button
            onClick={() => createBackup('full')}
            disabled={loading}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px',
              border: 'none',
              background: '#28a745',
              color: 'white',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            <i className="bi bi-archive me-2"></i>
            Full Backup (DB + Uploads)
          </button>
        </div>
      )}
      
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={loading}
        style={{
          borderRadius: '50px',
          padding: '12px 24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: 'none',
          background: loading ? '#6c757d' : '#007bff',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Creating Backup...
          </>
        ) : (
          <>
            <i className="bi bi-cloud-download"></i>
            📥 Backup Options
          </>
        )}
      </button>
    </div>
  );
};

export default BackupButton;