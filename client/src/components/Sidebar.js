import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaTachometerAlt, FaUsers, FaPiggyBank, FaHandHoldingUsd,
  FaMoneyCheckAlt, FaWallet, FaChartBar, FaChevronLeft, FaChevronRight,
  FaQuestionCircle, FaCog, FaCaretDown, FaCaretRight, FaPercentage, FaChartLine
} from "react-icons/fa";

export default function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openProfit, setOpenProfit] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/", icon: <FaTachometerAlt /> },
    { name: "Employees", path: "/employees", icon: <FaUsers /> },
    { name: "Deposits", path: "/deposits", icon: <FaPiggyBank /> },
    { name: "Loans", path: "/loans", icon: <FaHandHoldingUsd /> },
    { name: "Loan Payments", path: "/loan-payments", icon: <FaMoneyCheckAlt /> },
    { name: "Withdrawals", path: "/withdrawals", icon: <FaWallet /> },
    { name: "Reports", path: "/reports", icon: <FaChartBar /> },
  ];

  const isHelpActive = location.pathname === "/Help";
  const isSettingsActive = location.pathname === "/settings";

  return (
    <div className="custom-sidebar" style={{ ...styles.sidebar, width: isCollapsed ? "80px" : "260px" }}>
      <div style={styles.header}>
        {!isCollapsed && <h2 style={styles.logoText}>Microfinance Web</h2>}
        <button onClick={() => setIsCollapsed(!isCollapsed)} style={styles.toggleBtn} className="toggle-sidebar-btn">
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      <ul style={styles.menu} className="sidebar-menu-list">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <li key={index} style={styles.listItem}>
              <Link to={item.path} style={{
                ...styles.link,
                background: isActive ? "#ee2b09" : "transparent",
                justifyContent: isCollapsed ? "center" : "flex-start"
              }}>
                <span style={styles.icon}>{item.icon}</span>
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            </li>
          );
        })}

        <li style={styles.listItem}>
          <div
            onClick={() => !isCollapsed && setOpenProfit(!openProfit)}
            style={{
              ...styles.link,
              cursor: "pointer",
              background: openProfit && !isCollapsed ? "rgba(238, 43, 9, 0.1)" : "transparent",
              justifyContent: isCollapsed ? "center" : "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <span style={styles.icon}><FaChartLine /></span>
              {!isCollapsed && <span>Profit Product</span>}
            </div>
            {!isCollapsed && (openProfit ? <FaCaretDown /> : <FaCaretRight />)}
          </div>

          {openProfit && !isCollapsed && (
            <ul style={styles.subMenu}>
              <li>
                <Link to="/dividend" style={{
                  ...styles.link,
                  paddingLeft: "40px",
                  background: location.pathname === "/dividend" ? "#ee2b09" : "transparent"
                }}>
                  <span style={{...styles.icon, fontSize: "16px"}}><FaPercentage /></span>
                  Dividend
                </Link>
              </li>
              <li>
                <Link to="/profit" style={{
                  ...styles.link,
                  paddingLeft: "40px",
                  background: location.pathname === "/profit" ? "#ee2b09" : "transparent"
                }}>
                  <span style={{...styles.icon, fontSize: "16px"}}><FaChartLine /></span>
                  Profit
                </Link>
              </li>
            </ul>
          )}
        </li>
      </ul>

      <div style={styles.footer} className="sidebar-footer-section">
        <Link to="/Help" style={{
          ...styles.link, 
          background: isHelpActive ? "#ee2b09" : "transparent",
          justifyContent: isCollapsed ? "center" : "flex-start"
        }}>
          <FaQuestionCircle style={styles.icon} />
          {!isCollapsed && "Help"}
        </Link>
        <Link to="/settings" style={{
          ...styles.link, 
          background: isSettingsActive ? "#ee2b09" : "transparent",
          justifyContent: isCollapsed ? "center" : "flex-start",
          marginTop: "5px"
        }}>
          <FaCog style={styles.icon} />
          {!isCollapsed && "Settings"}
        </Link>
        
        <div style={styles.userProfile} className="sidebar-user-profile">
          <img src="https://via.placeholder.com/40" alt="user" style={styles.avatar} />
          {!isCollapsed && (
            <div style={styles.userInfo}>
              <p style={styles.userName}>Adefrs S.</p>
              <p style={styles.userEmail}>adefrs@web.com</p>
            </div>
          )}
        </div>
      </div>

      {/* ለሞባይል ዲቫይስ ብቻ የሚሰራ ልዩ የ CSS ስታይል ህግ */}
      <style>
        {`
          @media (max-width: 768px) {
            .custom-sidebar {
              width: 100% !important;
              height: auto !important;
              min-height: auto !important;
              position: relative !important;
              padding: 10px !important;
            }
            .toggle-sidebar-btn {
              display: none !important; /* በስልክ ላይ የመሰብሰቢያ በተን አያስፈልግም */
            }
            .sidebar-menu-list {
              display: flex !important;
              flex-wrap: wrap !important;
              gap: 5px !important;
              margin-bottom: 10px !important;
            }
            .sidebar-menu-list li {
              margin-bottom: 0 !important;
            }
            .sidebar-footer-section {
              margin-top: 10px !important;
              border-top: 1px solid rgba(255,255,255,0.1);
              display: flex !important;
              flex-direction: row !important;
              justify-content: space-between !important;
              align-items: center !important;
            }
            .sidebar-user-profile {
              margin-top: 0 !important;
              padding: 5px 10px !important;
            }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  sidebar: {
    background: "#02020c",
    minHeight: "100vh", 
    padding: "15px",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.3s ease",
    position: "sticky",
    top: 0,
    boxSizing: "border-box",
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "30px", padding: "0 10px" },
  logoText: { fontSize: "20px", fontWeight: "bold" },
  toggleBtn: { background: "#fff", border: "none", borderRadius: "50%", width: "25px", height: "25px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ee2b09" },
  menu: { listStyle: "none", padding: 0, flexGrow: 1 },
  listItem: { marginBottom: "8px" },
  subMenu: { listStyle: "none", padding: 0, marginTop: "5px" },
  link: {
    display: "flex", alignItems: "center", gap: "15px", padding: "12px", borderRadius: "8px",
    textDecoration: "none", color: "#fff", fontSize: "15px", transition: "all 0.2s",
  },
  icon: { fontSize: "20px", minWidth: "25px" },
  footer: { 
    borderTop: "1px solid rgba(255,255,255,0.1)", 
    paddingTop: "15px",
    marginTop: "auto" 
  },
  userProfile: { display: "flex", alignItems: "center", gap: "10px", marginTop: "20px", padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "10px" },
  avatar: { width: "35px", height: "35px", borderRadius: "50%" },
  userInfo: { overflow: "hidden" },
  userName: { fontSize: "14px", fontWeight: "bold", margin: 0 },
  userEmail: { fontSize: "11px", opacity: 0.7, margin: 0 }
};
