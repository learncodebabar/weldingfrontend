import React, { useState, useEffect } from 'react';
import laborService from '../../../api/laborService';
import attendanceService from '../../../api/attendanceService';
import Sidebar from '../../../components/Sidebar/Sidebar';
import './AttendancePage.css';

// React Icons
import { 
  FaCalendarCheck, FaUserClock, 
  FaSearch, FaCheckCircle, 
  FaExclamationTriangle, FaSave, 
  FaSyncAlt, FaRegCalendarAlt, FaFilter, FaLock, FaEdit
} from 'react-icons/fa';

const AttendancePage = () => {
  const [labor, setLabor] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');

  // Check if selected date is today or in future
  const isToday = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const isPastDate = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString < today;
  };

  const isFutureDate = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString > today;
  };

  const canEditDate = (dateString) => {
    // Can only edit today's attendance
    return isToday(dateString);
  };

  // Fetch labor on component mount
  useEffect(() => {
    fetchLabor();
  }, []);

  // Fetch attendance when date changes
  useEffect(() => {
    if (labor.length > 0) {
      fetchAttendanceForDate(selectedDate);
    }
  }, [selectedDate, labor]);

  // Fetch labor from API
  const fetchLabor = async () => {
    try {
      setLoading(true);
      const response = await laborService.getAllLabor();
      // Only active workers
      const activeLabor = response.labor?.filter(l => l.employmentStatus === 'Active') || [];
      setLabor(activeLabor);
      
      // Initialize attendance data structure
      initializeAttendanceData(activeLabor, []);
      
    } catch (err) {
      setError('Failed to fetch labor data');
    } finally {
      setLoading(false);
    }
  };

  // Initialize attendance data based on labor and existing attendance
  const initializeAttendanceData = (laborList, existingAttendance) => {
    const initialData = {};
    
    // First set all to empty
    laborList.forEach(l => {
      initialData[l._id] = {
        status: '',
        attendanceId: null,
        isSaved: false,
        isEditing: false
      };
    });

    // Then override with existing attendance
    existingAttendance.forEach(a => {
      if (a.laborId && a.laborId._id) {
        initialData[a.laborId._id] = {
          status: a.status,
          attendanceId: a._id,
          isSaved: true,
          isEditing: false
        };
      }
    });

    setAttendanceData(initialData);
    setAttendance(existingAttendance);
  };

  // Fetch attendance for selected date
  const fetchAttendanceForDate = async (date) => {
    try {
      setLoading(true);
      const response = await attendanceService.getAttendanceByDate(date);
      const dateAttendance = response.attendance || [];
      
      // Update attendance data with existing records
      initializeAttendanceData(labor, dateAttendance);
      
    } catch (err) {
      console.error('Failed to fetch attendance for date:', err);
      // If error, initialize with empty data
      initializeAttendanceData(labor, []);
    } finally {
      setLoading(false);
    }
  };

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    // Attendance will be fetched via useEffect
  };

  // Toggle edit mode for a saved attendance
  const toggleEdit = (laborId) => {
    if (!canEditDate(selectedDate)) {
      setError('You can only edit today\'s attendance');
      return;
    }

    setAttendanceData(prev => ({
      ...prev,
      [laborId]: {
        ...prev[laborId],
        isEditing: !prev[laborId].isEditing,
        // Reset to original status when canceling edit
        ...(prev[laborId].isEditing && {
          status: prev[laborId].originalStatus || prev[laborId].status
        })
      }
    }));
  };

  // Handle status change for a worker
  const handleStatusChange = (laborId, status) => {
    const laborAtt = attendanceData[laborId];
    
    setAttendanceData(prev => ({
      ...prev,
      [laborId]: {
        ...prev[laborId],
        status: status,
        // If editing an existing record, mark as not saved
        isSaved: false,
        // Store original status when starting edit
        ...(laborAtt.isSaved && !laborAtt.isEditing && {
          originalStatus: laborAtt.status,
          isEditing: true
        })
      }
    }));
  };

  // Submit/Update attendance
  const handleSubmit = async (laborId) => {
    if (!canEditDate(selectedDate)) {
      setError('You can only edit today\'s attendance');
      return;
    }

    const data = attendanceData[laborId];
    if (!data.status) {
      setError('Please select a status');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      let response;
      
      if (data.attendanceId) {
        // Update existing attendance
        console.log(`Updating attendance ${data.attendanceId} with status: ${data.status}`);
        response = await attendanceService.updateAttendance(data.attendanceId, {
          status: data.status,
          date: selectedDate
        });
      } else {
        // Create new attendance
        console.log(`Creating attendance for labor ${laborId} with status: ${data.status}`);
        response = await attendanceService.markAttendance({
          laborId,
          date: selectedDate,
          status: data.status
        });
      }

      console.log('Attendance saved:', response);

      // Refresh attendance for the date
      await fetchAttendanceForDate(selectedDate);
      
      setSuccess('Attendance saved successfully!');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Failed to save attendance:', err);
      setError(err.message || 'Failed to save attendance');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit all attendance at once (for new records only)
  const handleSubmitAll = async () => {
    if (!canEditDate(selectedDate)) {
      setError('You can only mark attendance for today');
      return;
    }

    // Validate - at least one attendance marked
    const markedCount = Object.values(attendanceData).filter(d => d.status).length;
    if (markedCount === 0) {
      setError('Please mark at least one attendance');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const attendanceList = [];

      // Prepare attendance list for all marked workers
      Object.entries(attendanceData).forEach(([laborId, data]) => {
        // Only include if status is selected and not already saved
        if (data.status && !data.isSaved) {
          attendanceList.push({
            laborId,
            date: selectedDate,
            status: data.status
          });
        }
      });

      // If no new attendance to submit
      if (attendanceList.length === 0) {
        setError('No new attendance to submit');
        setSubmitting(false);
        return;
      }

      console.log('Submitting attendance list:', attendanceList);

      // Submit bulk attendance
      const response = await attendanceService.markBulkAttendance(attendanceList);
      
      console.log('Bulk attendance response:', response);
      
      // Show success message
      setSuccess(`✅ Successfully marked ${attendanceList.length} attendance records`);
      
      // Refresh attendance for the date
      await fetchAttendanceForDate(selectedDate);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Failed to submit attendance:', err);
      setError(err.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter labor based on search and status filter
  const filteredLabor = labor.filter(l => {
    // Search filter
    const matchesSearch = searchTerm ? (
      l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.mobile?.includes(searchTerm) ||
      l.cnic?.includes(searchTerm)
    ) : true;

    // Status filter
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      const laborStatus = attendanceData[l._id]?.status || '';
      if (filterStatus === 'marked') {
        matchesStatus = laborStatus !== '';
      } else if (filterStatus === 'unmarked') {
        matchesStatus = laborStatus === '';
      } else {
        matchesStatus = laborStatus === filterStatus;
      }
    }

    return matchesSearch && matchesStatus;
  });

  // Get status color (minimal)
  const getStatusColor = (status) => {
    switch(status) {
      case 'Present': return '#2563eb'; // Blue instead of green
      case 'Absent': return '#ef4444';
      case 'Leave': return '#f59e0b';
      case 'Half Day': return '#8b5cf6';
      case 'Overtime': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    if (!status) return '';
    return status.toLowerCase().replace(' ', '-');
  };

  // Calculate stats
  const markedCount = Object.values(attendanceData).filter(d => d.status).length;
  const savedCount = Object.values(attendanceData).filter(d => d.isSaved).length;
  const pendingCount = markedCount - savedCount;
  const totalWorkers = filteredLabor.length;
  
  const statusCounts = {
    present: Object.values(attendanceData).filter(d => d.status === 'Present').length,
    absent: Object.values(attendanceData).filter(d => d.status === 'Absent').length,
    leave: Object.values(attendanceData).filter(d => d.status === 'Leave').length,
    halfDay: Object.values(attendanceData).filter(d => d.status === 'Half Day').length,
    overtime: Object.values(attendanceData).filter(d => d.status === 'Overtime').length
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="attendance-page sideber-container-Mobile">
      <Sidebar />
      
      <div className="attendance-content">
        {/* Header */}
        <div className="attendance-header">
          <div className="header-left">
            <h1>
              <FaCalendarCheck /> Attendance 
            </h1>
            <p>Mark daily attendance for workers</p>
          </div>
          <div className="header-right">
            <div className="date-display">
              <FaRegCalendarAlt />
              <span>{formatDate(selectedDate)}</span>
              {isPastDate(selectedDate) && (
                <span className="past-date-badge">⏰ Past Date (Read Only)</span>
              )}
              {isFutureDate(selectedDate) && (
                <span className="future-date-badge">📅 Future Date</span>
              )}
              {isToday(selectedDate) && (
                <span className="today-badge">✅ Today</span>
              )}
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="success-message">
            <FaCheckCircle />
            <span>{success}</span>
            <button onClick={() => setSuccess('')}>×</button>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <FaExclamationTriangle />
            <span>{error}</span>
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Date Restriction Message */}
        {!canEditDate(selectedDate) && (
          <div className="warning-message">
            <FaLock /> You can only mark/update attendance for today's date. Past dates are view-only.
          </div>
        )}

        {/* Controls */}
        <div className="attendance-controls">
          <div className="date-picker">
            <FaRegCalendarAlt />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              max={new Date().toISOString().split('T')[0]} // Can't select future dates
            />
          </div>

          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search workers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="filter-dropdown">
            <FaFilter />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              disabled={submitting}
            >
              <option value="all">All Workers</option>
              <option value="marked">Marked</option>
              <option value="unmarked">Unmarked</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
              <option value="Half Day">Half Day</option>
              <option value="Overtime">Overtime</option>
            </select>
          </div>

          {canEditDate(selectedDate) && (
            <button 
              className="submit-all-btn"
              onClick={handleSubmitAll}
              disabled={submitting || pendingCount === 0}
            >
              <FaSave /> 
              {submitting ? 'Submitting...' : `Save All (${pendingCount})`}
            </button>
          )}
        </div>

        {/* Stats Summary Cards */}
        <div className="attendance-summary-cards">
          <div className="summary-card total">
            <span className="summary-label">Total Workers</span>
            <span className="summary-value">{totalWorkers}</span>
          </div>
          <div className="summary-card present">
            <span className="summary-label">Present</span>
            <span className="summary-value">{statusCounts.present}</span>
          </div>
          <div className="summary-card absent">
            <span className="summary-label">Absent</span>
            <span className="summary-value">{statusCounts.absent}</span>
          </div>
          <div className="summary-card leave">
            <span className="summary-label">Leave</span>
            <span className="summary-value">{statusCounts.leave}</span>
          </div>
          <div className="summary-card halfday">
            <span className="summary-label">Half Day</span>
            <span className="summary-value">{statusCounts.halfDay}</span>
          </div>
          <div className="summary-card overtime">
            <span className="summary-label">Overtime</span>
            <span className="summary-value">{statusCounts.overtime}</span>
          </div>
        </div>

        {/* Pending Save Indicator */}
        {pendingCount > 0 && canEditDate(selectedDate) && (
          <div className="pending-save-indicator">
            <span>⚠️ {pendingCount} unsaved changes</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading workers...</p>
          </div>
        ) : (
          <>
            {/* Attendance Table */}
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Worker Details</th>
                    <th>Contact</th>
                    <th>Per Day Rate</th>
                    <th>Attendance Status</th>
                    {canEditDate(selectedDate) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredLabor.length === 0 ? (
                    <tr>
                      <td colSpan={canEditDate(selectedDate) ? "5" : "4"} className="no-data">
                        <FaUserClock size={50} />
                        <p>No workers found</p>
                        {searchTerm && (
                          <button onClick={() => setSearchTerm('')}>
                            Clear Search
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredLabor.map(l => {
                      const laborAttendance = attendanceData[l._id] || {};
                      const isSaved = laborAttendance.isSaved;
                      const isEditing = laborAttendance.isEditing;
                      const isReadOnly = !canEditDate(selectedDate);
                      
                      return (
                        <tr key={l._id} className={isSaved ? 'saved-row' : ''}>
                          <td>
                            <div className="worker-cell">
                              <span className="worker-avatar">
                                {l.name?.charAt(0).toUpperCase()}
                              </span>
                              <div className="worker-info">
                                <span className="worker-name">{l.name}</span>
                                <small className="worker-father">F.Name {l.fatherName}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="contact-cell">
                              <div>{l.mobile}</div>
                            </div>
                          </td>
                          <td>
                            <span className="rate-badge">
                              Rs. {l.perDayRate?.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <div className="attendance-actions">
                              <select
                                className={`status-select ${getStatusBadgeClass(laborAttendance.status)}`}
                                value={laborAttendance.status || ''}
                                onChange={(e) => handleStatusChange(l._id, e.target.value)}
                                disabled={submitting || isReadOnly || (isSaved && !isEditing)}
                                style={{ 
                                  borderColor: getStatusColor(laborAttendance.status),
                                  borderWidth: '1px',
                                  borderStyle: 'solid',
                                  backgroundColor: 'transparent' // No background color
                                }}
                              >
                                <option value="">Select Status</option>
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="Leave">Leave</option>
                                <option value="Half Day">Half Day</option>
                                <option value="Overtime">Overtime</option>
                              </select>
                              
                              {isSaved && (
                                <span className="saved-badge" title="Saved to database">
                                  ✓
                                </span>
                              )}
                            </div>
                          </td>
                          {canEditDate(selectedDate) && (
                            <td>
                              <div className="action-buttons">
                                {isSaved && !isEditing && (
                                  <button
                                    className="edit-btn"
                                    onClick={() => toggleEdit(l._id)}
                                    disabled={submitting}
                                    title="Edit attendance"
                                  >
                                    <FaEdit />
                                  </button>
                                )}
                                
                                {(isEditing || !isSaved) && laborAttendance.status && (
                                  <button
                                    className="save-single-btn"
                                    onClick={() => handleSubmit(l._id)}
                                    disabled={submitting}
                                    title="Save changes"
                                  >
                                    <FaSave />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="mobile-view">
              {filteredLabor.length === 0 ? (
                <div className="no-data-card">
                  <FaUserClock size={40} />
                  <p>No workers found</p>
                </div>
              ) : (
                filteredLabor.map(l => {
                  const laborAttendance = attendanceData[l._id] || {};
                  const isReadOnly = !canEditDate(selectedDate);
                  
                  return (
                    <div key={l._id} className={`worker-card`}>
                      <div className="card-header">
                        <span className="worker-avatar">
                          {l.name?.charAt(0).toUpperCase()}
                        </span>
                        <div className="worker-info">
                          <h4>{l.name}</h4>
                          <p>{l.fatherName}</p>
                        </div>
                      </div>
                      
                      <div className="card-body">
                        <div className="info-row">
                          <span>Rate:</span>
                          <span className="rate">Rs. {l.perDayRate?.toLocaleString()}</span>
                        </div>
                        <div className="info-row">
                          <span>Status:</span>
                          <span className={`status-badge ${getStatusBadgeClass(laborAttendance.status)}`}>
                            {laborAttendance.status || 'Not marked'}
                          </span>
                        </div>
                      </div>
                      
                      {!isReadOnly && (
                        <div className="card-footer">
                          <select
                            className={`mobile-status-select ${getStatusBadgeClass(laborAttendance.status)}`}
                            value={laborAttendance.status || ''}
                            onChange={(e) => handleStatusChange(l._id, e.target.value)}
                            disabled={submitting}
                          >
                            <option value="">Select Status</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Leave">Leave</option>
                            <option value="Half Day">Half Day</option>
                            <option value="Overtime">Overtime</option>
                          </select>
                          
                          {laborAttendance.status && (
                            <button
                              className="mobile-save-btn"
                              onClick={() => handleSubmit(l._id)}
                              disabled={submitting}
                            >
                              <FaSave />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;