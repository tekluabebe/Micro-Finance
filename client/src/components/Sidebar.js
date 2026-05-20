import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt, FaUsers, FaPiggyBank, FaHandHoldingUsd,
  FaMoneyCheckAlt, FaWallet, FaChartBar, FaChevronLeft, FaChevronRight,
  FaQuestionCircle, FaCog, FaCaretDown, FaCaretRight, FaPercentage, FaChartLine, FaBars, FaTimes
} from "react-icons/fa";

// 💡 isOpen እና setIsSidebarOpen ከ App.js በProps ይመጣሉ
export default function Sidebar({ isOpen, setIsSidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openProfit, setOpenProfit] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/", icon: <FaTachometerAlt /> },
    { name: "Employees", path: "/employees", icon: <FaUsers /> },
    { name: "Deposits", path: "/deposits", icon: <FaPiggyBank /> },
    { name: "Loans", path: "/loans", icon: <FaHandHoldingUsd /> },
    { name: "Loan Payments", path: "/loan-payments", icon: <FaMoneyCheckAlt /> },
    { name: "Withdrawals", path: "/withdrawals", icon: <FaWallet /> },
    { name: "Reports", path: "/reports", icon: <FaChartBar /> },
  ];

  // HashRouter ስለሆነ በ location.pathname ላይ የሚመጣውን ፓዝ በትክክል ለማመሳሰል
  const currentPath = location.pathname;

  const isHelpActive = currentPath === "/help" || currentPath === "/Help";
  const isSettingsActive = currentPath === "/settings";

  // ለ HashRouter ተስማሚ የሆነ ገጽ መቀየሪያ እና የሞባይል ሜኑ መዝጊያ ፈንክሽን
  const handleNavigation = (path) => {
    navigate(path); 
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const dynamicSidebarStyle = {
    ...styles.sidebar,
    width: isMobile ? "260px" : (isOpen ? "260px" : "80px"),
    position: "fixed", 
    left: isMobile ? (isMobileOpen ? "0" : "-260px") : "0",
    height: "100vh",
    top: 0,
  };

  return (
    <>
      {isMobile && (
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)} 
          style={{
            position: "fixed",
            top: "12px",
            left: "15px",
            zIndex: 10000,
            background: "#02020c",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)",
            padding: "10px 12px",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
          }}
        >
          {isMobileOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
        </button>
      )}

      <div className="custom-sidebar" style={dynamicSidebarStyle}>
        <div style={styles.header}>
          {(isOpen || isMobile) && <h2 style={styles.logoText}>Microfinance Web</h2>}
          
          {!isMobile && (
            <button onClick={() => setIsSidebarOpen(!isOpen)} style={styles.toggleBtn} className="toggle-sidebar-btn">
              {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
            </button>
          )}
        </div>

        <ul style={styles.menu} className="sidebar-menu-list">
          {menuItems.map((item, index) => {
            const isActive = currentPath === item.path;
            return (
              <li key={index} style={styles.listItem}>
                <div 
                  onClick={() => handleNavigation(item.path)}
                  style={{
                    ...styles.link,
                    cursor: "pointer",
                    background: isActive ? "#ee2b09" : "transparent",
                    justifyContent: (isCollapsed && !isMobile) ? "center" : "flex-start"
                  }}
                >
                  <span style={styles.icon}>{item.icon}</span>
                  {(!isCollapsed || isMobile) && <span>{item.name}</span>}
                </div>
              </li>
              
            );
          })}

          <li style={styles.listItem}>
            <div
              onClick={() => setOpenProfit(!openProfit)}
              style={{
                ...styles.link,
                cursor: "pointer",
                background: openProfit && (isOpen || isMobile) ? "rgba(238, 43, 9, 0.1)" : "transparent",
                justifyContent: (!isOpen && !isMobile) ? "center" : "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <span style={styles.icon}><FaChartLine /></span>
                {(isOpen || isMobile) && <span>Profit Product</span>}
              </div>
              {(isOpen || isMobile) && (openProfit ? <FaCaretDown /> : <FaCaretRight />)}
            </div>

            {openProfit && (isOpen || isMobile) && (
              <ul style={styles.subMenu}>
                <li>
                  <div 
                    onClick={() => handleNavigation("/dividend")}
                    style={{
                      ...styles.link,
                      cursor: "pointer",
                      paddingLeft: "40px",
                      background: currentPath === "/dividend" ? "#ee2b09" : "transparent"
                    }}
                  >
                    <span style={{...styles.icon, fontSize: "16px"}}><FaPercentage /></span>
                    Dividend
                  </div>
                </li>
                <li>
                  <div 
                    onClick={() => handleNavigation("/profit")}
                    style={{
                      ...styles.link,
                      cursor: "pointer",
                      paddingLeft: "40px",
                      background: currentPath === "/profit" ? "#ee2b09" : "transparent"
                    }}
                  >
                    <span style={{...styles.icon, fontSize: "16px"}}><FaChartLine /></span>
                    Profit
                  </div>
                </li>
              </ul>
            )}
          </li>
        </ul>

        <div style={styles.footer} className="sidebar-footer-section">
          {/* እዚህ ጋ help የሚለውን በትንሽ ሆሄ ወደ App.js እንዲገጥም አድርገነዋል */}
          <div 
            onClick={() => handleNavigation("/help")}
            style={{
              ...styles.link, 
              cursor: "pointer",
              background: isHelpActive ? "#ee2b09" : "transparent",
              justifyContent: (!isOpen && !isMobile) ? "center" : "flex-start"
            }}
          >
            <FaQuestionCircle style={styles.icon} />
            {(!isCollapsed || isMobile) && "Help"}
          </div>
          <div 
            onClick={() => handleNavigation("/settings")}
            style={{
              ...styles.link, 
              cursor: "pointer",
              background: isSettingsActive ? "#ee2b09" : "transparent",
              justifyContent: (!isOpen && !isMobile) ? "center" : "flex-start",
              marginTop: "5px"
            }}
          >
            <FaCog style={styles.icon} />
            {(!isCollapsed || isMobile) && "Settings"}
          </div>
          
          <div style={styles.userProfile} className="sidebar-user-profile">
            <img src="https://via.placeholder.com/40" alt="user" style={styles.avatar} />
            {(isOpen || isMobile) && (
              <div style={styles.userInfo}>
                <p style={styles.userName}>Adefrs S.</p>
                <p style={styles.userEmail}>adefrs@web.com</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isMobile && isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 9998,
          }}
        />
      )}
    </>
  );
}

