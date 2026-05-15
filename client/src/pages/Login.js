import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member"); // default role
  const [error, setError] = useState("");
  const navigate = useNavigate();

 // Login.js ውስጥ የ handleLogin ክፍል
const handleLogin = async (e) => {
  e.preventDefault();
  try {
    // እዚህ ጋር 'role' መላኩን እርግጠኛ ሁን
    const res = await API.post("/auth/login", { email, password, role });
    
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("userRole", res.data.role);
    
    // በትክክል 'admin' መሆኑን ቼክ አድርጎ ዳሽቦርድ እንዲከፍት
    if (res.data.role === "admin") {
      window.location.href = "/"; // ገጹን Refresh አድርጎ ወደ Dashboard
    } else {
      window.location.href = "/member-profile"; 
    }
  } catch (err) {
    setError(err.response?.data?.message || "ስህተት ተፈጥሯል!");
  }
};

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Micro-Finance Login</h2>
        <form onSubmit={handleLogin}>
          <div className="role-selector">
            <button 
              type="button" 
              className={role === "member" ? "active" : ""} 
              onClick={() => setRole("member")}
            >Member</button>
            <button 
              type="button" 
              className={role === "admin" ? "active" : ""} 
              onClick={() => setRole("admin")}
            >Admin</button>
          </div>

    

<div className="input-group">
  <label>Member ID</label>
  <input 
    type="text"  // <-- እዚህ ጋር text አድርገው (email የነበረውን)
    value={email} 
    onChange={(e) => setEmail(e.target.value)} 
    required 
    placeholder="Enter Member ID (e.g. 005)"
  />
</div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
}