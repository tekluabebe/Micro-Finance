import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import TerminatedEmployees from "./pages/TerminatedEmployees";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Dividend from "./pages/Dividend";
import Profit from "./pages/Profit";
import Employees from "./pages/Employees";
import Deposits from "./pages/Deposits";
import Loans from "./pages/Loans";
import LoanPayments from "./pages/LoanPayments";
import Withdrawals from "./pages/Withdrawals";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import HelpPage from "./pages/HelpPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  
  // 💡 ሳይድባሩ ክፍት መሆኑን የሚቆጣጠር ዋና ስቴት
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isAuthenticated = token !== null && token !== undefined && token !== "";

  // 🛠️ ሳይድባሩ ሲዘረጋ 260px፣ ሲሰበሰብ 80px ማርጅን ይሰጣል! ለስላሳ እንቅስቃሴ እንዲኖረው transition ተጨምሯል።
  const currentLeftMargin = isMobile ? "0px" : (isSidebarOpen ? "260px" : "80px");
  const currentWidth = isMobile ? "100%" : (isSidebarOpen ? "calc(100% - 260px)" : "calc(100% - 80px)");

  return (
    <HashRouter>
      {isAuthenticated && <Navbar />}

      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f7fe" }}>
        
        {/* ሳይድባር - አሁን isOpen እና setIsSidebarOpen'ን በprops ይወስዳል */}
        {isAuthenticated && (
          <Sidebar isOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        )}

        {/* 💡 ዋናው ማስተካከያ ፔጅ መያዣ (Main Layout Wrapper) */}
        <div style={{ 
          flexGrow: 1,
          marginLeft: isAuthenticated ? currentLeftMargin : "0px",
          width: isAuthenticated ? currentWidth : "100%",
          transition: "margin-left 0.3s ease, width 0.3s ease", // የሳይድባሩን መዘጋት ተከትሎ በለስላሳ ሁኔታ ይንሸራተታል
          padding: isAuthenticated ? (isMobile ? "15px" : "25px") : "0px",
          paddingTop: isAuthenticated ? "85px" : "0px", 
          boxSizing: "border-box"
        }}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/employees" element={isAuthenticated ? <Employees /> : <Navigate to="/login" />} />
            <Route path="/deposits" element={isAuthenticated ? <Deposits /> : <Navigate to="/login" />} />
            <Route path="/loans" element={isAuthenticated ? <Loans /> : <Navigate to="/login" />} />
            <Route path="/loan-payments" element={isAuthenticated ? <LoanPayments /> : <Navigate to="/login" />} />
            <Route path="/withdrawals" element={isAuthenticated ? <Withdrawals /> : <Navigate to="/login" />} />
            <Route path="/reports" element={isAuthenticated ? <Reports /> : <Navigate to="/login" />} />
            <Route path="/dividend" element={isAuthenticated ? <Dividend /> : <Navigate to="/login" />} />
            <Route path="/profit" element={isAuthenticated ? <Profit /> : <Navigate to="/login" />} />
            <Route path="/terminated" element={isAuthenticated ? <TerminatedEmployees /> : <Navigate to="/login" />} />
            <Route path="/help" element={isAuthenticated ? <HelpPage /> : <Navigate to="/login" />} />
            <Route path="/settings" element={isAuthenticated ? <SettingsPage /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;