import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");

  // ገጹ እንደተከፈተ ቶከን ካለ በራሱ ወደ ስራ ገጽ እንዲገባ (Auto-redirect)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const userRole = localStorage.getItem("userRole");
      if (userRole?.toLowerCase() === "admin") {
        navigate("/");
      } else {
        navigate("/member-profile");
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // የድሮ ስህተት ካለ ማጽዳት

    try {
      // ወደ Backend የሎጊን ጥያቄ መላክ
      const res = await API.post("/auth/login", {
        memberId,
        password,
        role
      });

      // የመጣውን ዳታ በሙሉ በLocalStorage ውስጥ ማስቀመጥ
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userRole", res.data.user.role);
      localStorage.setItem("memberId", res.data.user.memberId);
      localStorage.setItem("fullName", res.data.user.fullName);

      // በ Role መሰረት ወደ ተገቢው ገጽ መላክ
      // ማሳሰቢያ፡ navigate የሚለው በራሳችን ሳይት ውስጥ ብቻ እንዲቆይ ያደርገዋል
      if (res.data.user.role.toLowerCase() === "admin") {
        navigate("/");
      } else {
        navigate("/member-profile");
      }

    } catch (err) {
      // ስህተት ካለ ለተጠቃሚው ማሳየት
      setError(
        err.response?.data?.message || 
        "መግባት አልተቻለም፣ እባክዎ መረጃዎን ያረጋግጡ ❌"
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Micro-Finance Login</h2>

        <form onSubmit={handleLogin}>
          {/* Role መምረጫ (Member ወይም Admin) */}
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
              placeholder="የመታወቂያ ቁጥር ያስገቡ"
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

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}