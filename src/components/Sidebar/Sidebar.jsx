import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

import { 
  FiHome, FiBarChart2, FiUsers, FiFolder, FiCalendar, 
  FiMessageSquare, FiSettings, FiLogOut,
  FiChevronDown, FiChevronRight, FiActivity, FiFileText,
  FiPieChart, FiUser, FiMail, FiCheckCircle,
  FiClock, FiStar, FiBell, FiShield, FiDatabase, FiServer,
  FiDollarSign, FiShoppingCart,
  FiMenu, FiX
} from 'react-icons/fi';

const Sidebar = () => {

  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [activeSubItem, setActiveSubItem] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState(['dashboard']);

  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);

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
      badge: '3',
      path: '/admin-add-customer',
      subMenu: [
        { id: 'all-customer', title: 'All Customers', icon: <FiUser />, path: '/admin-all-customer' },
        { id: 'add-customer', title: 'Add Customers', icon: <FiUser />, path: '/admin-add-customer' },

      ]
    },
            { id: 'expenses', title: 'Expenses', icon: <FiDollarSign />, path: '/admin-expenses' },
        { id: 'all-orders', title: 'All Orders', icon: <FiShoppingCart />, badge: '2', path: '/All-Orders' },

   
    {
      id: 'settings',
      title: 'Settings',
      icon: <FiSettings />,
      path: '/Theme-Settings',
      subMenu: [
        { id: 'profile', title: 'Profile', icon: <FiUser />, path: '/Admin-Profile-custoize' },

        { id: 'ThemeSettings', title: 'Theme-Settings', icon: <FiBell />, badge: '4', path: '/Theme-Settings' },
      ]
    }
  ];

  const handleLogout = () => {
    console.log('Logging out...');
    navigate('/');
  };

  return (
    <>
      {/* 🔹 Mobile Navbar */}
      <div className="mobile-navbar">
        <div className="mobile-logo">MyAdmin</div>
        <div className="mobile-menu-btn" onClick={openSidebar}>
          <FiMenu size={24} />
        </div>
      </div>

      {/* 🔹 Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      <div className={`admin-sidebar ${isOpen ? 'show' : ''}`}>

        {/* 🔹 Close Button (Mobile) */}
        <div className="mobile-close-wrapper">
          <FiX size={24} className="mobile-close-btn" onClick={closeSidebar} />
        </div>

        {/* User Profile */}
        <div className="user-profile">
          <div className="user-avatar">
            <FiUser />
          </div>
          <div className="user-info">
            <span className="user-name">John Doe</span>
            <span className="user-email">john@admin.com</span>
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
                    onClick={() => {
                      setActiveItem(item.id);
                      if (item.path) navigate(item.path);
                      if (item.subMenu) toggleSubMenu(item.id);
                      closeSidebar();
                    }}
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
                          onClick={() => {
                            setActiveSubItem(subItem.id);
                            if (subItem.path) navigate(subItem.path);
                            closeSidebar();
                          }}
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