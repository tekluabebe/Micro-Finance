import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Login.css";

export default function Login() {
  // 1. 'email' የነበረውን ወደ 'memberId' ቀይረነዋል
  const [memberId, setMemberId] = useState(""); 
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 2. እዚህ ጋር 'email' ሳይሆን 'memberId' ብለህ ላክ (ይህ ነው ሰርቨሩ ላይ ያለውን ስህተት የሚያጠፋው)
      const res = await API.post("/auth/login", { 
        memberId: memberId.trim(), // ባዶ ቦታ ካለ ያጠፋል
        password: password, 
        role: role 
      });
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userRole", res.data.user.role);
      localStorage.setItem("memberId", res.data.user.memberId);

      // 3. 'window.location.href = "/Login"' የሚለውን ወደ Dashboard አስተካክለው
      if (res.data.user.role.toLowerCase() === "admin") {
        window.location.href = "/"; // ወደ ዋናው ዳሽቦርድ ይወስዳል
      } else {
        window.location.href = "/member-profile"; 
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed! Please check your ID and Password.");
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
              type="text" 
              value={memberId} 
              onChange={(e) => setMemberId(e.target.value)} 
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