// ... styles object ጸንቶ ይቆያል (ምንም ለውጥ የለውም)
const styles = {
  sidebar: {
    background: "#02020c",
    padding: "15px",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.3s ease, left 0.3s ease",
    boxSizing: "border-box",
    overflowY: "auto",
    zIndex: 1005,
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "30px", padding: "0 10px" },
  logoText: { fontSize: "20px", fontWeight: "bold" },
  toggleBtn: { background: "#fff", border: "none", borderRadius: "50%", width: "25px", height: "25px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ee2b09" },
  menu: { listStyle: "none", padding: 0, flexGrow: 1 },
  listItem: { marginBottom: "8px" },
  subMenu: { listStyle: "none", padding: 0, marginTop: "5px" },
  link: { display: "flex", alignItems: "center", gap: "15px", padding: "12px", borderRadius: "8px", textDecoration: "none", color: "#fff", fontSize: "15px", transition: "all 0.2s" },
  icon: { fontSize: "20px", minWidth: "25px" },
  footer: { borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "15px", marginTop: "auto" },
  userProfile: { display: "flex", alignItems: "center", gap: "10px", marginTop: "20px", padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "10px" },
  avatar: { width: "35px", height: "35px", borderRadius: "50%" },
  userInfo: { overflow: "hidden" },
  userName: { fontSize: "14px", fontWeight: "bold", margin: 0 },
  userEmail: { fontSize: "11px", opacity: 0.7, margin: 0 }
};