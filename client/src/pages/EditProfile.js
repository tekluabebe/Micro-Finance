import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import API from "../services/api"; 
import { FaSave } from "react-icons/fa";
import bcrypt from "bcryptjs";
import "./EditProfile.css";

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
    <div className="edit-profile-container" style={styles.container}>
      <Sidebar isOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
<div
  className="edit-profile-main"
  style={{
    ...styles.main,
    marginLeft: isSidebarOpen ? "260px" : "80px",
  }}
>         <div className="edit-profile-content">
    <h2 className="edit-profile-title">Edit Profile</h2>

    
          {/* የማይቀየሩ መረጃዎች */}
          <label style={styles.label}>Full Name</label>
          <input
  disabled
  value={`${user.firstName} ${user.lastName}`}
  className="edit-input"
  style={styles.disabledInput}
/>
          
          {/* የሚቀየሩ መረጃዎች */}
          <label style={styles.label}>Phone Number</label>
         <input
name="phone"
value={user.phone}
onChange={handleChange}
className="edit-input"
style={styles.input}
/>
          
          <label style={styles.label}>Password</label>
         <input
name="password"
type="password"
value={user.password}
onChange={handleChange}
className="edit-input"
style={styles.input}
/>

          <button
className="save-btn"
onClick={handleSave}
style={styles.button}
>
            <FaSave /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#f4f6f9" },
  mcard: {
  background:"#fff",
  padding:"30px",
  borderRadius:"12px",
  boxShadow:"0 8px 20px rgba(0,0,0,.08)",
  maxWidth:"650px",
  margin:"30px auto"
},
  card: {
  background:"#fff",
  padding:"30px",
  borderRadius:"12px",
  boxShadow:"0 8px 20px rgba(0,0,0,.08)",
  maxWidth:"650px",
  margin:"30px auto"
},
  label: { display: "block", marginTop: "15px", fontWeight: "bold", color: "#333" },
input:{
  width:"100%",
  padding:"12px",
  margin:"8px 0 15px",
  borderRadius:"8px",
  border:"1px solid #ee2b09",
  fontSize:"15px",
  boxSizing:"border-box"
},
disabledInput:{
  width:"100%",
  padding:"12px",
  margin:"8px 0 15px",
  borderRadius:"8px",
  border:"1px solid #ccc",
  background:"#f3f3f3",
  color:"#666",
  fontSize:"15px",
  boxSizing:"border-box"
},


button:{
  background:"#ee2b09",
  color:"#fff",
  border:"none",
  padding:"14px",
  borderRadius:"8px",
  cursor:"pointer",
  width:"100%",
  marginTop:"15px",
  fontSize:"16px",
  fontWeight:"600"
},
};