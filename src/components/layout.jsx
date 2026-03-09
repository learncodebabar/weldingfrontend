import { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import SettingsOffcanvas from "./SettingsOffcanvas";
import NotificationOffcanvas from "./NotificationOffcanvas.jsx";
import api from "../api/api.js";
import { API_ENDPOINTS } from "../api/EndPoints.js";

// ── constants ──────────────────────────────────────────────────────────────
const SIDEBAR_W = 260;
const SIDEBAR_COL = 68;
const HEADER_H = 60;

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [customersOpen, setCustomersOpen] = useState(false);
  const [shopName, setShopName] = useState("ShopPro");

  const { unreadCount } = useNotifications();
  const { theme, setTheme } = useTheme();
  const { user, logout, isOwner, isManager, isCashier, isStockKeeper } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    api
      .get(API_ENDPOINTS.SHOP_SETTINGS)
      .then((r) => setShopName(r.data?.shopName?.trim() || "ShopPro"))
      .catch(() => {});
  }, []);

  const toggleTheme = () =>
    setTheme({ ...theme, mode: theme.mode === "light" ? "dark" : "light" });
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const can = useCallback(
    (...roles) => {
      if (isOwner) return true;
      if (isManager && roles.includes("manager")) return true;
      if (isCashier && roles.includes("cashier")) return true;
      if (isStockKeeper && roles.includes("stockkeeper")) return true;
      return false;
    },
    [isOwner, isManager, isCashier, isStockKeeper],
  );

  const navItem = ({ isActive }) =>
    `layout-nav-item${isActive ? " active" : ""}${collapsed ? " collapsed" : ""}`;

  const subItem = ({ isActive }) =>
    `layout-sub-item${isActive ? " active" : ""}`;

  return (
    <>
      <style>{`
        :root {
          --lyt-header-h: ${HEADER_H}px;
          --lyt-sidebar-w: ${SIDEBAR_W}px;
          --lyt-sidebar-col: ${SIDEBAR_COL}px;
          --lyt-transition: 0.25s cubic-bezier(.4,0,.2,1);
          --lyt-radius: 10px;
          --lyt-item-h: 44px;
        }

        .layout-root * { box-sizing: border-box; }

        .layout-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: var(--lyt-header-h);
          z-index: 1030;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 12px;
          background: var(--bs-body-bg);
          border-bottom: 1px solid var(--bs-border-color);
          box-shadow: 0 1px 6px rgba(0,0,0,.06);
        }

        .layout-header-brand {
          font-size: 19px;
          font-weight: 700;
          color: var(--bs-primary);
          white-space: nowrap;
          letter-spacing: -.3px;
          text-decoration: none;
          flex-shrink: 0;
          transition: opacity .15s;
        }
        .layout-header-brand:hover { opacity: .8; color: var(--bs-primary); }

        .layout-header-spacer { flex: 1; }

        .layout-header-btn {
          position: relative;
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border: none; background: none; cursor: pointer;
          color: var(--bs-secondary-color);
          border-radius: 8px;
          transition: background .15s, color .15s;
          flex-shrink: 0;
        }
        .layout-header-btn:hover {
          background: rgba(var(--bs-primary-rgb),.08);
          color: var(--bs-primary);
        }
        .layout-header-btn.danger:hover {
          background: rgba(var(--bs-danger-rgb, 220,53,69),.08);
          color: var(--bs-danger);
        }
        .layout-header-btn i { font-size: 20px; line-height: 1; }

        .layout-notif-badge {
          position: absolute;
          top: 4px; right: 4px;
          min-width: 16px; height: 16px;
          padding: 0 4px;
          background: var(--bs-danger);
          color: #fff;
          font-size: 10px; font-weight: 700;
          border-radius: 99px;
          display: flex; align-items: center; justify-content: center;
          line-height: 1;
          pointer-events: none;
        }

        .layout-user-info { line-height: 1.25; }
        .layout-user-info .name  { font-size: 15px; font-weight: 600; color: var(--bs-body-color); }
        .layout-user-info .role  { font-size: 13px; color: var(--bs-secondary-color); text-transform: capitalize; }

        .layout-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.45);
          z-index: 1039;
          backdrop-filter: blur(2px);
          animation: lyt-fade-in .2s ease;
        }
        @keyframes lyt-fade-in { from{opacity:0} to{opacity:1} }

        .layout-sidebar {
          position: fixed;
          top: var(--lyt-header-h);
          left: 0;
          width: var(--lyt-sidebar-w);
          height: calc(100vh - var(--lyt-header-h));
          z-index: 1040;
          display: flex;
          flex-direction: column;
          background: var(--bs-body-bg);
          border-right: 1px solid var(--bs-border-color);
          transition: width var(--lyt-transition), transform var(--lyt-transition);
          overflow: hidden;
          will-change: width, transform;
        }

        .layout-sidebar.is-collapsed {
          width: var(--lyt-sidebar-col);
        }

        @media (max-width: 991.98px) {
          .layout-sidebar {
            transform: translateX(-100%);
            width: var(--lyt-sidebar-w) !important;
            box-shadow: 4px 0 24px rgba(0,0,0,.12);
          }
          .layout-sidebar.mobile-open {
            transform: translateX(0);
          }
        }

        .layout-sidebar-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px 8px 0;
          scrollbar-width: thin;
          scrollbar-color: var(--bs-border-color) transparent;
        }
        .layout-sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .layout-sidebar-scroll::-webkit-scrollbar-thumb {
          background: var(--bs-border-color); border-radius: 99px;
        }

        .layout-sidebar-footer {
          flex-shrink: 0;
          padding: 8px;
          border-top: 1px solid var(--bs-border-color);
        }

        /* ── Section label: 9.5 → 11px ── */
        .layout-section-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .9px;
          text-transform: uppercase;
          color: var(--bs-secondary-color);
          padding: 10px 10px 4px;
          white-space: nowrap;
          overflow: hidden;
          opacity: 1;
          transition: opacity var(--lyt-transition);
        }
        .layout-sidebar.is-collapsed .layout-section-label { opacity: 0; height: 0; padding: 0; }

        /* ── Nav item: 18 → 15px text (icon stays 18px) ── */
        .layout-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          height: var(--lyt-item-h);
          padding: 0 10px;
          border-radius: var(--lyt-radius);
          text-decoration: none;
          color: var(--bs-secondary-color);
          font-size: 18px;
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          transition: background .15s, color .15s;
          margin-bottom: 2px;
          position: relative;
          overflow: hidden;
        }

        .layout-nav-item:hover {
          background: rgba(var(--bs-primary-rgb),.07);
          color: var(--bs-body-color);
        }

        .layout-nav-item.active {
          background: rgba(var(--bs-primary-rgb),.12);
          color: var(--bs-primary);
          font-weight: 600;
        }

        .layout-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 3px;
          background: var(--bs-primary);
          border-radius: 0 3px 3px 0;
        }

        .layout-nav-item.collapsed {
          justify-content: center;
          padding: 0;
          width: ${SIDEBAR_COL - 16}px;
          margin: 0 auto 2px;
        }

        .layout-nav-item i {
          font-size: 18px;
          flex-shrink: 0;
          width: 20px;
          text-align: center;
          line-height: 1;
        }

        .layout-nav-item span {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .layout-nav-item .chevron {
          font-size: 13px;
          flex-shrink: 0;
          transition: transform .2s;
          margin-left: auto;
        }
        .layout-nav-item .chevron.open { transform: rotate(90deg); }

        .layout-sidebar.is-collapsed .layout-nav-item span,
        .layout-sidebar.is-collapsed .layout-nav-item .chevron { display: none; }

        .layout-collapse-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          height: var(--lyt-item-h);
          border-radius: var(--lyt-radius);
          border: none;
          background: none;
          color: var(--bs-secondary-color);
          cursor: pointer;
          width: 100%;
          transition: background .15s, color .15s;
          margin-bottom: 2px;
          gap: 10px;
          padding: 0 10px;
          font-size: 15px;
          font-weight: 500;
          white-space: nowrap;
        }
        .layout-collapse-btn:hover {
          background: rgba(var(--bs-primary-rgb),.07);
          color: var(--bs-body-color);
        }
        .layout-collapse-btn i { font-size: 18px; flex-shrink: 0; width: 20px; text-align: center; }
        .layout-sidebar.is-collapsed .layout-collapse-btn span { display: none; }
        .layout-sidebar.is-collapsed .layout-collapse-btn {
          justify-content: center;
          padding: 0;
          width: ${SIDEBAR_COL - 16}px;
          margin: 0 auto 2px;
        }

        .layout-submenu {
          padding-left: 30px;
          margin-bottom: 2px;
          overflow: hidden;
        }

        /* ── Sub item: 12.5 → 14px ── */
        .layout-sub-item {
          display: flex;
          align-items: center;
          height: 36px;
          padding: 0 10px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--bs-secondary-color);
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          margin-bottom: 1px;
          transition: background .15s, color .15s;
          position: relative;
        }
        .layout-sub-item::before {
          content: '';
          position: absolute;
          left: -14px; top: 50%;
          transform: translateY(-50%);
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--bs-border-color);
          transition: background .15s;
        }
        .layout-sub-item:hover {
          background: rgba(var(--bs-primary-rgb),.07);
          color: var(--bs-body-color);
        }
        .layout-sub-item:hover::before { background: var(--bs-primary); }
        .layout-sub-item.active {
          background: rgba(var(--bs-primary-rgb),.12);
          color: var(--bs-primary);
          font-weight: 600;
        }
        .layout-sub-item.active::before { background: var(--bs-primary); }

        /* ── Logout: 13.5 → 15px ── */
        .layout-logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          height: var(--lyt-item-h);
          padding: 0 10px;
          border-radius: var(--lyt-radius);
          border: none;
          background: none;
          color: var(--bs-danger);
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
          white-space: nowrap;
          transition: background .15s;
        }
        .layout-logout-btn:hover { background: rgba(220,53,69,.08); }
        .layout-logout-btn i { font-size: 18px; flex-shrink: 0; width: 20px; text-align: center; }
        .layout-sidebar.is-collapsed .layout-logout-btn span { display: none; }
        .layout-sidebar.is-collapsed .layout-logout-btn {
          justify-content: center;
          padding: 0;
          width: ${SIDEBAR_COL - 16}px;
          margin: 0 auto;
        }

        @media (min-width: 992px) {
          .layout-sidebar.is-collapsed .layout-nav-item,
          .layout-sidebar.is-collapsed .layout-collapse-btn,
          .layout-sidebar.is-collapsed .layout-logout-btn {
            position: relative;
          }
          .layout-sidebar.is-collapsed [data-tip]:hover::after {
            content: attr(data-tip);
            position: absolute;
            left: calc(100% + 10px);
            top: 50%;
            transform: translateY(-50%);
            background: var(--bs-body-color);
            color: var(--bs-body-bg);
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 13px;
            white-space: nowrap;
            z-index: 9999;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,.15);
          }
        }

        .layout-main {
          margin-top: var(--lyt-header-h);
          margin-left: ${SIDEBAR_W}px;
          min-height: calc(100vh - var(--lyt-header-h));
          background: var(--bs-body-bg);
          transition: margin-left var(--lyt-transition);
          padding: 20px;
        }

        .layout-main.sidebar-collapsed {
          margin-left: ${SIDEBAR_COL}px;
        }

        @media (max-width: 991.98px) {
          .layout-main,
          .layout-main.sidebar-collapsed {
            margin-left: 0 !important;
          }
        }

        .layout-hamburger { display: none; }
        @media (max-width: 991.98px) {
          .layout-hamburger { display: flex; }
          .layout-desktop-collapse { display: none !important; }
        }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="layout-header">
        <button
          className="layout-header-btn layout-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <i className="bi bi-list"></i>
        </button>

        <button
          className="layout-header-btn layout-desktop-collapse"
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Toggle sidebar"
        >
          <i
            className={`bi ${collapsed ? "bi-layout-sidebar" : "bi-layout-sidebar-reverse"}`}
          ></i>
        </button>

        <span className="layout-header-brand">{shopName}</span>
        <div className="layout-header-spacer" />

        <div className="layout-user-info d-none d-sm-block">
          <div className="name">{user?.name || user?.username || "User"}</div>
          <div className="role">{user?.role || "Staff"}</div>
        </div>

        <button
          className="layout-header-btn"
          onClick={() => setShowNotifications(true)}
          aria-label="Notifications"
        >
          <i className="bi bi-bell"></i>
          {unreadCount > 0 && (
            <span className="layout-notif-badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <button
          className="layout-header-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          <i
            className={`bi ${theme.mode === "light" ? "bi-moon-stars" : "bi-sun"}`}
          ></i>
        </button>

        <button
          className="layout-header-btn"
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
        >
          <i className="bi bi-gear"></i>
        </button>

        <button
          className="layout-header-btn danger"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <i className="bi bi-power"></i>
        </button>
      </header>

      {mobileOpen && (
        <div className="layout-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside
        className={`layout-sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}
      >
        <div className="layout-sidebar-scroll">
          {can("manager") && (
            <>
              <div className="layout-section-label">General</div>
              <NavLink to="/" end className={navItem} data-tip="Dashboard">
                <i className="bi bi-speedometer2"></i>
                <span>Dashboard</span>
              </NavLink>
            </>
          )}

          {can("manager", "cashier", "stockkeeper") && (
            <>
              <div className="layout-section-label">Catalogue</div>
              <NavLink to="/products" className={navItem} data-tip="Products">
                <i className="bi bi-box-seam"></i>
                <span>Products</span>
              </NavLink>
              <NavLink
                to="/categories"
                className={navItem}
                data-tip="Categories"
              >
                <i className="bi bi-tag"></i>
                <span>Categories</span>
              </NavLink>
              {can("manager", "stockkeeper") && (
                <NavLink
                  to="/locations"
                  className={navItem}
                  data-tip="Locations"
                >
                  <i className="bi bi-building"></i>
                  <span>Locations</span>
                </NavLink>
              )}
            </>
          )}

          {can("manager", "cashier") && (
            <>
              <div className="layout-section-label">Sales</div>
              <button
                className={`layout-nav-item${collapsed ? " collapsed" : ""}`}
                onClick={() => setSalesOpen((o) => !o)}
                data-tip="Sales"
              >
                <i className="bi bi-cart3"></i>
                <span>Sales</span>
                <i
                  className={`bi bi-chevron-right chevron${salesOpen ? " open" : ""}`}
                ></i>
              </button>
              {!collapsed && salesOpen && (
                <div className="layout-submenu">
                  <NavLink to="/sales/pos" className={subItem}>
                    POS Terminal
                  </NavLink>
                  <NavLink to="/sales/return" className={subItem}>
                    Return / Exchange
                  </NavLink>
                  <NavLink to="/sales/history" className={subItem}>
                    Sales History
                  </NavLink>
                </div>
              )}
            </>
          )}

          {can("manager", "cashier") && (
            <>
              <div className="layout-section-label">Customers</div>
              <button
                className={`layout-nav-item${collapsed ? " collapsed" : ""}`}
                onClick={() => setCustomersOpen((o) => !o)}
                data-tip="Customers"
              >
                <i className="bi bi-people"></i>
                <span>Customers</span>
                <i
                  className={`bi bi-chevron-right chevron${customersOpen ? " open" : ""}`}
                ></i>
              </button>
              {!collapsed && customersOpen && (
                <div className="layout-submenu">
                  <NavLink to="/customers/cash" className={subItem}>
                    Cash Customers
                  </NavLink>
                  <NavLink to="/customers/permanent-credit" className={subItem}>
                    Credit Customers
                  </NavLink>
                  <NavLink to="/customers/temporary-credit" className={subItem}>
                    Temporary Credits
                  </NavLink>
                </div>
              )}
            </>
          )}

          {can("manager") && (
            <>
              <div className="layout-section-label">Finance</div>
              <NavLink to="/reports" className={navItem} data-tip="Reports">
                <i className="bi bi-graph-up-arrow"></i>
                <span>Reports</span>
              </NavLink>
              <NavLink to="/expenses" className={navItem} data-tip="Expenses">
                <i className="bi bi-currency-exchange"></i>
                <span>Expenses</span>
              </NavLink>
            </>
          )}

          {can("manager", "cashier") && (
            <>
              <div className="layout-section-label">Stock</div>
              <NavLink to="/inventory" className={navItem} data-tip="Inventory">
                <i className="bi bi-boxes"></i>
                <span>Inventory</span>
              </NavLink>
            </>
          )}

          {isOwner && (
            <>
              <div className="layout-section-label">Admin</div>
              <NavLink to="/employees" className={navItem} data-tip="Employees">
                <i className="bi bi-person-badge"></i>
                <span>Employees</span>
              </NavLink>
              <NavLink to="/setting" className={navItem} data-tip="Settings">
                <i className="bi bi-gear"></i>
                <span>Settings</span>
              </NavLink>
            </>
          )}

          <div style={{ height: 12 }} />
        </div>

        <div className="layout-sidebar-footer">
          <button
            className="layout-logout-btn"
            onClick={handleLogout}
            data-tip="Logout"
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <main className={`layout-main${collapsed ? " sidebar-collapsed" : ""}`}>
        <Outlet />
      </main>

      <SettingsOffcanvas
        show={showSettings}
        handleClose={() => setShowSettings(false)}
      />
      <NotificationOffcanvas
        show={showNotifications}
        handleClose={() => setShowNotifications(false)}
      />
    </>
  );
}
