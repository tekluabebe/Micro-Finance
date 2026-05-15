import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaTachometerAlt, FaUsers, FaPiggyBank, FaHandHoldingUsd,
  FaMoneyCheckAlt, FaWallet, FaChartBar, FaChevronLeft, FaChevronRight,
  FaQuestionCircle, FaCog
} from "react-icons/fa";

export default function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false); // ሳይድባሩን ለማጠፍ
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

  return (
    <div style={{ ...styles.sidebar, width: isCollapsed ? "80px" : "260px" }}>
      {/* Sidebar Header */}
      <div style={styles.header}>
        {!isCollapsed && <h2 style={styles.logoText}>Microfinance Web</h2>}
        <button onClick={() => setIsCollapsed(!isCollapsed)} style={styles.toggleBtn}>
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

        {/* Profit Product */}
              <li style={styles.listItem}>
                <div
                  onClick={() => setOpenProfit(!openProfit)}
                  style={{
                    ...styles.link,
                    borderLeft: openProfit ? "4px solid #1abc9c" : "4px solid transparent",
                    background: openProfit ? "rgba(26,188,156,0.15)" : "transparent",
                    fontWeight: openProfit ? "bold" : "normal",
                  }}
                >
                  <span style={styles.icon}>📊</span>
                  Profit Product
                </div>
      
                {openProfit && (
                  <ul style={styles.subMenu}>
                    <li>
                      <Link
                        to="/dividend"
                        style={{
                          ...styles.link,
                          borderLeft:
                            location.pathname === "/dividend"
                              ? "4px solid #1abc9c"
                              : "4px solid transparent",
                          background:
                            location.pathname === "/dividend"
                              ? "rgba(26,188,156,0.15)"
                              : "transparent",
                        }}
                      >
                        <span style={styles.icon}>💰</span>
                        Dividend
                      </Link>
                    </li>
      
                    <li>
                      <Link
                        to="/profit"
                        style={{
                          ...styles.link,
                          borderLeft:
                            location.pathname === "/profit"
                              ? "4px solid #1abc9c"
                              : "4px solid transparent",
                          background:
                            location.pathname === "/profit"
                              ? "rgba(26,188,156,0.15)"
                              : "transparent",
                        }}
                      >
                        <span style={styles.icon}>📈</span>
                        Profit
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
      <ul style={styles.menu}>
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
      </ul>

      {/* Footer Section (Help & User) */}
      <div style={styles.footer}>
        <Link to="/Help" style={{...styles.link, justifyContent: isCollapsed ? "center" : "flex-start"}}>
          <FaQuestionCircle style={styles.icon} />
          {!isCollapsed && "Help"}
        </Link>
        <Link to="/settings" style={{...styles.link, justifyContent: isCollapsed ? "center" : "flex-start"}}>
          <FaCog style={styles.icon} />
          {!isCollapsed && "Settings"}
        </Link>
        
        <div style={styles.userProfile}>
          <img 
            src="https://via.placeholder.com/40" 
            alt="user" 
            style={styles.avatar} 
          />
          {!isCollapsed && (
            <div style={styles.userInfo}>
              <p style={styles.userName}>Adefrs S.</p>
              <p style={styles.userEmail}>adefrs@web.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    background: "#02020c", // ልክ እንደ ምስሉ ሰማያዊ
    height: "100vh",
    padding: "15px",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.3s ease",
    position: "sticky",
    top: 0,
    left: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "30px",
    padding: "0 10px",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "bold",
  },
  toggleBtn: {
    background: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "25px",
    height: "25px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#3f47d9",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
  },
  menu: {
    listStyle: "none",
    padding: 0,
    flexGrow: 1,
  },
  listItem: {
    marginBottom: "8px",
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "12px",
    borderRadius: "8px",
    textDecoration: "none",
    color: "#fff",
    fontSize: "15px",
    transition: "background 0.2s",
  },
  icon: {
    fontSize: "20px",
    minWidth: "25px",
  },
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.1)",
    paddingTop: "15px",
  },
  userProfile: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "20px",
    padding: "10px",
    background: "rgba(0,0,0,0.1)",
    borderRadius: "10px",
  },
  avatar: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  userInfo: {
    overflow: "hidden",
  },
  userName: {
    fontSize: "14px",
    fontWeight: "bold",
    margin: 0,
  },
  userEmail: {
    fontSize: "11px",
    opacity: 0.7,
    margin: 0,
  }
};