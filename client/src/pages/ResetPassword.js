import React, { useState } from "react";
import API from "../services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
 import "./ResetPassword.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const [searchParams] = useSearchParams();

  const memberId = searchParams.get("memberId");

  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const res = await API.post("/auth/reset-password", {
        memberId,
        newPassword: password,
      });

      setMessage(res.data.message);

      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (err) {
      setMessage(
        err.response?.data?.message || "Reset failed"
      );
    }
  };



return (
  <div className="reset-password-container">
    <div className="reset-password-card">

      <div className="reset-password-header">
        <h2>Set New Password</h2>
        <p>Create a strong password for your account</p>
      </div>

      <form onSubmit={handleReset} className="reset-form">

        <div className="reset-input-group">
          <label>New Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="reset-input-group">
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="password-rules">
          Password should contain at least 6 characters.
        </div>

        <button type="submit" className="reset-btn">
          Reset Password
        </button>

        {message && (
          <p
            className={`reset-message ${
              message.includes("failed") ||
              message.includes("not") ||
              message.includes("match")
                ? "reset-error"
                : ""
            }`}
          >
            {message}
          </p>
        )}
      </form>

    </div>
  </div>
);
}