import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt, FaUsers, FaPiggyBank, FaHandHoldingUsd,
  FaMoneyCheckAlt, FaWallet, FaChartBar, FaChevronLeft, FaChevronRight,
  FaQuestionCircle, FaCog, FaCaretDown, FaCaretRight, FaPercentage, FaChartLine, FaBars, FaTimes
} from "react-icons/fa";

export default function Sidebar({ isOpen, setIsSidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [openProfit, setOpenProfit] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobileOpen(false);
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

  const currentPath = location.pathname;

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) setIsMobileOpen(false);
  };

  return (
    <>
      {isMobile && (
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} style={styles.mobileToggle}>
          {isMobileOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
        </button>
      )}

      <div style={{ ...styles.sidebar, width: isMobile ? "260px" : (isOpen ? "260px" : "80px"), left: isMobile ? (isMobileOpen ? "0" : "-260px") : "0" }}>
        <div style={styles.header}>
          {(isOpen || isMobile) && <h2 style={styles.logoText}>Microfinance Web</h2>}
          {!isMobile && (
            <button onClick={() => setIsSidebarOpen(!isOpen)} style={styles.toggleBtn}>
              {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
            </button>
          )}
        </div>

        <ul style={styles.menu}>
          {menuItems.map((item, index) => (
            <li key={index} style={styles.listItem}>
              <div onClick={() => handleNavigation(item.path)} style={{ ...styles.link, background: currentPath === item.path ? "#ee2b09" : "transparent" }}>
                <span style={styles.icon}>{item.icon}</span>
                {(isOpen || isMobile) && <span>{item.name}</span>}
              </div>
            </li>
          ))}

          <li>
            <div onClick={() => setOpenProfit(!openProfit)} style={{ ...styles.link, background: openProfit ? "rgba(238, 43, 9, 0.1)" : "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <span style={styles.icon}><FaChartLine /></span>
                {(isOpen || isMobile) && <span>Profit Product</span>}
              </div>
              {(isOpen || isMobile) && (openProfit ? <FaCaretDown /> : <FaCaretRight />)}
            </div>
            {openProfit && (isOpen || isMobile) && (
              <ul style={styles.subMenu}>
                <li onClick={() => handleNavigation("/dividend")} style={{ ...styles.link, paddingLeft: "40px", background: currentPath === "/dividend" ? "#ee2b09" : "transparent" }}>
                  <span style={styles.icon}><FaPercentage /></span> Dividend
                </li>
                <li onClick={() => handleNavigation("/profit")} style={{ ...styles.link, paddingLeft: "40px", background: currentPath === "/profit" ? "#ee2b09" : "transparent" }}>
                  <span style={styles.icon}><FaChartLine /></span> Profit
                </li>
              </ul>
            )}
          </li>
        </ul>

        <div style={styles.footer}>
          <div onClick={() => handleNavigation("/help")} style={{ ...styles.link, background: currentPath === "/help" ? "#ee2b09" : "transparent" }}>
            <FaQuestionCircle style={styles.icon} />
            {(isOpen || isMobile) && "Help"}
          </div>
          <div onClick={() => handleNavigation("/settings")} style={{ ...styles.link, background: currentPath === "/settings" ? "#ee2b09" : "transparent" }}>
            <FaCog style={styles.icon} />
            {(isOpen || isMobile) && "Settings"}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  sidebar: { background: "#02020c", padding: "15px", color: "#fff", display: "flex", flexDirection: "column", transition: "width 0.3s ease, left 0.3s ease", height: "100vh", position: "fixed", top: 0, zIndex: 1005, overflowY: "auto" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "30px", padding: "0 10px" },
  logoText: { fontSize: "18px", fontWeight: "bold" },
  toggleBtn: { background: "#fff", border: "none", borderRadius: "50%", width: "25px", height: "25px", cursor: "pointer", color: "#ee2b09" },
  mobileToggle: { position: "fixed", top: "12px", left: "15px", zIndex: 10000, background: "#02020c", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", padding: "10px", borderRadius: "8px", cursor: "pointer" },
  menu: { listStyle: "none", padding: 0, flexGrow: 1 },
  listItem: { marginBottom: "8px" },
  subMenu: { listStyle: "none", padding: 0, marginTop: "5px" },
  link: { display: "flex", alignItems: "center", gap: "15px", padding: "12px", borderRadius: "8px", cursor: "pointer", fontSize: "15px", transition: "all 0.2s" },
  icon: { fontSize: "20px", minWidth: "25px" },
  footer: { borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "15px", marginTop: "auto" }
};