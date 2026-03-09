import { useState, useEffect } from "react";
import api from "../api/api";
import { useNotifications } from "../context/NotificationContext";

const RETURN_REASONS = [
  "Defective / Damaged product",
  "Wrong item delivered",
  "Item not as described",
  "Customer changed mind",
  "Size / fit issue",
  "Duplicate order",
  "Other",
];

export default function ReturnExchange() {
  const [tab, setTab] = useState("new");
  const [saleInput, setSaleInput] = useState("");
  const [saleData, setSaleData] = useState(null);
  const [existingReturns, setExistingReturns] = useState([]);
  const [loadingSale, setLoadingSale] = useState(false);
  const [step, setStep] = useState(1);

  const [returnItems, setReturnItems] = useState([]);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (alert.show) {
      const t = setTimeout(
        () => setAlert({ show: false, type: "", message: "" }),
        3000,
      );
      return () => clearTimeout(t);
    }
  }, [alert.show]);

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab]);

  const notify = (type, message) => {
    setAlert({ show: true, type, message });
    addNotification(type, message);
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get("/return-exchange");
      setHistory(res.data || []);
    } catch (err) {
      notify("error", "Could not load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const lookupSale = async () => {
    if (!saleInput.trim()) return notify("error", "Enter sale number or ID");
    setLoadingSale(true);
    setSaleData(null);
    setReturnItems([]);
    try {
      const res = await api.get(`/return-exchange/sale/${saleInput.trim()}`);
      setSaleData(res.data.sale);
      setExistingReturns(res.data.existingReturns || []);
      setStep(2);
    } catch (err) {
      notify("error", err.response?.data?.message || "Sale not found");
    } finally {
      setLoadingSale(false);
    }
  };

  const toggleReturnItem = (saleItem) => {
    const existing = returnItems.find((r) => r.productId == saleItem.productId);
    if (existing) {
      setReturnItems((prev) =>
        prev.filter((r) => r.productId != saleItem.productId),
      );
    } else {
      setReturnItems((prev) => [
        ...prev,
        {
          productId: saleItem.productId,
          name: saleItem.name,
          qty: 1,
          maxQty: saleItem.qty,
          price: saleItem.price,
          condition: "good",
        },
      ]);
    }
  };

  const updateReturnItem = (productId, field, value) => {
    setReturnItems((prev) =>
      prev.map((item) =>
        item.productId == productId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const returnAmount = returnItems.reduce(
    (sum, item) => sum + Number(item.price) * item.qty,
    0,
  );

  const handleSubmit = async () => {
    if (returnItems.length === 0)
      return notify("error", "Select at least one item");
    if (!reason) return notify("error", "Select a reason");

    setLoading(true);
    try {
      const payload = {
        originalSaleId: saleData.id,
        reason,
        notes,
        items: returnItems,
        refundMethod,
      };

      const res = await api.post("/return-exchange", payload);
      notify("success", `Return processed: ${res.data.returnNumber}`);
      printReceipt(res.data);

      // Reset
      setSaleInput("");
      setSaleData(null);
      setReturnItems([]);
      setReason("");
      setNotes("");
      setStep(1);
    } catch (err) {
      notify(
        "error",
        err.response?.data?.message || "Failed to process return",
      );
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = (data) => {
    const items = JSON.parse(data.items || "[]");
    const w = window.open("", "_blank");
    w.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="UTF-8"><title>Return Receipt - ${data.returnNumber}</title>
      <style>
        body { font-family: monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
        h2 { text-align: center; }
        hr { border: dashed 1px #000; }
        table { width: 100%; font-size: 13px; }
        th { text-align: left; padding-bottom: 5px; }
        td { padding: 3px 0; }
        .right { text-align: right; }
        @media print { body { padding: 0; } }
      </style>
      </head><body>
      <h2>RETURN RECEIPT</h2>
      <p style="text-align:center">${data.returnNumber}</p>
      <hr>
      <p><strong>Original Sale:</strong> ${data.originalSale?.saleNumber || data.originalSaleId}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <hr>
      <table>
        <tr><th>Item</th><th>Qty</th><th>Condition</th><th class="right">Amount</th></tr>
        ${items
          .map(
            (i) => `
          <tr>
            <td>${i.name}</td>
            <td>${i.qty}</td>
            <td>${i.condition}</td>
            <td class="right">RS${(Number(i.price) * i.qty).toFixed(0)}</td>
          </tr>
        `,
          )
          .join("")}
      </table>
      <hr>
      <p class="right"><strong>Return Amount: RS${Number(data.returnAmount).toFixed(0)}</strong></p>
      <p class="right">Refund via: ${data.refundMethod?.replace("_", " ")}</p>
      <hr>
      <p style="text-align:center">Thank you!</p>
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),1000)}</script>
      </body></html>
    `);
    w.document.close();
  };

  const cancelReturn = async (id) => {
    if (!window.confirm("Cancel this return? Stock will be reversed.")) return;
    try {
      await api.patch(`/return-exchange/${id}/cancel`);
      notify("success", "Return cancelled");
      fetchHistory();
    } catch (err) {
      notify("error", err.response?.data?.message || "Could not cancel");
    }
  };

  const resetForm = () => {
    setSaleInput("");
    setSaleData(null);
    setReturnItems([]);
    setReason("");
    setNotes("");
    setStep(1);
  };

  return (
    <div className="container-fluid">
      {/* Alert */}
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

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">
          <i className="bi bi-arrow-return-left me-2 text-danger"></i>
          Returns
        </h2>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link fw-semibold ${tab === "new" ? "active" : ""}`}
            onClick={() => {
              setTab("new");
              resetForm();
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>New Return
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-semibold ${tab === "history" ? "active" : ""}`}
            onClick={() => setTab("history")}
          >
            <i className="bi bi-clock-history me-2"></i>Return History
          </button>
        </li>
      </ul>

      {/* ── NEW RETURN TAB ── */}
      {tab === "new" && (
        <div className="row g-4">
          <div className="col-lg-8">
            {/* Step 1 — Lookup Sale */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent fw-bold py-3">
                <span className="badge bg-danger me-2">1</span>
                Find Original Sale
              </div>
              <div className="card-body">
                <div className="row g-3 align-items-end">
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold">
                      Sale Number or ID
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. SALE-241210-001 or 5"
                      value={saleInput}
                      onChange={(e) => setSaleInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && lookupSale()}
                    />
                  </div>
                  <div className="col-md-4">
                    <button
                      className="btn btn-danger w-100"
                      onClick={lookupSale}
                      disabled={loadingSale}
                    >
                      {loadingSale ? (
                        <span className="spinner-border spinner-border-sm" />
                      ) : (
                        <>
                          <i className="bi bi-search me-2"></i>Find Sale
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {saleData && (
                  <div className="alert alert-success mt-3 mb-0 py-2">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    <strong>{saleData.saleNumber}</strong> — RS
                    {Number(saleData.total).toFixed(0)} —
                    {saleData.saleType?.toUpperCase()}
                    {saleData.customer && ` — ${saleData.customer.name}`}
                    {existingReturns.length > 0 && (
                      <span className="ms-2 badge bg-warning text-dark">
                        {existingReturns.length} prior return(s)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2 — Select Items */}
            {step >= 2 && saleData && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-transparent fw-bold py-3">
                  <span className="badge bg-danger me-2">2</span>
                  Select Items to Return
                </div>
                <div className="card-body p-0">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3" style={{ width: "50px" }}>
                          Select
                        </th>
                        <th>Product</th>
                        <th className="text-center">Sold Qty</th>
                        <th className="text-center" style={{ width: "110px" }}>
                          Return Qty
                        </th>
                        <th className="text-center" style={{ width: "130px" }}>
                          Condition
                        </th>
                        <th className="text-center">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleData.items?.map((item) => {
                        const selected = returnItems.find(
                          (r) => r.productId == item.productId,
                        );
                        return (
                          <tr
                            key={item.id}
                            className={selected ? "table-warning" : ""}
                          >
                            <td className="ps-3">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={!!selected}
                                onChange={() => toggleReturnItem(item)}
                              />
                            </td>
                            <td>
                              <div className="fw-semibold">{item.name}</div>
                              <small className="text-muted">
                                RS{Number(item.price).toFixed(0)} each
                              </small>
                            </td>
                            <td className="text-center">{item.qty}</td>
                            <td className="text-center">
                              {selected ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-center"
                                  value={selected.qty}
                                  min={1}
                                  max={item.qty}
                                  onChange={(e) =>
                                    updateReturnItem(
                                      item.productId,
                                      "qty",
                                      Math.min(
                                        item.qty,
                                        Math.max(1, Number(e.target.value)),
                                      ),
                                    )
                                  }
                                />
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="text-center">
                              {selected ? (
                                <select
                                  className="form-select form-select-sm"
                                  value={selected.condition}
                                  onChange={(e) =>
                                    updateReturnItem(
                                      item.productId,
                                      "condition",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="good">Good</option>
                                  <option value="defective">Defective</option>
                                  <option value="damaged">Damaged</option>
                                </select>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="text-center fw-semibold">
                              {selected
                                ? `RS${(Number(item.price) * selected.qty).toFixed(0)}`
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {saleData.items?.length === 0 && (
                  <div className="text-center py-4 text-muted">
                    No items found in this sale
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Reason */}
            {step >= 2 && returnItems.length > 0 && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-transparent fw-bold py-3">
                  <span className="badge bg-danger me-2">3</span>
                  Reason & Refund Method
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">
                        Return Reason *
                      </label>
                      <select
                        className="form-select"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      >
                        <option value="">Select reason...</option>
                        {RETURN_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">
                        Refund Method
                      </label>
                      <select
                        className="form-select"
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value)}
                      >
                        <option value="cash">Cash Refund</option>
                        <option value="store_credit">Store Credit</option>
                        <option value="original_method">
                          Original Payment Method
                        </option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold small">
                        Notes (optional)
                      </label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional notes..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right — Summary */}
          <div className="col-lg-4">
            <div
              className="card border-0 shadow-sm position-sticky"
              style={{ top: "90px" }}
            >
              <div className="card-header bg-danger text-white fw-bold py-3">
                <i className="bi bi-receipt me-2"></i>Return Summary
              </div>
              <div className="card-body">
                {returnItems.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-arrow-return-left fs-1 d-block mb-2 opacity-25"></i>
                    <small>Select items to return</small>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      {returnItems.map((item) => (
                        <div
                          key={item.productId}
                          className="d-flex justify-content-between mb-2 small border-bottom pb-2"
                        >
                          <div>
                            <div className="fw-semibold">{item.name}</div>
                            <div className="text-muted">
                              Qty: {item.qty} × RS
                              {Number(item.price).toFixed(0)}
                              {item.condition !== "good" && (
                                <span
                                  className={`badge ms-1 ${item.condition === "damaged" ? "bg-danger" : "bg-warning text-dark"}`}
                                >
                                  {item.condition}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="fw-bold text-danger">
                            RS{(Number(item.price) * item.qty).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-danger bg-opacity-10 rounded p-3 mb-3">
                      <div className="d-flex justify-content-between fw-bold fs-5">
                        <span>Refund Amount</span>
                        <span className="text-danger">
                          RS{returnAmount.toFixed(0)}
                        </span>
                      </div>
                      <small className="text-muted">
                        via {refundMethod.replace("_", " ")}
                      </small>
                    </div>

                    {returnItems.some((i) => i.condition === "damaged") && (
                      <div className="alert alert-warning py-2 small mb-3">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Damaged items will NOT be added back to stock
                      </div>
                    )}

                    <button
                      className="btn btn-danger w-100 btn-lg"
                      onClick={handleSubmit}
                      disabled={loading || !reason}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-arrow-return-left me-2"></i>
                          Process Return
                        </>
                      )}
                    </button>

                    <button
                      className="btn btn-outline-secondary w-100 mt-2"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {historyLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-2 opacity-25"></i>
                No returns yet
              </div>
            ) : (
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">Return #</th>
                    <th>Original Sale</th>
                    <th>Reason</th>
                    <th className="text-center">Return Amt</th>
                    <th className="text-center">Refund Method</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Date</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((ret) => (
                    <tr key={ret.id}>
                      <td className="ps-3 fw-semibold text-danger">
                        {ret.returnNumber}
                      </td>
                      <td>
                        {ret.originalSale?.saleNumber || ret.originalSaleId}
                      </td>
                      <td>
                        <small>{ret.reason}</small>
                      </td>
                      <td className="text-center fw-bold text-danger">
                        RS{Number(ret.returnAmount).toFixed(0)}
                      </td>
                      <td className="text-center">
                        <small className="text-capitalize">
                          {ret.refundMethod?.replace("_", " ")}
                        </small>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${ret.status === "completed" ? "bg-success" : "bg-secondary"}`}
                        >
                          {ret.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <small>
                          {new Date(ret.createdAt).toLocaleDateString()}
                        </small>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-info me-1"
                          onClick={() => printReceipt(ret)}
                          title="Print Receipt"
                        >
                          <i className="bi bi-printer"></i>
                        </button>
                        {ret.status === "completed" && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => cancelReturn(ret.id)}
                            title="Cancel Return"
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
