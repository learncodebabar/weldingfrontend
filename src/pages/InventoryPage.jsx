import { useState, useEffect } from "react";
import api from "../api/api";
import { useNotifications } from "../context/NotificationContext";
import { format, parseISO, isValid } from "date-fns";

const ENDPOINTS = {
  ALL: "/inventory",
  STATS: "/inventory/stats",
  PAYMENT: (id) => `/inventory/${id}/payment`,
  DELETE: (id) => `/inventory/${id}`,
};

const UNITS = [
  "Piece",
  "KG",
  "Gram",
  "Liter",
  "ML",
  "Bag",
  "Box",
  "Pack",
  "Dozen",
  "Meter",
  "Yard",
];

const emptyForm = {
  supplierName: "",
  supplierPhone: "",
  itemDescription: "",
  quantity: "",
  unit: "Piece",
  purchasePrice: "",
  amountPaid: "",
  purchaseDate: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function InventoryPage() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("All");
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchAll();
    fetchStats();
  }, []);

  useEffect(() => {
    if (alert.show) {
      const t = setTimeout(
        () => setAlert({ show: false, type: "", message: "" }),
        4500,
      );
      return () => clearTimeout(t);
    }
  }, [alert.show]);

  // Helper function to get entry ID
  const getEntryId = (entry) => entry.id || entry._id;

  const notify = (type, message) => {
    setAlert({ show: true, type, message });
    addNotification(type, message);
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      console.log("📥 Fetching inventory...");
      const res = await api.get(ENDPOINTS.ALL);
      console.log("✅ Inventory response:", res.data);
      
      // Handle different response structures
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        data = res.data.data;
      } else if (res.data && res.data.inventory) {
        data = res.data.inventory;
      }
      
      // Ensure each entry has an id field
      data = data.map(entry => ({
        ...entry,
        id: entry.id || entry._id
      }));
      
      console.log("📊 Processed entries:", data.length);
      setEntries(data);
    } catch (err) {
      console.error("❌ Error fetching inventory:", err);
      notify("error", "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      console.log("📊 Fetching stats...");
      const res = await api.get(ENDPOINTS.STATS);
      console.log("✅ Stats response:", res.data);
      setStats(res.data);
    } catch (err) {
      console.error("❌ Stats error:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const safeDate = (d) => {
    if (!d) return "—";
    const date = typeof d === "string" ? parseISO(d) : new Date(d);
    return isValid(date) ? format(date, "dd MMM yyyy") : "—";
  };

  // Unique suppliers for filter dropdown
  const supplierNames = ["All", ...new Set(entries.map((e) => e.supplierName))];

  // Filtered entries
  const filtered = entries.filter((e) => {
    const matchSearch =
      (e.supplierName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.itemDescription || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchSupplier =
      filterSupplier === "All" || e.supplierName === filterSupplier;
    return matchSearch && matchSupplier;
  });

  // Handle Add Entry
  const handleAdd = async () => {
    if (!form.supplierName.trim())
      return notify("error", "Supplier name is required");
    if (!form.itemDescription.trim())
      return notify("error", "Item description is required");
    if (!form.quantity || Number(form.quantity) <= 0)
      return notify("error", "Enter valid quantity");
    if (!form.purchasePrice || Number(form.purchasePrice) <= 0)
      return notify("error", "Enter valid price");

    const totalAmount = Number(form.quantity) * Number(form.purchasePrice);
    const paid = Number(form.amountPaid) || 0;

    if (paid > totalAmount)
      return notify(
        "error",
        `Paid amount cannot exceed RS${totalAmount.toLocaleString()}`,
      );

    try {
      console.log("➕ Adding inventory entry:", form);
      
      const res = await api.post(ENDPOINTS.ALL, {
        ...form,
        quantity: Number(form.quantity),
        purchasePrice: Number(form.purchasePrice),
        amountPaid: paid,
      });

      const newEntry = res.data;
      console.log("✅ Entry added:", newEntry);

      setEntries([{ ...newEntry, id: newEntry.id || newEntry._id }, ...entries]);
      setForm(emptyForm);
      setShowAddModal(false);
      fetchStats();
      notify(
        "success",
        `Purchase from "${form.supplierName}" added successfully!`,
      );
    } catch (err) {
      console.error("❌ Error adding entry:", err);
      notify("error", err.response?.data?.message || "Failed to add entry");
    }
  };

  // Handle Payment
  const handlePayment = async () => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return notify("error", "Enter valid amount");
    if (amount > selectedEntry.remainingAmount)
      return notify("error", "Amount exceeds remaining balance");

    try {
      const entryId = getEntryId(selectedEntry);
      console.log("💰 Recording payment for entry:", entryId, "amount:", amount);
      
      const res = await api.patch(ENDPOINTS.PAYMENT(entryId), {
        amount,
      });
      
      const updatedEntry = res.data;
      console.log("✅ Payment recorded:", updatedEntry);
      
      setEntries(
        entries.map((e) => {
          const eId = getEntryId(e);
          return eId === entryId ? { ...e, ...updatedEntry, id: eId } : e;
        })
      );
      setPaymentAmount("");
      setShowPaymentModal(false);
      setSelectedEntry(null);
      fetchStats();
      notify("success", `Payment of RS${amount.toLocaleString()} recorded!`);
    } catch (err) {
      console.error("❌ Payment error:", err);
      notify("error", err.response?.data?.message || "Payment failed");
    }
  };

  // Handle Delete
  const handleDelete = async (entry) => {
    const entryId = getEntryId(entry);
    
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    
    try {
      console.log("🗑️ Deleting entry:", entryId);
      
      await api.delete(ENDPOINTS.DELETE(entryId));
      
      setEntries(entries.filter((e) => {
        const eId = getEntryId(e);
        return eId !== entryId;
      }));
      
      fetchStats();
      notify("success", "Entry deleted");
    } catch (err) {
      console.error("❌ Delete error:", err);
      notify("error", err.response?.data?.message || "Failed to delete");
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (entries.length === 0) return notify("error", "No data to export");
    
    let csv = "Inventory Purchase Report\n\n";
    csv +=
      "Date,Supplier,Phone,Item,Qty,Unit,Price/Unit,Total,Paid,Remaining,Notes\n";
      
    entries.forEach((e) => {
      csv += `${safeDate(e.purchaseDate)},"${e.supplierName || ""}",${e.supplierPhone || ""},"${e.itemDescription || ""}",${e.quantity || 0},${e.unit || "Piece"},RS${e.purchasePrice || 0},RS${e.totalAmount || 0},RS${e.amountPaid || 0},RS${e.remainingAmount || 0},"${e.notes || ""}"\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    notify("success", "Exported successfully!");
  };

  const computedTotal = Number(form.quantity) * Number(form.purchasePrice) || 0;
  const computedRemaining = computedTotal - (Number(form.amountPaid) || 0);

  return (
    <div className="container-fluid py-4 position-relative">
      {/* ALERT */}
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
            className={`bi ${alert.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-2 fs-5`}
          ></i>
          {alert.message}
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold mb-0">
          <i className="bi bi-truck me-2 text-primary"></i>Stock Purchase Ledger
        </h2>
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-outline-success btn-lg rounded-pill px-4"
            onClick={exportCSV}
          >
            <i className="bi bi-download me-2"></i>Export CSV
          </button>
          <button
            className="btn btn-primary btn-lg rounded-pill px-4"
            onClick={() => {
              setForm(emptyForm);
              setShowAddModal(true);
            }}
          >
            <i className="bi bi-plus-lg me-2"></i>Add Purchase
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-4 bg-primary text-white rounded-3">
            <i className="bi bi-cart-check fs-3 mb-1"></i>
            <h6 className="mb-1">Total Purchased</h6>
            <h4 className="fw-bold mb-0">
              RS
              {statsLoading
                ? "..."
                : (stats?.totalPurchased || 0).toLocaleString()}
            </h4>
            <small className="opacity-75">
              {stats?.totalItems || 0} entries
            </small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-4 bg-success text-white rounded-3">
            <i className="bi bi-cash-stack fs-3 mb-1"></i>
            <h6 className="mb-1">Total Paid</h6>
            <h4 className="fw-bold mb-0">
              RS
              {statsLoading ? "..." : (stats?.totalPaid || 0).toLocaleString()}
            </h4>
            <small className="opacity-75">To suppliers</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-4 bg-danger text-white rounded-3">
            <i className="bi bi-exclamation-circle fs-3 mb-1"></i>
            <h6 className="mb-1">Total Remaining</h6>
            <h4 className="fw-bold mb-0">
              RS
              {statsLoading
                ? "..."
                : (stats?.totalRemaining || 0).toLocaleString()}
            </h4>
            <small className="opacity-75">Still to pay</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-4 bg-warning text-dark rounded-3">
            <i className="bi bi-people fs-3 mb-1"></i>
            <h6 className="mb-1">Total Suppliers</h6>
            <h4 className="fw-bold mb-0">
              {statsLoading ? "..." : stats?.suppliers?.length || 0}
            </h4>
            <small>{stats?.totalQuantity || 0} units purchased</small>
          </div>
        </div>
      </div>

      {/* Per Supplier Summary Cards */}
      {stats?.suppliers?.length > 0 && (
        <div className="mb-4">
          <h5 className="fw-bold mb-3">
            <i className="bi bi-truck me-2"></i>Supplier-wise Summary
          </h5>
          <div className="row g-3">
            {stats.suppliers.map((s, i) => (
              <div key={i} className="col-md-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-primary text-white py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 fw-bold">
                        <i className="bi bi-person-circle me-2"></i>
                        {s.supplierName}
                      </h6>
                      <small>{s.supplierPhone}</small>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row g-2 text-center">
                      <div className="col-4">
                        <small className="text-muted d-block">Purchased</small>
                        <strong className="text-primary">
                          RS{(s.totalPurchased || 0).toLocaleString()}
                        </strong>
                      </div>
                      <div className="col-4">
                        <small className="text-muted d-block">Paid</small>
                        <strong className="text-success">
                          RS{(s.totalPaid || 0).toLocaleString()}
                        </strong>
                      </div>
                      <div className="col-4">
                        <small className="text-muted d-block">Remaining</small>
                        <strong
                          className={
                            (s.totalRemaining || 0) > 0
                              ? "text-danger"
                              : "text-success"
                          }
                        >
                          RS{(s.totalRemaining || 0).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="progress" style={{ height: "6px" }}>
                        <div
                          className="progress-bar bg-success"
                          style={{
                            width: `${Math.min(((s.totalPaid || 0) / (s.totalPurchased || 1)) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <small className="text-muted">
                        {(((s.totalPaid || 0) / (s.totalPurchased || 1)) * 100).toFixed(0)}%
                        paid
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label fw-semibold">Search</label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by supplier or item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                Filter by Supplier
              </label>
              <select
                className="form-select"
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
              >
                {supplierNames.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchTerm("");
                  setFilterSupplier("All");
                }}
              >
                <i className="bi bi-x-circle me-2"></i>Clear Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card border-0 shadow">
        <div className="card-header bg-primary text-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-table me-2"></i>Purchase Entries (
            {filtered.length})
          </h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2 opacity-50"></i>
              <p>
                {entries.length === 0
                  ? "No purchases added yet. Click 'Add Purchase' to start."
                  : "No results found."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price/Unit</th>
                    <th>Total Amount</th>
                    <th>Amount Paid</th>
                    <th>Remaining</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e, i) => {
                    const entryId = getEntryId(e);
                    
                    return (
                      <tr
                        key={entryId}
                        className={e.remainingAmount > 0 ? "" : "table-success"}
                      >
                        <td className="text-muted small">{i + 1}</td>
                        <td>
                          <small className="fw-semibold">
                            {safeDate(e.purchaseDate)}
                          </small>
                        </td>
                        <td>
                          <div className="fw-bold">{e.supplierName}</div>
                          {e.supplierPhone && (
                            <small className="text-muted">
                              {e.supplierPhone}
                            </small>
                          )}
                        </td>
                        <td>
                          <div>{e.itemDescription}</div>
                          {e.notes && (
                            <small className="text-muted fst-italic">
                              {e.notes}
                            </small>
                          )}
                        </td>
                        <td className="fw-semibold">
                          {e.quantity}{" "}
                          <small className="text-muted">{e.unit}</small>
                        </td>
                        <td>RS{(e.purchasePrice || 0).toLocaleString()}</td>
                        <td className="fw-bold text-primary">
                          RS{(e.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="fw-bold text-success">
                          RS{(e.amountPaid || 0).toLocaleString()}
                        </td>
                        <td
                          className={`fw-bold ${e.remainingAmount > 0 ? "text-danger" : "text-success"}`}
                        >
                          RS{(e.remainingAmount || 0).toLocaleString()}
                        </td>
                        <td>
                          {e.remainingAmount <= 0 ? (
                            <span className="badge bg-success">Paid</span>
                          ) : (
                            <span className="badge bg-danger">Pending</span>
                          )}
                        </td>
                        <td>
                          {e.remainingAmount > 0 && (
                            <button
                              className="btn btn-sm btn-success me-1"
                              title="Record Payment"
                              onClick={() => {
                                setSelectedEntry(e);
                                setPaymentAmount("");
                                setShowPaymentModal(true);
                              }}
                            >
                              <i className="bi bi-cash"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Delete"
                            onClick={() => handleDelete(e)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="table-dark">
                  <tr>
                    <td colSpan="6" className="fw-bold">
                      Totals (filtered)
                    </td>
                    <td className="fw-bold">
                      RS
                      {filtered
                        .reduce((s, e) => s + (e.totalAmount || 0), 0)
                        .toLocaleString()}
                    </td>
                    <td className="fw-bold text-success">
                      RS
                      {filtered
                        .reduce((s, e) => s + (e.amountPaid || 0), 0)
                        .toLocaleString()}
                    </td>
                    <td className="fw-bold text-danger">
                      RS
                      {filtered
                        .reduce((s, e) => s + (e.remainingAmount || 0), 0)
                        .toLocaleString()}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ADD PURCHASE MODAL */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-plus-circle me-2"></i>Add New Purchase
                  Entry
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Ahmed Traders"
                      value={form.supplierName}
                      onChange={(e) =>
                        setForm({ ...form, supplierName: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Supplier Phone
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0300-0000000"
                      value={form.supplierPhone}
                      onChange={(e) =>
                        setForm({ ...form, supplierPhone: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Item / Maal Description *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Basmati Rice 50kg bags"
                      value={form.itemDescription}
                      onChange={(e) =>
                        setForm({ ...form, itemDescription: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Quantity *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={form.quantity}
                      onChange={(e) =>
                        setForm({ ...form, quantity: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Unit</label>
                    <select
                      className="form-select"
                      value={form.unit}
                      onChange={(e) =>
                        setForm({ ...form, unit: e.target.value })
                      }
                    >
                      {UNITS.map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">
                      Price per Unit (RS) *
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={form.purchasePrice}
                      onChange={(e) =>
                        setForm({ ...form, purchasePrice: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.purchaseDate}
                      onChange={(e) =>
                        setForm({ ...form, purchaseDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Amount Paid Now (RS)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0 (leave empty if nothing paid yet)"
                      value={form.amountPaid}
                      onChange={(e) =>
                        setForm({ ...form, amountPaid: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Notes</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Optional..."
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                    />
                  </div>

                  {/* Live calculation */}
                  {form.quantity && form.purchasePrice && (
                    <div className="col-12">
                      <div className="card border-0 bg-light">
                        <div className="card-body py-2">
                          <div className="row text-center">
                            <div className="col-4">
                              <small className="text-muted d-block">
                                Total Amount
                              </small>
                              <strong className="text-primary fs-5">
                                RS{computedTotal.toLocaleString()}
                              </strong>
                            </div>
                            <div className="col-4">
                              <small className="text-muted d-block">
                                Paid Now
                              </small>
                              <strong className="text-success fs-5">
                                RS
                                {(
                                  Number(form.amountPaid) || 0
                                ).toLocaleString()}
                              </strong>
                            </div>
                            <div className="col-4">
                              <small className="text-muted d-block">
                                Remaining
                              </small>
                              <strong
                                className={`fs-5 ${computedRemaining > 0 ? "text-danger" : "text-success"}`}
                              >
                                RS{computedRemaining.toLocaleString()}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary px-4" onClick={handleAdd}>
                  <i className="bi bi-check-lg me-2"></i>Add Purchase Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedEntry && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-cash-stack me-2"></i>Record Payment
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowPaymentModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info py-2 mb-3">
                  <strong>Supplier:</strong> {selectedEntry.supplierName}
                  <br />
                  <strong>Item:</strong> {selectedEntry.itemDescription}
                  <br />
                  <strong>Total:</strong> RS
                  {(selectedEntry.totalAmount || 0).toLocaleString()} |{" "}
                  <strong>Already Paid:</strong> RS
                  {(selectedEntry.amountPaid || 0).toLocaleString()} |{" "}
                  <strong className="text-danger">
                    Remaining: RS
                    {(selectedEntry.remainingAmount || 0).toLocaleString()}
                  </strong>
                </div>
                <label className="form-label fw-semibold">
                  Payment Amount (RS)
                </label>
                <input
                  type="number"
                  className="form-control form-control-lg text-center"
                  placeholder="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                <div className="d-flex gap-2 mt-2">
                  <button
                    className="btn btn-outline-success btn-sm"
                    onClick={() =>
                      setPaymentAmount(String(selectedEntry.remainingAmount))
                    }
                  >
                    Pay Full Amount
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success px-4"
                  onClick={handlePayment}
                  disabled={!paymentAmount || Number(paymentAmount) <= 0}
                >
                  <i className="bi bi-check-lg me-2"></i>Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .table td, .table th { vertical-align: middle; }
      `}</style>
    </div>
  );
}