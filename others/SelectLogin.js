import React from "react";
import { useNavigate } from "react-router-dom";

export default function SelectLogin() {
  const navigate = useNavigate();

  return (
    <div style={selectStyles.container}>
      <div style={selectStyles.card}>
        <h2 style={selectStyles.title}>Welcome</h2>
        <p style={selectStyles.subtitle}>Select Login Type</p>

        <button
          style={selectStyles.adminBtn}
          onClick={() => navigate("/admin-login")}
        >
          Login as Admin
        </button>

        <button
          style={selectStyles.memberBtn}
          onClick={() => navigate("/member-login")}
        >
          Login as Member
        </button>
      </div>
    </div>
  );
}

/* ✅ RENAMED styles → selectStyles (fixes error) */
const selectStyles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #3498db, #6dd5fa)",
  },

  card: {
    background: "#fff",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center",
    width: "320px",
    boxShadow: "0 6px 15px rgba(0,0,0,0.2)",
  },

  title: {
    marginBottom: "10px",
    fontSize: "24px",
  },

  subtitle: {
    marginBottom: "25px",
    color: "#666",
    fontSize: "14px",
  },

  adminBtn: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    background: "#2c3e50",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px",
    transition: "0.3s",
  },

  memberBtn: {
    width: "100%",
    padding: "12px",
    background: "#27ae60",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px",
    transition: "0.3s",
  },
};