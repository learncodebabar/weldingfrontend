import { useState, useEffect } from "react";
import api from "../../api/api";
import { API_ENDPOINTS } from "../../api/EndPoints";

export default function CashCustomers() {
  const [sales, setSales] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [shopSettings, setShopSettings] = useState(null);

  useEffect(() => {
    fetchCashSales();
    fetchReturns();
    fetchShopSettings();
  }, []);

  const getSaleId = (sale) => sale.id || sale._id;

  // Get returned amount for a sale
  const getReturnedAmount = (saleId) =>
    returns
      .filter((r) => r.originalSaleId == saleId && r.status === "completed")
      .reduce((sum, r) => sum + (Number(r.returnAmount) || 0), 0);

  // Net total after returns
  const getNetTotal = (sale) =>
    Math.max(0, (Number(sale.total) || 0) - getReturnedAmount(getSaleId(sale)));

  const fetchCashSales = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.SALE);
      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data?.data) data = res.data.data;
      else if (res.data?.sales) data = res.data.sales;

      const cashSales = data
        .filter((s) => s.saleType === "cash")
        .map((s) => ({
          ...s,
          id: s.id || s._id,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        }));

      setSales(cashSales);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const fetchReturns = async () => {
    try {
      const res = await api.get("/return-exchange");
      setReturns(res.data || []);
    } catch {}
  };

  const fetchShopSettings = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.SHOP_SETTINGS);
      setShopSettings(res.data);
    } catch {}
  };

  const getFilteredSalesByDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateRange === "all") return sales;
    if (dateRange === "today")
      return sales.filter((s) => new Date(s.createdAt) >= today);
    if (dateRange === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return sales.filter((s) => {
        const d = new Date(s.createdAt);
        return d >= yesterday && d < today;
      });
    }
    if (dateRange === "last7") {
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      return sales.filter((s) => new Date(s.createdAt) >= last7);
    }
    if (dateRange === "thisMonth") {
      return sales.filter((s) => {
        const d = new Date(s.createdAt);
        return (
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      });
    }
    if (dateRange === "custom" && customStart && customEnd) {
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return sales.filter((s) => {
        const d = new Date(s.createdAt);
        return d >= start && d <= end;
      });
    }
    return sales;
  };

  const dateFilteredSales = getFilteredSalesByDate();

  const filteredSales = dateFilteredSales.filter((sale) => {
    const q = searchQuery.toLowerCase();
    const id = getSaleId(sale);
    return (
      id?.toString().toLowerCase().includes(q) ||
      sale.saleNumber?.toLowerCase().includes(q) ||
      sale.payments?.some((p) => p.method?.toLowerCase().includes(q))
    );
  });

  // Summary — net of returns
  const totalAmount = filteredSales.reduce((sum, s) => sum + getNetTotal(s), 0);
  const totalReturned = filteredSales.reduce(
    (sum, s) => sum + getReturnedAmount(getSaleId(s)),
    0,
  );
  const totalChange = filteredSales.reduce(
    (sum, s) =>
      sum + Math.max(0, (Number(s.paidAmount) || 0) - (Number(s.total) || 0)),
    0,
  );
  const totalItems = filteredSales.reduce(
    (sum, s) => sum + (s.items?.length || 0),
    0,
  );

  const paymentBreakdown = {};
  filteredSales.forEach((sale) => {
    sale.payments?.forEach((p) => {
      const m = p.method || "Cash";
      paymentBreakdown[m] =
        (paymentBreakdown[m] || 0) + (Number(p.amount) || 0);
    });
  });

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrintReceipt = (sale) => {
    const subtotal =
      sale.items?.reduce(
        (sum, item) =>
          sum +
          ((Number(item.price) || 0) - (Number(item.itemDiscount) || 0)) *
            (item.qty || 0),
        0,
      ) || 0;
    const discountAmount = sale.discountPercent
      ? (subtotal * Number(sale.discountPercent)) / 100
      : 0;
    const tax = Number(sale.tax) || 0;
    const serviceCharge = Number(sale.serviceCharge) || 0;
    const change = (Number(sale.paidAmount) || 0) - (Number(sale.total) || 0);
    const saleId = getSaleId(sale);
    const returned = getReturnedAmount(saleId);
    const net = getNetTotal(sale);

    const receiptHTML = `
      <div style="font-family:'Courier New',monospace;max-width:300px;margin:0 auto;padding:20px;">
        <div style="text-align:center;margin-bottom:15px;border-bottom:2px dashed #000;padding-bottom:12px;">
          <h2 style="margin:0;font-size:20px;">${shopSettings?.shopName || "My Shop"}</h2>
          <p style="margin:4px 0;font-size:12px;">${shopSettings?.address || ""}</p>
          <p style="margin:4px 0;font-size:12px;">Tel: ${shopSettings?.phone || ""}</p>
        </div>
        <div style="margin-bottom:12px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span><strong>Receipt #:</strong></span><span>${saleId?.toString().slice(-8).toUpperCase()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span><strong>Date:</strong></span><span>${formatDate(sale.createdAt)}</span>
          </div>
        </div>
        <table style="width:100%;font-size:12px;margin-bottom:12px;border-collapse:collapse;">
          <thead><tr style="border-top:2px solid #000;border-bottom:1px solid #000;">
            <th style="text-align:left;padding:5px 0;">Item</th>
            <th style="text-align:center;padding:5px 0;">Qty</th>
            <th style="text-align:right;padding:5px 0;">Price</th>
            <th style="text-align:right;padding:5px 0;">Total</th>
          </tr></thead>
          <tbody>
            ${
              sale.items
                ?.map((item) => {
                  const fp =
                    (Number(item.price) || 0) -
                    (Number(item.itemDiscount) || 0);
                  return `<tr style="border-bottom:1px dashed #ccc;">
                <td style="padding:5px 0;">${item.name?.length > 22 ? item.name.substring(0, 19) + "..." : item.name || "Product"}${Number(item.itemDiscount) > 0 ? `<br><small style="color:#666;">-RS${item.itemDiscount}</small>` : ""}</td>
                <td style="text-align:center;padding:5px 0;">${item.qty}</td>
                <td style="text-align:right;padding:5px 0;">RS${fp.toFixed(0)}</td>
                <td style="text-align:right;padding:5px 0;">RS${(fp * item.qty).toFixed(0)}</td>
              </tr>`;
                })
                .join("") ||
              '<tr><td colspan="4" style="text-align:center;padding:8px;">No items</td></tr>'
            }
          </tbody>
        </table>
        <div style="border-top:2px solid #000;border-bottom:2px solid #000;padding:10px 0;margin-bottom:12px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span>Subtotal:</span><span>RS${subtotal.toFixed(0)}</span></div>
          ${sale.discountPercent ? `<div style="display:flex;justify-content:space-between;margin-bottom:3px;color:#dc3545;"><span>Discount(${sale.discountPercent}%):</span><span>-RS${discountAmount.toFixed(0)}</span></div>` : ""}
          ${serviceCharge > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span>Service:</span><span>+RS${serviceCharge.toFixed(0)}</span></div>` : ""}
          ${tax > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span>Tax:</span><span>+RS${tax.toFixed(0)}</span></div>` : ""}
          <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid #000;font-size:15px;font-weight:bold;">
            <span>TOTAL:</span><span>RS${(Number(sale.total) || 0).toFixed(0)}</span>
          </div>
          ${
            returned > 0
              ? `
          <div style="display:flex;justify-content:space-between;margin-top:4px;color:#dc3545;">
            <span>Returned:</span><span>-RS${returned.toFixed(0)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-weight:bold;color:#dc3545;">
            <span>NET TOTAL:</span><span>RS${net.toFixed(0)}</span>
          </div>`
              : ""
          }
        </div>
        <div style="margin-bottom:12px;font-size:12px;background:#e8f5e9;padding:8px;border-radius:4px;">
          <strong>Payment:</strong><br>
          ${sale.payments?.map((p) => `<div style="display:flex;justify-content:space-between;"><span>${p.method}:</span><span>RS${(Number(p.amount) || 0).toFixed(0)}${p.detail ? ` (${p.detail})` : ""}</span></div>`).join("") || `<div>Cash: RS${(Number(sale.paidAmount) || 0).toFixed(0)}</div>`}
          ${change > 0 ? `<div style="display:flex;justify-content:space-between;margin-top:5px;padding-top:5px;border-top:1px dashed #000;color:#28a745;"><span>Change:</span><span>RS${change.toFixed(0)}</span></div>` : ""}
        </div>
        <div style="text-align:center;border-top:2px dashed #000;padding-top:12px;font-size:12px;">
          <p style="margin:4px 0;font-weight:bold;">Thank you for shopping!</p>
          ${shopSettings?.footerMessage ? `<p style="margin:4px 0;">${shopSettings.footerMessage}</p>` : ""}
          <p style="margin:4px 0;font-size:10px;color:#666;">${new Date().toLocaleString()}</p>
        </div>
      </div>`;

    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
      <style>@media print{body{padding:0;margin:0;}} body{font-family:'Courier New',monospace;}</style>
      </head><body><div style="max-width:320px;margin:0 auto;">${receiptHTML}</div>
      <script>window.onload=function(){window.print();setTimeout(function(){window.close();},1000);}<\/script>
      </body></html>`);
    w.document.close();
  };

  const exportToCSV = () => {
    if (filteredSales.length === 0) return;
    const rangeLabels = {
      all: "All Time",
      today: "Today",
      yesterday: "Yesterday",
      last7: "Last 7 Days",
      thisMonth: "This Month",
      custom: `${customStart} to ${customEnd}`,
    };
    let csv = `Cash Sales Report\nPeriod:,${rangeLabels[dateRange]}\nNet Total:,RS${totalAmount.toFixed(0)}\nTotal Returned:,RS${totalReturned.toFixed(0)}\nTransactions:,${filteredSales.length}\n\n`;
    csv += "Date,Invoice ID,Payment,Gross,Returned,Net,Change,Items\n";
    filteredSales.forEach((s) => {
      const id = getSaleId(s).toString().slice(-8).toUpperCase();
      const methods = s.payments?.map((p) => p.method).join("+") || "Cash";
      const returned = getReturnedAmount(getSaleId(s));
      const net = getNetTotal(s);
      const change = Math.max(
        0,
        (Number(s.paidAmount) || 0) - (Number(s.total) || 0),
      );
      csv += `"${formatDate(s.createdAt)}",${id},${methods},RS${s.total},RS${returned},RS${net},RS${change.toFixed(0)},${s.items?.length || 0}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cash_sales_${dateRange}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold mb-0">Cash Customers / Payments</h2>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <select
            className="form-select form-select-sm"
            style={{ width: "150px" }}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          {dateRange === "custom" && (
            <>
              <input
                type="date"
                className="form-control form-control-sm"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <input
                type="date"
                className="form-control form-control-sm"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </>
          )}
          <button
            className="btn btn-sm btn-success d-flex align-items-center gap-1"
            onClick={exportToCSV}
            disabled={filteredSales.length === 0}
          >
            <i className="bi bi-download"></i> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-3 bg-primary text-white rounded-3">
            <small className="opacity-75">Transactions</small>
            <h4 className="fw-bold mb-0">{filteredSales.length}</h4>
            <small className="opacity-75">Cash sales</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-3 bg-success text-white rounded-3">
            <small className="opacity-75">Net Collected</small>
            <h4 className="fw-bold mb-0">RS{totalAmount.toFixed(0)}</h4>
            <small className="opacity-75">After returns</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-3 bg-danger text-white rounded-3">
            <small className="opacity-75">Total Returned</small>
            <h4 className="fw-bold mb-0">RS{totalReturned.toFixed(0)}</h4>
            <small className="opacity-75">Refunded</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-3 bg-info text-white rounded-3">
            <small className="opacity-75">Items Sold</small>
            <h4 className="fw-bold mb-0">{totalItems}</h4>
            <small className="opacity-75">Total qty</small>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      {Object.keys(paymentBreakdown).length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-light py-2">
            <h6 className="mb-0 fw-bold">Payment Method Breakdown</h6>
          </div>
          <div className="card-body py-3">
            <div className="row g-2">
              {Object.entries(paymentBreakdown).map(([method, amount]) => (
                <div key={method} className="col-md-4 col-lg-3">
                  <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                    <span className="fw-medium small">{method}</span>
                    <span className="fw-bold text-success small">
                      RS{amount.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="position-relative">
            <input
              type="text"
              className="form-control ps-5 rounded-pill"
              placeholder="Search by Invoice ID or Payment Method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 small">
              <thead className="bg-light">
                <tr>
                  <th className="ps-3 py-2">Date & Time</th>
                  <th className="py-2">Invoice ID</th>
                  <th className="py-2">Payment</th>
                  <th className="py-2 text-end">Gross</th>
                  <th className="py-2 text-end">Returned</th>
                  <th className="py-2 text-end">Net Amount</th>
                  <th className="py-2 text-end">Change</th>
                  <th className="py-2 text-center">Items</th>
                  <th className="pe-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5">
                      <div className="spinner-border text-primary" />
                      <p className="mt-2 text-muted">Loading...</p>
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>No cash
                      sales found
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => {
                    const saleId = getSaleId(sale);
                    const returned = getReturnedAmount(saleId);
                    const net = getNetTotal(sale);
                    const change = Math.max(
                      0,
                      (Number(sale.paidAmount) || 0) -
                        (Number(sale.total) || 0),
                    );
                    const hasReturn = returned > 0;

                    return (
                      <tr key={saleId}>
                        <td className="ps-3 py-2 text-muted">
                          {formatDate(sale.createdAt)}
                        </td>
                        <td className="py-2 fw-semibold text-primary">
                          #
                          {sale.saleNumber ||
                            saleId.toString().slice(-8).toUpperCase()}
                        </td>
                        <td className="py-2">
                          {sale.payments?.length > 0 ? (
                            <div className="d-flex flex-wrap gap-1">
                              {sale.payments.map((p, i) => (
                                <span
                                  key={i}
                                  className="badge bg-success rounded-pill"
                                >
                                  {p.method}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="badge bg-success rounded-pill">
                              Cash
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-end text-muted">
                          <small>
                            RS{(Number(sale.total) || 0).toFixed(0)}
                          </small>
                        </td>
                        <td className="py-2 text-end">
                          {hasReturn ? (
                            <span className="badge bg-danger bg-opacity-10 text-danger">
                              -RS{returned.toFixed(0)}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="py-2 text-end fw-bold">
                          <span
                            className={
                              hasReturn ? "text-danger" : "text-success"
                            }
                          >
                            RS{net.toFixed(0)}
                          </span>
                        </td>
                        <td className="py-2 text-end text-warning fw-semibold">
                          RS{change.toFixed(0)}
                        </td>
                        <td className="py-2 text-center">
                          <span className="badge bg-info rounded-pill">
                            {sale.items?.length || 0}
                          </span>
                        </td>
                        <td className="pe-3 py-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handlePrintReceipt(sale)}
                          >
                            <i className="bi bi-printer"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
