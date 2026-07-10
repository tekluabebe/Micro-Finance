import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import API from "../services/api"; 
import { FaSave } from "react-icons/fa";
import bcrypt from "bcryptjs";
export default function EditProfile() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 1. መረጃውን ከዳታቤዝ ማምጣት
  useEffect(() => {
    const memberId = localStorage.getItem("memberId");
    API.get(`/employees/${memberId}`)
      .then((res) => setUser(res.data))
      .catch((err) => console.error("Error fetching:", err));
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // 2. መረጃውን ማስቀመጥ (phone እና password ብቻ)
const handleSave = async () => {
  try {
    const memberId = localStorage.getItem("memberId");

    let updatedPassword = user.password;

    // Only hash if password was changed (optional but recommended)
    if (user.password && user.password.length > 0) {
      const salt = await bcrypt.genSalt(10);
      updatedPassword = await bcrypt.hash(user.password, salt);
    }

    await API.put(`/employees/profile/${memberId}`, {
      phone: user.phone,
      password: updatedPassword, // 🔐 hashed password
    });

    alert("Profile updated successfully!");
    navigate("/profile");
  } catch (error) {
    console.error("Update Error:", error);
    alert("Failed to update profile. Check console.");
  }
};
  if (!user) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <Sidebar isOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div style={{ ...styles.main, marginLeft: isSidebarOpen ? "260px" : "80px" }}>
        <h2>Edit Profile</h2>
        <div style={styles.card}>
          {/* የማይቀየሩ መረጃዎች */}
          <label style={styles.label}>Full Name</label>
          <input disabled value={`${user.firstName} ${user.lastName}`} style={styles.disabledInput} />
          
          {/* የሚቀየሩ መረጃዎች */}
          <label style={styles.label}>Phone Number</label>
          <input name="phone" value={user.phone} onChange={handleChange} style={styles.input} />
          
          <label style={styles.label}>Password</label>
          <input name="password" type="password" value={user.password} onChange={handleChange} style={styles.input} />

          <button onClick={handleSave} style={styles.button}>
            <FaSave /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#f4f6f9" },
  main: { flex: 1, padding: "20px" },
  card: { background: "#fff", padding: "25px", borderRadius: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" },
  label: { display: "block", marginTop: "15px", fontWeight: "bold", color: "#333" },
  input: {
    width: "100%", padding: "10px", margin: "8px 0", borderRadius: "6px", border: "1px solid #ee2b09"
  },
  disabledInput: {
    width: "100%", padding: "10px", margin: "8px 0", borderRadius: "6px", border: "1px solid #ccc", background: "#f0f0f0", color: "#666"
  },
  button: {
    background: "#ee2b09", color: "#fff", border: "none", padding: "12px", borderRadius: "6px", cursor: "pointer", width: "100%", marginTop: "20px"
  }
};