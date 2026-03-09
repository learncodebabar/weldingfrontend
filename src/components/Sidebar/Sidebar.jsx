import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './Sidebar.css';

import { 
  FiHome, FiBarChart2, FiUsers, FiFolder, FiCalendar, 
  FiMessageSquare, FiSettings, FiLogOut,
  FiChevronDown, FiChevronRight, FiActivity, FiFileText,
  FiPieChart, FiUser, FiMail, FiCheckCircle,
  FiClock, FiStar, FiBell, FiShield, FiDatabase, FiServer,
  FiDollarSign, FiShoppingCart, FiUserPlus, FiUserCheck,
  FiUserX, FiUserMinus, FiCreditCard, FiBriefcase,
  FiMenu, FiX, FiTool, FiAward
} from 'react-icons/fi';

import { FaUserCircle, FaWrench, FaMoneyBillWave, FaUserTag } from 'react-icons/fa';

const Sidebar = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState({
    name: 'Admin',
    email: 'admin@example.com'
  });

  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [activeSubItem, setActiveSubItem] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState(['dashboard']);

  // Fetch admin data on component mount
  useEffect(() => {
    fetchAdminData();
  }, []);

  // Fetch admin data from API
  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await API.get('/admin/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const userData = response.data.user;
      setAdminData({
        name: userData.name || 'Admin',
        email: userData.email || 'admin@example.com'
      });
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  const openSidebar = () => setIsOpen(true);
  
  // ✅ FIXED: Only close sidebar when clicking the close button or overlay
  const closeSidebar = () => setIsOpen(false);

  // ✅ FIXED: Handle overlay click - only closes when clicking the overlay itself
  const handleOverlayClick = (e) => {
    // Only close if the click target is the overlay itself
    if (e.target === e.currentTarget) {
      closeSidebar();
    }
  };

  const toggleSubMenu = (menuId) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: <FiHome />,
      path: '/Admin-Dashboard-overall',
    },
 
    {
      id: 'customer',
      title: 'Customer',
      icon: <FiUsers />,
      subMenu: [
        { id: 'all-customer', title: 'All Customers', icon: <FiUser />, path: '/admin-all-customer' },
        { id: 'add-customer', title: 'Add Customers', icon: <FiUserPlus />, path: '/admin-add-customer' },
      ]
    },

    // ========== LABOR SECTION ==========
    {
      id: 'labor',
      title: 'Labor',
      icon: <FiBriefcase />,
      subMenu: [
        { id: 'all-labor', title: 'All Labor', icon: <FiUsers />, path: '/All-Labor' },
        { id: 'add-labor', title: 'Add Labor', icon: <FiUserPlus />, path: '/Add-Labor' },
        { id: 'labor-attendance', title: 'Labor Attendance', icon: <FiClock />, path: '/Attendance-Page' },
      ]
    },

    // ========== ROLES SECTION ==========
    {
      id: 'roles',
      title: 'Roles',
      icon: <FiAward />,
      subMenu: [
        { id: 'add-role', title: 'Add Role', icon: <FiUserPlus />, path: '/add-roles' },
      ]
    },

    { id: 'expenses', title: 'Expenses', icon: <FiDollarSign />, path: '/admin-expenses' },
    { id: 'all-orders', title: 'All Orders', icon: <FiShoppingCart />, path: '/All-Orders' },

    // ========== SETTINGS SECTION ==========
    {
      id: 'settings',
      title: 'Settings',
      icon: <FiSettings />,
      subMenu: [
        { id: 'account-settings', title: 'Account Settings', icon: <FaUserCircle />, path: '/Admin-Account-Settings' },
        { id: 'profile', title: 'Profile', icon: <FiUser />, path: '/Admin-Profile-custoize' },
        { id: 'theme-settings', title: 'Theme Settings', icon: <FiBell />, path: '/Theme-Settings' },
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  // ✅ FIXED: Handle menu item click without closing sidebar unexpectedly
  const handleMenuItemClick = (item) => {
    setActiveItem(item.id);
    if (item.path) navigate(item.path);
    if (item.subMenu) toggleSubMenu(item.id);
    // Don't close sidebar here - let user close manually
  };

  // ✅ FIXED: Handle submenu item click without closing sidebar unexpectedly
  const handleSubMenuItemClick = (subItem) => {
    setActiveSubItem(subItem.id);
    if (subItem.path) navigate(subItem.path);
    // Don't close sidebar here - let user close manually
  };

  return (
    <>
      {/* 🔹 Mobile Navbar */}
      <div className="mobile-navbar">
        <div className="mobile-logo">Admin Panel</div>
        <div className="mobile-menu-btn" onClick={openSidebar}>
          <FiMenu size={24} />
        </div>
      </div>

      {/* 🔹 Overlay - FIXED: Only closes when clicking overlay itself */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={handleOverlayClick}
        ></div>
      )}

      {/* 🔹 Sidebar - FIXED: Clicking inside sidebar does NOT close it */}
      <div 
        className={`admin-sidebar ${isOpen ? 'show' : ''}`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside sidebar from propagating
      >
        {/* 🔹 Close Button (Mobile) - Only this closes the sidebar */}
        <div className="mobile-close-wrapper">
          <FiX 
            size={24} 
            className="mobile-close-btn" 
            onClick={closeSidebar}
          />
        </div>

        {/* 🔹 Admin Profile - with dynamic data */}
        <div className="user-profile">
          <div className="user-avatar">
            <FaUserCircle />
          </div>
          <div className="user-info">
            <span className="user-name">{adminData.name}</span>
            <span className="user-email">{adminData.email}</span>
          </div>
        </div>

        {/* Main Menu */}
        <div className="sidebar-nav">
          <div className="nav-section">
            <h3 className="nav-section-title">MAIN MENU</h3>

            <ul className="nav-list">
              {menuItems.map(item => (
                <li key={item.id} className="nav-item-wrapper">

                  <div
                    className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
                    onClick={() => handleMenuItemClick(item)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-title">{item.title}</span>
                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                    {item.subMenu && (
                      <span className="nav-arrow">
                        {expandedMenus.includes(item.id) ? <FiChevronDown /> : <FiChevronRight />}
                      </span>
                    )}
                  </div>

                  {item.subMenu && expandedMenus.includes(item.id) && (
                    <ul className="sub-menu">
                      {item.subMenu.map(subItem => (
                        <li
                          key={subItem.id}
                          className={`sub-menu-item ${activeSubItem === subItem.id ? 'active' : ''}`}
                          onClick={() => handleSubMenuItemClick(subItem)}
                        >
                          <span className="sub-menu-icon">{subItem.icon}</span>
                          <span className="sub-menu-title">{subItem.title}</span>
                          {subItem.badge && (
                            <span className="sub-menu-badge">{subItem.badge}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut className="logout-icon" />
            <span className="logout-text">Sign out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;