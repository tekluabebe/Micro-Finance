import React, { useState } from "react";
import API from "../services/api";
import "./Login.css";

export default function Login() {
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");

  // በLoginPage.js ውስጥ የሚጨመር

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Send memberId instead of email
      const res = await API.post("/auth/login", {
        memberId,
        password,
        role
      });

      // Save token and user info
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userRole", res.data.user.role);
      localStorage.setItem("memberId", res.data.user.memberId);
      localStorage.setItem("fullName", res.data.user.fullName);

      // Redirect by role
      if (res.data.user.role.toLowerCase() === "admin") {
        window.location.href = "/";
      } else {
        window.location.href = "/member-profile";
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Login failed ❌"
      );
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
            >
              Member
            </button>

            <button
              type="button"
              className={role === "admin" ? "active" : ""}
              onClick={() => setRole("admin")}
            >
              Admin
            </button>
          </div>

          <div className="input-group">
            <label>Member ID</label>

            <input
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              required
              placeholder="Enter Member ID"
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

          {error && (
            <p className="error-msg">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-btn"
          >
            Login
          </button>

        </form>
      </div>
    </div>
  );
}