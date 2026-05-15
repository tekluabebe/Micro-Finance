import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
  // 1. ቶክኑን ከ localStorage እናነባለን (ሁልጊዜ true መሆኑ ይቅር)
  const [token, setToken] = useState(localStorage.getItem("token"));

  // ቶክኑ ሲቀየር አፑ እንዲያውቀው (ለምሳሌ Login ወይም Logout ሲደረግ)
  useEffect(() => {
    const handleStorageChange = () => setToken(localStorage.getItem("token"));
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
//wede login page endiwesd madregiya
  const isAuthenticated = true;

  return (
    <BrowserRouter>
      {isAuthenticated && <Navbar />}

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {isAuthenticated && <Sidebar />}

        <div style={{ 
          padding: "20px", 
          flexGrow: 1,
          width: "100%",
          // marginLeft ን እዚህ ጋር አስተካክለነዋል
          marginLeft: isAuthenticated ? "0px" : "0px", 
          background: "#f4f7fe" 
        }}>
          <Routes>
            {/* ተጠቃሚው ከገባ ወደ Login መሄድ የለበትም፣ ካልገባ ግን Login ገጽ ይቆያል */}
            <Route 
              path="/login" 
              element={!isAuthenticated ? <Login /> : <Navigate to="/" />} 
            />

            {/* Protected Routes */}
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

            {/* ተጠቃሚው የሌለ ገጽ ቢጠይቅ */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;