import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function ChangePassword() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [form, setForm] = useState({
    current: "",
    newPass: "",
    confirm: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6f9" }}>
      <Sidebar isOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div style={{ marginLeft: isSidebarOpen ? "260px" : "80px", padding: "20px", flex: 1 }}>
        <h2>Change Password</h2>

        <div style={styles.card}>
          <input type="password" name="current" placeholder="Current Password" onChange={handleChange} style={styles.input} />
          <input type="password" name="newPass" placeholder="New Password" onChange={handleChange} style={styles.input} />
          <input type="password" name="confirm" placeholder="Confirm Password" onChange={handleChange} style={styles.input} />

          <button onClick={handleSubmit} style={styles.button}>
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: { background: "#fff", padding: "20px", borderRadius: "10px" },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc"
  },
  button: {
    background: "#ee2b09",
    color: "#fff",
    padding: "10px",
    border: "none",
    borderRadius: "6px"
  }
};