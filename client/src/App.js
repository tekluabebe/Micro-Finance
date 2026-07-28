import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./pages/context";

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
import IncomeExpense from "./pages/IncomeExpense";
import ViewProfile from "./pages/ViewProfile";
import EditProfile from "./pages/EditProfile";
import ChangePassword from "./pages/ChangePassword";
import ResetPassword from "./pages/ResetPassword";
import BalanceSheet from "./pages/BalanceSheet";
import CashFlow from "./pages/CashFlow";
import CheckBalance from "./pages/CheckBalance";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userRole, setUserRole] = useState(
    localStorage.getItem("userRole") || ""
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Global appearance and language states
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "Amharic"
  );

  // Save dark mode whenever it changes
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Save language whenever it changes
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
      setUserRole(localStorage.getItem("userRole") || "");

      setDarkMode(localStorage.getItem("darkMode") === "true");
      setLanguage(localStorage.getItem("language") || "Amharic");
    };

    window.addEventListener("storage", handleStorageChange);

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isAuthenticated =
    token !== null && token !== undefined && token !== "";

  const currentLeftMargin = isMobile
    ? "0px"
    : isSidebarOpen
    ? "260px"
    : "80px";

  const currentWidth = isMobile
    ? "100%"
    : isSidebarOpen
    ? "calc(100% - 260px)"
    : "calc(100% - 80px)";

  const appContextValue = {
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    userRole,
    isMobile,
  };

  return (
    <AppProvider value={appContextValue}>
      <HashRouter>
        {isAuthenticated && <Navbar />}

        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            backgroundColor: darkMode ? "#101827" : "#f4f7fe",
            color: darkMode ? "#ffffff" : "#2c3e50",
            transition: "background-color 0.3s ease, color 0.3s ease",
          }}
        >
          {isAuthenticated && (
            <Sidebar
              isOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
            />
          )}

          <div
            style={{
              flexGrow: 1,
              marginLeft: isAuthenticated ? currentLeftMargin : "0px",
              width: isAuthenticated ? currentWidth : "100%",
              transition:
                "margin-left 0.3s ease, width 0.3s ease, background-color 0.3s ease",
              padding: isAuthenticated
                ? isMobile
                  ? "15px"
                  : "25px"
                : "0px",
              paddingTop: isAuthenticated ? "85px" : "0px",
              boxSizing: "border-box",
              minHeight: "100vh",
              backgroundColor: darkMode ? "#101827" : "#f4f7fe",
            }}
          >
            <Routes>
              <Route
                path="/login"
                element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
              />

              <Route
                path="/"
                element={
                  isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
                }
              />

              <Route
                path="/employees"
                element={
                  isAuthenticated ? <Employees /> : <Navigate to="/login" />
                }
              />

              <Route
                path="/deposits"
                element={
                  isAuthenticated ? <Deposits /> : <Navigate to="/login" />
                }
              />

              <Route
                path="/loans"
                element={
                  isAuthenticated ? <Loans /> : <Navigate to="/login" />
                }
              />

              <Route
                path="/loan-payments"
                element={
                  isAuthenticated ? (
                    <LoanPayments />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/withdrawals"
                element={
                  isAuthenticated ? <Withdrawals /> : <Navigate to="/login" />
                }
              />

              <Route
                path="/reports"
                element={
                  isAuthenticated ? <Reports /> : <Navigate to="/login" />
                }
              />
                 
<Route
  path="/balance-sheet"
  element={
    isAuthenticated ? (
      <BalanceSheet />
    ) : (
      <Navigate to="/login" />
    )
  }
/>

<Route
  path="/cash-flow"
  element={
    isAuthenticated ? (
      <CashFlow />
    ) : (
      <Navigate to="/login" />
    )
  }
/>

<Route
  path="/check-balance"
  element={
    isAuthenticated ? (
      <CheckBalance />
    ) : (
      <Navigate to="/login" />
    )
  }
/>

              <Route
                path="/dividend"
                element={
                  isAuthenticated ? <Dividend /> : <Navigate to="/login" />
                }
              />

              <Route
                path="/profit"
                element={
                  isAuthenticated ? <Profit /> : <Navigate to="/login" />
                }
              />

              <Route
                path="/terminated"
                element={
                  isAuthenticated ? (
                    <TerminatedEmployees />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/help"
                element={
                  isAuthenticated ? <HelpPage /> : <Navigate to="/login" />
                }
              />

              <Route
                path="/settings"
                element={
                  isAuthenticated ? <SettingsPage /> : <Navigate to="/login" />
                }
              />

              <Route
                path="/income-expense"
                element={
                  isAuthenticated ? (
                    <IncomeExpense />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/profile"
                element={
                  isAuthenticated ? <ViewProfile /> : <Navigate to="/login" />
                }
              />
            
              <Route
                path="/profile/edit"
                element={
                  isAuthenticated ? <EditProfile /> : <Navigate to="/login" />
                }
              />

              <Route
                path="/profile/change-password"
                element={
                  isAuthenticated ? (
                    <ChangePassword />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route path="/reset-password" element={<ResetPassword />} />

              <Route
                path="*"
                element={
                  <Navigate to={isAuthenticated ? "/" : "/login"} />
                }
              />
            </Routes>
          </div>
        </div>
      </HashRouter>
    </AppProvider>
  );
}

export default App;