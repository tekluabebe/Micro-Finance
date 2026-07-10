import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import "./ChangePassword.css";

export default function ChangePassword() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [form, setForm] = useState({
    current: "",
    newPass: "",
    confirm: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    if (form.newPass !== form.confirm) {
      alert("Passwords do not match!");
      return;
    }

    console.log(form);
    alert("Password updated successfully");
  };

  return (
    <div
      className="change-password-container"
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f4f6f9"
      }}
    >
      <Sidebar
        isOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div
        className="change-password-main"
        style={{
          marginLeft: isSidebarOpen ? "260px" : "80px",
          padding: "20px",
          flex: 1,
          transition: ".3s"
        }}
      >
        <h2
          style={{
            marginBottom: "20px",
            color: "#333"
          }}
        >
          Change Password
        </h2>

        <div
          className="password-card"
          style={styles.card}
        >
          <input
            className="password-input"
            type="password"
            name="current"
            placeholder="Current Password"
            value={form.current}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            className="password-input"
            type="password"
            name="newPass"
            placeholder="New Password"
            value={form.newPass}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            className="password-input"
            type="password"
            name="confirm"
            placeholder="Confirm Password"
            value={form.confirm}
            onChange={handleChange}
            style={styles.input}
          />

          <button
            className="password-btn"
            onClick={handleSubmit}
            style={styles.button}
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    maxWidth: "550px",
    width: "100%",
    margin: "30px auto",
    boxSizing: "border-box"
  },

  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "18px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box"
  },

  button: {
    width: "100%",
    background: "#ee2b09",
    color: "#fff",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    transition: "0.3s"
  }
};