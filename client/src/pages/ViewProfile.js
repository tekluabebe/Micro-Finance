import React, { useState, useEffect } from "react";
//import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ViewProfile() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const memberId = localStorage.getItem("memberId");
        const res = await API.get(`/employees/${memberId}`);
        setEmployee(res.data);
      } catch (error) {
        console.error("Failed to fetch employee", error);
      }
    };
    fetchEmployee();
  }, []);

  if (!employee) {
    return <div style={styles.loading}>Loading profile...</div>;
  }

  return (
    <div style={styles.container}>
      
      
      <div style={{ ...styles.main, marginLeft: isSidebarOpen ? "65px" : "35px" }}>
        <div style={styles.card}>
          {/* ግራ ክፍል */}
          <div style={styles.leftSection}>
            <img
              src={employee.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt="profile"
              style={styles.avatar}
            />
           <h2 style={{ color: "#fff", marginTop: "15px" }}>
  {employee.firstName} {employee.lastName}
</h2>

<p style={{ color: "#fff5f7", fontSize: "18px" }}>
  {employee.role}
</p>
          </div>

          {/* ቀኝ ክፍል */}
          <div style={styles.rightSection}>
            <h2 style={{ marginBottom: "30px", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Information</h2>
            
            <div style={styles.infoGrid}>
              {/* Password Section */}
              <div style={{ position: "relative" }}>
                <p style={styles.label}>Password</p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>{showPassword ? employee.password : "••••••••"}</span>
                  <button 
                    onClick={() => setShowPassword(!showPassword)} 
                    style={{ border: "none", background: "none", cursor: "pointer", color: "#E75480" }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div><p style={styles.label}>Phone Number</p><span>{employee.phone}</span></div>
              <div><p style={styles.label}>Category</p><span>{employee.category}</span></div>
              <div><p style={styles.label}>Employee ID</p><span>{employee.memberId}</span></div>
              <div><p style={styles.label}>Gender</p><span>{employee.gender}</span></div>
              <div><p style={styles.label}>Status</p><span>Active Employee</span></div>
            </div>

            <div style={styles.actions}>
              <button style={styles.editBtn} onClick={() => navigate("/profile/edit")}>✏️ Edit Profile</button>
              <button style={styles.passwordBtn} onClick={() => navigate("/profile/change-password")}>🔐 Change Password</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    background: "#35358e",
    minHeight: "100vh",
    width: "100%"
  },

  main: {
    flex: 1,
    padding: "40px",
    transition: "0.3s"
  },

  card: {
    display: "flex",
    background: "#ffffff",
    borderRadius: "25px",
    boxShadow: "0 15px 35px rgba(231,84,128,0.18)",
    overflow: "hidden",
    width: "100%",
    minHeight: "500px"
  },

  leftSection: {
    flex: "0 0 350px",
    background:
      "linear-gradient(135deg, #E75480 0%, #FFB6C1 100%)",
    padding: "60px 40px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },

  rightSection: {
    flex: 1,
    padding: "50px",
    background: "#fff"
  },

  avatar: {
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    border: "6px solid #fff",
    objectFit: "cover",
    boxShadow: "0 8px 20px rgba(139,30,77,0.25)"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
    marginBottom: "40px"
  },

  label: {
    color: "#B76E79",
    marginBottom: "5px",
    fontSize: "14px",
    fontWeight: "bold"
  },

  actions: {
    display: "flex",
    gap: "15px",
    marginTop: "20px"
  },

  editBtn: {
    background:
      "linear-gradient(135deg,#E75480,#C2185B)",
    color: "#fff",
    border: "none",
    padding: "12px 25px",
    borderRadius: "25px",
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: "0 5px 15px rgba(231,84,128,0.3)"
  },

  passwordBtn: {
    background: "#8B1E4D",
    color: "#fff",
    border: "none",
    padding: "12px 25px",
    borderRadius: "25px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "20px",
    color: "#E75480"
  }
};