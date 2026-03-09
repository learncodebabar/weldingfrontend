import { useState, useEffect } from "react";
import api from "../api/api";
import { useNotifications } from "../context/NotificationContext";
import { API_ENDPOINTS } from "../api/EndPoints";
import "../pages/products/category.css";

export default function SaleHistory() {
  const [sales, setSales] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const itemsPerPage = 10;

  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchSales();
    fetchReturns();
  }, []);

  const getSaleId = (sale) => sale.id || sale._id;

  // Get total returned amount for a specific sale
  const getReturnedAmount = (saleId) => {
    return returns
      .filter((r) => r.originalSaleId == saleId && r.status === "completed")
      .reduce((sum, r) => sum + (Number(r.returnAmount) || 0), 0);
  };

  // Get net amount after returns
  const getNetTotal = (sale) => {
    const returned = getReturnedAmount(getSaleId(sale));
    return Math.max(0, (Number(sale.total) || 0) - returned);
  };

  const fetchSales = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.SALE);
      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data?.data) data = res.data.data;
      else if (res.data?.sales) data = res.data.sales;

      data = data.map((sale) => ({
        ...sale,
        id: sale.id || sale._id,
        createdAt: sale.createdAt ? new Date(sale.createdAt) : new Date(),
      }));

      setSales(
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      );
      setLoading(false);
    } catch (err) {
      addNotification("error", "Failed to load sales history");
      setLoading(false);
    }
  };

  const fetchReturns = async () => {
    try {
      const res = await api.get("/return-exchange");
      setReturns(res.data || []);
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
      sale.customer?.name?.toLowerCase().includes(q) ||
      sale.customer?.phone?.toLowerCase().includes(q) ||
      sale.customerInfo?.name?.toLowerCase().includes(q) ||
      sale.customerInfo?.phone?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  // Summary — use net totals
  const todayTotal = filteredSales.reduce((sum, s) => sum + getNetTotal(s), 0);
  const cashSales = filteredSales.filter((s) => s.saleType === "cash");
  const creditSales = filteredSales.filter(
    (s) => s.saleType === "permanent" || s.saleType === "temporary",
  );
  const totalReturned = filteredSales.reduce(
    (sum, s) => sum + getReturnedAmount(getSaleId(s)),
    0,
  );

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCustomerLabel = (sale) => {
    if (sale.saleType === "permanent") {
      const name = sale.customer?.name?.trim() || "Permanent Customer";
      return (
        <>
          <strong>{name}</strong>
          <br />
          <small className="text-primary fw-medium">Permanent Credit</small>
        </>
      );
    }
    if (sale.saleType === "temporary") {
      const name = sale.customerInfo?.name?.trim() || "Temporary Customer";
      const phone = sale.customerInfo?.phone || "No phone";
      return (
        <>
          <strong>{name}</strong>
          <br />
          <small className="text-warning fw-medium">
            Temporary Credit • {phone}
          </small>
        </>
      );
    }
    return <span className="text-success fw-bold">Cash Sale</span>;
  };

  const getPaymentMethodLabel = (sale) => {
    if (sale.saleType === "permanent" || sale.saleType === "temporary")
      return (
        <span className="badge bg-warning text-dark rounded-pill px-3 py-1">
          Credit
        </span>
      );
    if (sale.saleType === "cash") {
      if (sale.payments?.length > 0) {
        const methods = [
          ...new Set(
            sale.payments.map((p) => {
              const m = p.method?.toLowerCase() || "cash";
              if (m.includes("cash")) return "Cash";
              if (m.includes("easy")) return "EasyPaisa";
              if (m.includes("jazz")) return "JazzCash";
              if (m.includes("bank")) return "Bank";
              if (m.includes("card")) return "Card";
              if (m.includes("upi")) return "UPI";
              return m.charAt(0).toUpperCase() + m.slice(1);
            }),
          ),
        ];
        return (
          <span className="badge bg-success rounded-pill px-3 py-1">
            {methods.join(" + ")}
          </span>
        );
      }
      return (
        <span className="badge bg-success rounded-pill px-3 py-1">Cash</span>
      );
    }
    return (
      <span className="badge bg-secondary rounded-pill px-3 py-1">Unknown</span>
    );
  };

  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      addNotification("warning", "No data to export");
      return;
    }
    const rangeLabels = {
      all: "All Time",
      today: "Today",
      yesterday: "Yesterday",
      last7: "Last 7 Days",
      thisMonth: "This Month",
      custom: `${customStart} to ${customEnd}`,
    };
    let csv = `Sales History Report\nPeriod:,${rangeLabels[dateRange]}\nNet Total:,RS${todayTotal.toLocaleString()}\nTotal Returned:,RS${totalReturned.toLocaleString()}\nTransactions:,${filteredSales.length}\n\n`;
    csv +=
      "Date,Sale ID,Customer,Type,Payment,Gross Amount,Returned,Net Amount\n";
    filteredSales.forEach((sale) => {
      const id = getSaleId(sale).toString().slice(-6).toUpperCase();
      const customer =
        sale.customer?.name || sale.customerInfo?.name || "Cash Sale";
      const type =
        sale.saleType === "permanent"
          ? "Permanent"
          : sale.saleType === "temporary"
            ? "Temporary"
            : "Cash";
      const returned = getReturnedAmount(getSaleId(sale));
      const net = getNetTotal(sale);
      csv += `"${formatDate(sale.createdAt)}",${id},"${customer}",${type},${sale.saleType === "cash" ? "Cash" : "Credit"},RS${sale.total},RS${returned},RS${net}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sales_${dateRange}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification("success", "Exported successfully");
  };

  if (loading)
    return (
      <div className="container-fluid py-5 text-center">
        <div className="spinner-border text-primary" />
        <p className="mt-3">Loading sales...</p>
      </div>
    );

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold mb-0">Sales History</h2>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <select
            className="form-select form-select-sm"
            style={{ width: "150px" }}
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              setPage(1);
            }}
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
                onChange={(e) => {
                  setCustomStart(e.target.value);
                  setPage(1);
                }}
              />
              <input
                type="date"
                className="form-control form-control-sm"
                value={customEnd}
                onChange={(e) => {
                  setCustomEnd(e.target.value);
                  setPage(1);
                }}
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
          <div
            className="card border-0 shadow-sm text-center p-3 text-white rounded-3"
            style={{ background: "rgb(253,126,20)" }}
          >
            <small className="opacity-75">Net Sales</small>
            <h4 className="fw-bold mb-0">RS{todayTotal.toLocaleString()}</h4>
            <small>{filteredSales.length} transactions</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-3 bg-success text-white rounded-3">
            <small className="opacity-75">Cash Sales</small>
            <h4 className="fw-bold mb-0">
              RS
              {cashSales
                .reduce((sum, s) => sum + getNetTotal(s), 0)
                .toLocaleString()}
            </h4>
            <small>{cashSales.length} transactions</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-3 bg-warning text-dark rounded-3">
            <small>Credit Sales</small>
            <h4 className="fw-bold mb-0">
              RS
              {creditSales
                .reduce((sum, s) => sum + getNetTotal(s), 0)
                .toLocaleString()}
            </h4>
            <small>{creditSales.length} transactions</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-3 bg-danger text-white rounded-3">
            <small className="opacity-75">Total Returned</small>
            <h4 className="fw-bold mb-0">RS{totalReturned.toLocaleString()}</h4>
            <small>
              {returns.filter((r) => r.status === "completed").length} returns
            </small>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-3 align-items-center">
            <div className="col-lg-8">
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control ps-5 rounded-pill"
                  placeholder="Search by Sale ID, Customer Name or Phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <small className="text-muted">
                Showing {paginatedSales.length} of {filteredSales.length} sales
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="bg-light border-bottom">
                <tr>
                  <th className="ps-3 py-2 text-uppercase text-muted fw-semibold">
                    Date
                  </th>
                  <th className="py-2 text-uppercase text-muted fw-semibold">
                    Sale ID
                  </th>
                  <th className="py-2 text-uppercase text-muted fw-semibold">
                    Customer
                  </th>
                  <th className="py-2 text-uppercase text-muted fw-semibold">
                    Payment
                  </th>
                  <th className="text-end py-2 text-uppercase text-muted fw-semibold">
                    Gross
                  </th>
                  <th className="text-end py-2 text-uppercase text-muted fw-semibold">
                    Returned
                  </th>
                  <th className="text-end pe-3 py-2 text-uppercase text-muted fw-semibold">
                    Net Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.length > 0 ? (
                  paginatedSales.map((sale) => {
                    const saleId = getSaleId(sale);
                    const shortId = saleId.toString().slice(-6).toUpperCase();
                    const returned = getReturnedAmount(saleId);
                    const net = getNetTotal(sale);
                    const hasReturn = returned > 0;

                    return (
                      <tr
                        key={saleId}
                        className="cursor-pointer border-bottom"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <td className="ps-3 py-2 text-muted">
                          {formatDate(sale.createdAt)}
                        </td>
                        <td className="py-2 fw-semibold text-primary">
                          #{sale.saleNumber || shortId}
                        </td>
                        <td className="py-2 lh-sm">{getCustomerLabel(sale)}</td>
                        <td className="py-2">{getPaymentMethodLabel(sale)}</td>
                        <td className="text-end py-2 text-muted">
                          <small>
                            RS{(Number(sale.total) || 0).toLocaleString()}
                          </small>
                        </td>
                        <td className="text-end py-2">
                          {hasReturn ? (
                            <span className="badge bg-danger bg-opacity-10 text-danger">
                              -RS{returned.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-end pe-3 py-2 fw-bold">
                          <span
                            className={
                              hasReturn ? "text-danger" : "text-success"
                            }
                          >
                            RS{net.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                      No sales found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="card-footer bg-body border-top py-2 px-3">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Page {page} of {totalPages}
              </small>
              <div className="btn-group btn-group-sm">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {selectedSale &&
        (() => {
          const returned = getReturnedAmount(getSaleId(selectedSale));
          const net = getNetTotal(selectedSale);
          const saleReturns = returns.filter(
            (r) =>
              r.originalSaleId == getSaleId(selectedSale) &&
              r.status === "completed",
          );
          return (
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            >
              <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content border-0 shadow-lg">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title fw-bold">
                      <i className="bi bi-receipt me-2"></i>
                      Sale — #
                      {selectedSale.saleNumber ||
                        getSaleId(selectedSale)
                          .toString()
                          .slice(-6)
                          .toUpperCase()}
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setSelectedSale(null)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="row g-3 mb-4">
                      <div className="col-md-4">
                        <small className="text-muted">Date & Time</small>
                        <p className="fw-bold mb-0">
                          {formatDate(selectedSale.createdAt)}
                        </p>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted">Customer</small>
                        <p className="fw-bold mb-0">
                          {getCustomerLabel(selectedSale)}
                        </p>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted">Payment</small>
                        <p className="mb-0">
                          {getPaymentMethodLabel(selectedSale)}
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    <h6 className="fw-bold mb-3">
                      Items ({selectedSale.items?.length || 0})
                    </h6>
                    <div className="table-responsive mb-4">
                      <table className="table table-bordered align-middle small">
                        <thead className="bg-light">
                          <tr>
                            <th>#</th>
                            <th>Item</th>
                            <th className="text-center">Qty</th>
                            <th className="text-end">Price</th>
                            <th className="text-end">Discount</th>
                            <th className="text-end">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSale.items?.map((item, idx) => (
                            <tr key={idx}>
                              <td className="text-muted">{idx + 1}</td>
                              <td className="fw-medium">
                                {item.name || "Unknown"}
                              </td>
                              <td className="text-center">{item.qty || 0}</td>
                              <td className="text-end">
                                RS{(Number(item.price) || 0).toLocaleString()}
                              </td>
                              <td className="text-end text-danger">
                                -{item.itemDiscount || 0}
                              </td>
                              <td className="text-end fw-bold">
                                RS
                                {(
                                  ((Number(item.price) || 0) -
                                    (Number(item.itemDiscount) || 0)) *
                                  (item.qty || 0)
                                ).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Returns for this sale */}
                    {saleReturns.length > 0 && (
                      <>
                        <h6 className="fw-bold mb-3 text-danger">
                          <i className="bi bi-arrow-return-left me-2"></i>
                          Returns ({saleReturns.length})
                        </h6>
                        <div className="table-responsive mb-4">
                          <table className="table table-bordered align-middle small">
                            <thead className="bg-danger bg-opacity-10">
                              <tr>
                                <th>Return #</th>
                                <th>Reason</th>
                                <th>Refund Method</th>
                                <th className="text-end">Amount</th>
                                <th>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {saleReturns.map((r, i) => (
                                <tr key={i}>
                                  <td className="fw-semibold text-danger">
                                    {r.returnNumber}
                                  </td>
                                  <td>{r.reason}</td>
                                  <td className="text-capitalize">
                                    {r.refundMethod?.replace("_", " ")}
                                  </td>
                                  <td className="text-end fw-bold text-danger">
                                    -RS{Number(r.returnAmount).toLocaleString()}
                                  </td>
                                  <td>{formatDate(r.createdAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {/* Totals */}
                    <div className="row justify-content-end">
                      <div className="col-md-5">
                        <table className="table table-sm mb-0">
                          <tbody>
                            <tr>
                              <td className="text-muted">Gross Total</td>
                              <td className="text-end fw-semibold">
                                RS
                                {(
                                  Number(selectedSale.total) || 0
                                ).toLocaleString()}
                              </td>
                            </tr>
                            {returned > 0 && (
                              <tr>
                                <td className="text-danger">
                                  Returns Deducted
                                </td>
                                <td className="text-end text-danger fw-semibold">
                                  -RS{returned.toLocaleString()}
                                </td>
                              </tr>
                            )}
                            <tr className="table-primary">
                              <td className="fw-bold">Net Total</td>
                              <td className="text-end fw-bold fs-5">
                                RS{net.toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setSelectedSale(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
