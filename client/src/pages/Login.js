import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Login.css";
import { useSearchParams } from "react-router-dom";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";


export default function Login() {
  // 1. 'email' የነበረውን ወደ 'memberId' ቀይረነዋል
  const [memberId, setMemberId] = useState(""); 
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();


const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await API.post("/auth/login", {
      memberId: memberId.trim(),
      password,
      role
    });

    console.log("LOGIN RESPONSE:", res.data.user);

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("userRole", res.data.user.role);
    localStorage.setItem("memberId", res.data.user.memberId);
    localStorage.setItem(
  "user",
  JSON.stringify(res.data.user)

  
);
    if (res.data.user.role.toLowerCase() === "admin") {
      window.location.href = "/";
    } else {
      window.location.href = "/member-profile";
    }

  } catch (err) {
    setError(err.response?.data?.message || "Login failed!");
  }
};

const saveLogin = (data) => {
  localStorage.setItem("token", data.token);
  localStorage.setItem("userRole", data.user.role);
  localStorage.setItem("memberId", data.user.memberId);
  localStorage.setItem("user", JSON.stringify(data.user));
  window.location.href = data.user.role.toLowerCase() === "admin" ? "/" : "/member-profile";
};

const enableFingerprint = async () => {
  setError("");
  setMessage("");
  try {
    if (!window.PublicKeyCredential) throw new Error("This browser does not support fingerprint login");
    const optionsResponse = await API.post("/auth/passkey/register/options", {
      memberId: memberId.trim(), password, role,
    });
    const registration = await startRegistration({ optionsJSON: optionsResponse.data });
    await API.post("/auth/passkey/register/verify", {
      memberId: memberId.trim(), password, role, response: registration,
    });
    setMessage("Fingerprint login enabled on this phone.");
  } catch (err) {
    setError(err.response?.data?.message || err.message || "Could not enable fingerprint login");
  }
};

const handleFingerprintLogin = async () => {
  setError("");
  try {
    if (!memberId.trim()) throw new Error("Enter your Member ID first");
    const optionsResponse = await API.post("/auth/passkey/login/options", {
      memberId: memberId.trim(),
    });
    const authentication = await startAuthentication({ optionsJSON: optionsResponse.data });
    const response = await API.post("/auth/passkey/login/verify", {
      memberId: memberId.trim(), role, response: authentication,
    });
    saveLogin(response.data);
  } catch (err) {
    setError(err.response?.data?.message || err.message || "Fingerprint login failed");
  }
};

  

const handleForgotPassword = async () => {
  try {
    const res = await API.post("/password-reset-request", {
      memberId: memberId.trim(),
    });

    alert(res.data.message);

if (res.data.isAdmin) {
  navigate(`/reset-password?memberId=${memberId}`);
  return;
}

  } catch (err) {
    alert(err.response?.data?.message || "Failed");
  }
};
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
  🏦
</div>
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
          {message && <p className="success-msg">{message}</p>}
          <button type="submit" className="login-btn">Login</button>

          <button type="button" className="login-btn" onClick={handleFingerprintLogin}>
            Login with fingerprint
          </button>

          <button type="button" className="forgot-btn" onClick={enableFingerprint}>
            Enable fingerprint login
          </button>

          <button
  type="button"
  className="forgot-btn"
  onClick={handleForgotPassword}
>
  Forgot Password?
</button>
        </form>
      </div>
    </div>
  );
}