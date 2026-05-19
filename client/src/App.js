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
import Logout from "./pages/Logout";

function App() {
  // 1. መጀመሪያ ቶክን በ localStorage ውስጥ መኖሩን ቼክ እናደርጋለን
  const [token, setToken] = useState(localStorage.getItem("token"));

  // ቶክኑ ሲቀየር (Login ሲደረግ ወይም Logout ሲደረግ) አፑን ለማደስ
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 2. ቶክን ካለ ገብቷል (true) ካልሆነ ግን አልገባም (false)

  // በ App.js ውስጥ
const isAuthenticated = token !== null && token !== undefined && token !== "";

  // በ App.js ውስጥ
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  // ቶከን ከሌለ በቀጥታ ወደ Login ገጽ እንዲመለስ ያደርጋል
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

  return (
    <HashRouter>
      {/* ተጠቃሚው ከገባ ብቻ Navbar እና Sidebar ይታያሉ */}
      {isAuthenticated && <Navbar />}

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {isAuthenticated && <Sidebar />}

        <div style={{ 
          padding: isAuthenticated ? "20px" : "0px", 
          flexGrow: 1,
          width: "100%",
          background: isAuthenticated ? "#f4f7fe" : "#ffffff" 
        }}>
          <Routes>
            {/* ተጠቃሚው ካልገባ (Login ካላደረገ) ሁልጊዜ ወደ /login ይላካል */}
            <Route 
              path="/login" 
              element={!isAuthenticated ? <Login /> : <Navigate to="/" />} 
            />

            {/* Protected Routes: isAuthenticated true ከሆነ ብቻ ይከፈታሉ */}
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
            
            {/* ተጠቃሚው የሌለ ገጽ ቢጠይቅ ወይም ገና ሲስተሙ ሲከፈት */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;