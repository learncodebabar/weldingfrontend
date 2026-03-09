import { useState, useEffect } from "react";
import api from "../../api/api";
import { useNotifications } from "../../context/NotificationContext";
import { API_ENDPOINTS } from "../../api/EndPoints";

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    isActive: true,
  });

  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  const { addNotification } = useNotifications();

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(
        () => setAlert({ show: false, type: "", message: "" }),
        5000,
      );
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      console.log("📥 Fetching locations...");
      const res = await api.get(API_ENDPOINTS.LOCATIONS);
      console.log("✅ Locations response:", res.data);
      
      // Handle different response structures
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        data = res.data.data;
      } else if (res.data && res.data.locations) {
        data = res.data.locations;
      }
      
      console.log("📊 Processed locations:", data);
      setLocations(data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching locations:", err);
      notify("error", "Failed to load locations");
      setLoading(false);
    }
  };

  // Search
  const filteredLocations = locations.filter(
    (loc) =>
      loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.phone?.includes(searchQuery),
  );

  // Pagination
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentLocs = filteredLocations.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);

  const notify = (type, message) => {
    setAlert({ show: true, type, message });
    addNotification(type, message);
  };

  // Helper function to get location ID
  const getLocationId = (loc) => loc.id || loc._id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim())
      return notify("error", "Location name is required");
    if (!formData.address.trim()) return notify("error", "Address is required");

    try {
      let response;
      let updatedLocation;

      if (editingLocation) {
        // Get the correct ID (MySQL uses 'id', MongoDB uses '_id')
        const locationId = editingLocation.id || editingLocation._id;
        console.log("✏️ Editing location ID:", locationId);
        
        // Edit location
        response = await api.put(
          `${API_ENDPOINTS.LOCATIONS}/${locationId}`,
          formData
        );
        updatedLocation = response.data;
        console.log("✅ Location updated:", updatedLocation);

        // Update local state
        setLocations(
          locations.map((l) => {
            const lId = l.id || l._id;
            return lId === locationId ? { ...l, ...updatedLocation } : l;
          })
        );
        
        notify("success", `Location "${updatedLocation.name}" updated!`);
      } else {
        // Add new location
        console.log("➕ Adding new location:", formData);
        response = await api.post(API_ENDPOINTS.LOCATIONS, formData);
        updatedLocation = response.data;
        console.log("✅ Location added:", updatedLocation);

        setLocations([...locations, updatedLocation]);
        notify("success", `New location "${updatedLocation.name}" added!`);
      }

      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("❌ Location operation error:", err);
      console.error("Error response:", err.response?.data);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          err.message ||
                          "Operation failed";
      
      notify("error", errorMessage);
    }
  };

  const handleToggleActive = async (location, currentStatus) => {
    try {
      const locationId = location.id || location._id;
      const locationName = location.name;
      
      console.log("🔄 Toggling location:", locationId, "to", !currentStatus);
      
      const response = await api.patch(
        `${API_ENDPOINTS.LOCATIONS}/${locationId}/toggle`,
        { isActive: !currentStatus }
      );
      
      console.log("✅ Toggle response:", response.data);
      
      const updatedLocation = response.data;
      
      setLocations(locations.map((l) => {
        const lId = l.id || l._id;
        return lId === locationId ? updatedLocation : l;
      }));
      
      notify(
        "success",
        `Location "${locationName}" ${updatedLocation.isActive ? "activated" : "deactivated"}`,
      );
    } catch (err) {
      console.error("❌ Toggle error:", err);
      notify("error", "Failed to update status");
    }
  };

  const handleDelete = async (location) => {
    const locationId = location.id || location._id;
    const locationName = location.name;
    
    if (!window.confirm(`Delete location "${locationName}"?`)) return;
    
    try {
      console.log("🗑️ Deleting location:", locationId);
      
      await api.delete(`${API_ENDPOINTS.LOCATIONS}/${locationId}`);
      
      setLocations(locations.filter((l) => {
        const lId = l.id || l._id;
        return lId !== locationId;
      }));
      
      notify("success", `Location "${locationName}" deleted`);
    } catch (err) {
      console.error("❌ Delete error:", err);
      notify("error", err.response?.data?.message || "Delete failed");
    }
  };

  const openEditModal = (loc) => {
    console.log("📝 Opening edit modal for:", loc);
    setEditingLocation(loc);
    setFormData({
      name: loc.name || "",
      address: loc.address || "",
      phone: loc.phone || "",
      isActive: loc.isActive !== false,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingLocation(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      isActive: true,
    });
  };

  return (
    <div className="container-fluid py-4 position-relative">
      {/* TOP ALERT */}
      {alert.show && (
        <div
          className={`alert alert-${alert.type === "success" ? "success" : "danger"} position-fixed top-0 start-50 translate-middle-x mt-4 shadow-lg border-0 rounded-pill px-5 py-3 fw-bold text-white`}
          style={{
            zIndex: 3000,
            minWidth: "350px",
            animation: "slideDown 0.4s ease-out",
          }}
        >
          <i
            className={`bi ${alert.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-2`}
          ></i>
          {alert.message}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Locations / Warehouses</h2>
        <button
          className="btn bg-primary text-white rounded-pill px-4 shadow-sm cate-btn"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <i className="bi bi-building-add me-2"></i> Add Location
        </button>
      </div>

      {/* Search */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="position-relative">
            <input
              type="text"
              className="form-control form-control-lg ps-5 rounded-pill"
              placeholder="Search by name, address or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          </div>
        </div>
      </div>

      {/* Locations Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0">
              <thead className="bg-light text-muted small text-uppercase">
                <tr>
                  <th className="ps-3 py-2">ID</th>
                  <th className="py-2">Location Name</th>
                  <th className="py-2">Address</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2 text-center">Status</th>
                  <th className="py-2 text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody className="small">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="spinner-border spinner-border-sm text-primary" />
                    </td>
                  </tr>
                ) : currentLocs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No locations found
                    </td>
                  </tr>
                ) : (
                  currentLocs.map((loc, index) => {
                    const globalIndex = indexOfFirst + index + 1;
                    const locId = getLocationId(loc);

                    return (
                      <tr key={locId}>
                        <td className="ps-3 py-2 text-muted">#{globalIndex}</td>
                        <td className="py-2 fw-medium">{loc.name}</td>
                        <td className="py-2 small">{loc.address || "—"}</td>
                        <td className="py-2">{loc.phone || "—"}</td>
                        <td className="py-2 text-center">
                          <span
                            className={`badge ${
                              loc.isActive ? "bg-success" : "bg-secondary"
                            } px-3 py-1`}
                          >
                            {loc.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-2 text-end pe-3">
                          <button
                            className="btn btn-sm btn-outline-success me-2"
                            onClick={() =>
                              handleToggleActive(loc, loc.isActive)
                            }
                            title={loc.isActive ? "Deactivate" : "Activate"}
                          >
                            <i
                              className={`bi ${
                                loc.isActive ? "bi-toggle-on" : "bi-toggle-off"
                              }`}
                            ></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => openEditModal(loc)}
                            title="Edit Location"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(loc)}
                            title="Delete Location"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card-footer bg-light">
              <div className="d-flex justify-content-between align-items-center py-2">
                <div className="text-muted small">
                  Showing {indexOfFirst + 1} to{" "}
                  {Math.min(indexOfLast, filteredLocations.length)} of{" "}
                  {filteredLocations.length}
                </div>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li
                      className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                      >
                        Prev
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <li
                        key={i + 1}
                        className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${
                        currentPage === totalPages ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <form onSubmit={handleSubmit}>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-building me-2"></i>
                    {editingLocation ? "Edit Location" : "Add New Location"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
                        Location Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium">Address *</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        required
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                      ></textarea>
                    </div>
                    <div className="col-md-6">
                      <div className="form-check form-switch mt-4">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="activeSwitch"
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isActive: e.target.checked,
                            })
                          }
                        />
                        <label
                          className="form-check-label fw-medium"
                          htmlFor="activeSwitch"
                        >
                          Active Location
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4">
                    {editingLocation ? "Update" : "Add"} Location
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}