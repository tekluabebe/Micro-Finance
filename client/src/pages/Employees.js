import React, { useEffect, useState } from "react";
import API from "../services/api";

// 💡 ከ App.js የሚመጣውን 'isSidebarOpen' በ props ተቀብለናል
export default function Employees({ isSidebarOpen = true }) {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  // በስክሪን መጠን ለውጥ ላይ ተመስርቶ ገጹን Responsive ለማድረግ
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const initialState = {
    memberId: "",
    category: "Adult",
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    maritalStatus: "",
    role: "Member",
    password: "",   
    wifeName: "",
    wifeFatherName: "",
    wifeMotherName: "",
    husbandName: "",
    husbandFatherName: "",
    husbandMotherName: "",
    fatherName: "",
    motherName: "",
    brothers: [""],
    sisters: [""],
    children: [""]
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    fetchEmployees();

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await API.get("/employees");
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (i, field, value) => {
    const updated = [...formData[field]];
    updated[i] = value;
    setFormData({ ...formData, [field]: updated });
  };

  const addField = (field) => {
    setFormData({ ...formData, [field]: [...formData[field], ""] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

 if (!editingId) {
    const exists = employees.some((emp) => emp.memberId === formData.memberId);
    if (exists) {
      alert("ስህተት: ይህ Member ID አስቀድሞ ተመዝግቧል!");
      return;
    }
    // እዚህ ጋር ለሁለቱም ምድብ ፓስወርድ እንደሚያስፈልግ እናረጋግጣለን
    if (!formData.password) {
      alert("እባክህ ለተጠቃሚው ፓስወርድ አስገባ!");
      return;
    }
  }

    try {
     const submissionData = {
  ...formData,
  category: formData.category, // ይሄን መስመር ማረጋገጥ
  role: formData.role.toLowerCase(),
};

      if (editingId) {
        await API.put(`/employees/${editingId}`, submissionData);
        alert("መረጃው በትክክል ተስተካክሏል!");
      } else {
        const res = await API.post("/employees", submissionData);
        setEmployees((prev) => [...prev, res.data]);
        alert(`ምዝገባ ተሳክቷል!\nUsername: ${formData.memberId}\nPassword: ${formData.password}`);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(initialState);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message?.includes("duplicate")) {
        alert("ስህተት: Member ID አስቀድሞ ተይዟል!");
      } else {
        alert("መረጃውን ማስቀመጥ አልተቻለም");
      }
    }
  };

  const handleEdit = (emp) => {
    setFormData({ ...emp, password: "" }); 
    setEditingId(emp._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("ይህንን ሰራተኛ መሰረዝ ትፈልጋለህ?")) return;

    setEmployees(prev => prev.filter(emp => emp._id !== id));

    try {
      await API.delete(`/employees/${id}`);
    } catch (err) {
      console.error("Delete failed:", err);
      fetchEmployees(); 
    }
  };

  const filteredEmployees = employees.filter((e) =>
    `${e.firstName} ${e.lastName} ${e.phone} ${e.memberId}`.toLowerCase().includes(search.toLowerCase())
  );

  // 🛠️ ማስተካከያ፦ ከ App.js የመጣውን ስቴት ተጠቅመን የኮምፒውተር ማርጅንን ማስተካከል። ስልክ ላይ 0px ይሆናል።
  const currentLeftMargin = isMobile ? "0px" : (isSidebarOpen ? "130px" : "65px");

  const dynamicContainerStyle = {
    ...styles.container,
    marginLeft: currentLeftMargin,
    width: isMobile ? "100%" : `calc(100% - ${currentLeftMargin})`,
  };

  const dynamicGridStyle = {
    ...styles.gridStyle,
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
  };

  const dynamicActionBarStyle = {
    ...styles.actionBar,
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "center",
  };

  return (
    <div className="employees-page-container" style={dynamicContainerStyle}>
      <h2 style={{ color: "#2c3e50", marginBottom: "20px", fontWeight: "700" }}>Employees Management</h2>

      <div className="emp-actions-bar" style={dynamicActionBarStyle}>
        <button onClick={() => {
          setShowForm(!showForm);
          if(!showForm) {
            setEditingId(null); 
            setFormData(initialState);
          }
          }} style={styles.btnStyle}>
          {showForm ? "Close Form" : editingId ? "Edit Employee" : "Register Employee"}
        </button>
        <input
          placeholder="Search by name, ID or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="emp-search-input"
          style={{ ...styles.searchInput, width: isMobile ? "100%" : 300 }}
        />
      </div>
{showForm && (
  <form onSubmit={handleSubmit} style={{ ...styles.formStyle, padding: isMobile ? "15px" : "25px" }}>
    
    {/* ክፍል 1: Login & Basic Info */}
    <div style={styles.sectionContainer}>
      <h3 style={styles.sectionTitle}>Login & Basic Info</h3>
      <div className="emp-form-grid" style={dynamicGridStyle}>
        <div>
          <label style={styles.labelStyle}>Member ID (Username)</label>
          <input name="memberId" placeholder="Member ID" value={formData.memberId} onChange={handleChange} style={styles.inputStyle} disabled={editingId} />
        </div>
        <div>
          <label style={styles.labelStyle}>Member Category</label>
          <select name="category" value={formData.category} onChange={handleChange} style={styles.inputStyle}>
            <option value="Member">Adult Member</option>
            <option value="Child">Child Member</option>
          </select>
        </div>
        {formData.category !== "Child" && (
          <div>
            <label style={styles.labelStyle}>Marital Status</label>
            <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} style={styles.inputStyle}>
              <option value="">Marital Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
            </select>
          </div>
        )}
        <div>
          <label style={styles.labelStyle}>Login Password</label>
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} style={styles.inputStyle} />
        </div>
        <div>
          <label style={styles.labelStyle}>First Name</label>
          <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} style={styles.inputStyle} />
        </div>
        <div>
          <label style={styles.labelStyle}>Last Name</label>
          <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} style={styles.inputStyle} />
        </div>
        <div>
          <label style={styles.labelStyle}>Gender</label>
          <select name="gender" value={formData.gender} onChange={handleChange} style={styles.inputStyle}>
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
        <div>
          <label style={styles.labelStyle}>Phone Number</label>
          <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} style={styles.inputStyle} />
        </div>
        <div>
          <label style={styles.labelStyle}>System Role</label>
          <select name="role" value={formData.role} onChange={handleChange} style={styles.inputStyle}>
            <option value="Member">Member</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </div>
    </div>

    {/* ሰማያዊ መስመር (Blue Divider) */}

    {/* ክፍል 2: Family Info */}
    <div style={styles.sectionContainer}>
      <h3 style={styles.sectionTitle}>Family Info</h3>
      <div className="emp-form-grid" style={dynamicGridStyle}>
        <div>
          <label style={styles.labelStyle}>Father Name</label>
          <input name="fatherName" placeholder="Father Name" value={formData.fatherName} onChange={handleChange} style={styles.inputStyle} />
        </div>
        <div>
          <label style={styles.labelStyle}>Mother Name</label>
          <input name="motherName" placeholder="Mother Name" value={formData.motherName} onChange={handleChange} style={styles.inputStyle} />
        </div>
      </div>

      {/* Spouse Logic */}
      {formData.category !== "Child" && formData.maritalStatus === "Married" && (
        <div style={styles.spouseBox}>
          <h4 style={styles.subSectionTitle}>{formData.gender === "Male" ? "Spouse Info (Wife)" : "Spouse Info (Husband)"}</h4>
          <div className="emp-form-grid" style={dynamicGridStyle}>
            {formData.gender === "Male" ? (
              <>
                <input name="wifeName" placeholder="Wife Name" value={formData.wifeName} onChange={handleChange} style={styles.inputStyle} />
                <input name="wifeFatherName" placeholder="Wife Father's Name" value={formData.wifeFatherName} onChange={handleChange} style={styles.inputStyle} />
                <input name="wifeMotherName" placeholder="Wife Mother's Name" value={formData.wifeMotherName} onChange={handleChange} style={styles.inputStyle} />
              </>
            ) : (
              <>
                <input name="husbandName" placeholder="Husband Name" value={formData.husbandName} onChange={handleChange} style={styles.inputStyle} />
                <input name="husbandFatherName" placeholder="Husband Father's Name" value={formData.husbandFatherName} onChange={handleChange} style={styles.inputStyle} />
                <input name="husbandMotherName" placeholder="Husband Mother's Name" value={formData.husbandMotherName} onChange={handleChange} style={styles.inputStyle} />
              </>
            )}
          </div>
        </div>
      )}

      <h4 style={styles.subSectionTitle}>Brothers</h4>
      {formData.brothers.map((b,i)=>
        <input key={i} value={b} placeholder="Brother Name" onChange={(e)=>handleArrayChange(i,"brothers",e.target.value)} style={styles.inputStyle}/>
      )}
      <button type="button" onClick={()=>addField("brothers")} style={styles.addBtn}>➕ Add Brother</button>

      <h4 style={styles.subSectionTitle}>Sisters</h4>
      {formData.sisters.map((s,i)=>
        <input key={i} value={s} placeholder="Sister Name" onChange={(e)=>handleArrayChange(i,"sisters",e.target.value)} style={styles.inputStyle}/>
      )}
      <button type="button" onClick={()=>addField("sisters")} style={styles.addBtn}>➕ Add Sister</button>

      <h4 style={styles.subSectionTitle}>Children</h4>
      {formData.children.map((c,i)=>
        <input key={i} value={c} placeholder="Child Name" onChange={(e)=>handleArrayChange(i,"children",e.target.value)} style={styles.inputStyle}/>
      )}
      <button type="button" onClick={()=>addField("children")} style={styles.addBtn}>➕ Add Child</button>
    </div>

    <br/><br/>
    <button type="submit" style={styles.submitBtn}>{editingId ? "Update Info" : "Register & Create Account"}</button>
  </form>
)}

      <h3 style={{ marginTop: 30, color: "#2c3e50", fontWeight: "600" }}>Employee List</h3>
      
      <div className="emp-table-wrapper" style={{ width: "100%", overflowX: "auto", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)", background: "#fff" }}>
        <table style={styles.tableStyle}>
          <thead>
            <tr>
              <th style={styles.thStyle}>Member ID</th>
              <th style={styles.thStyle}>Category</th>
              <th style={styles.thStyle}>Full Name</th>
              <th style={styles.thStyle}>Phone</th>
              <th style={styles.thStyle}>Role</th>
              <th style={styles.thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(emp=>(
                <tr key={emp._id}>
                  <td style={styles.tdStyle}>{emp.memberId}</td>
                  <td style={styles.tdStyle}>{emp.category}</td>
                  <td style={styles.tdStyle}>{emp.firstName} {emp.lastName}</td>
                  <td style={styles.tdStyle}>{emp.phone}</td>
                  <td style={styles.tdStyle}>
                    <span style={{
                        padding: "4px 8px", 
                        borderRadius: 4, 
                        fontSize: 12, 
                        background: emp.role === 'admin' ? '#fdecea' : '#eaf7ff',
                        color: emp.role === 'admin' ? '#d32f2f' : '#1976d2',
                        fontWeight: 'bold'
                    }}>
                      {emp.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={styles.tdStyle}>
                    <button onClick={()=>handleEdit(emp)} style={{ marginRight: 12, cursor: "pointer", border: "none", background: "none", fontSize: "16px" }}>✏️</button>
                    <button onClick={()=>handleDelete(emp._id)} style={{ cursor: "pointer", border: "none", background: "none", fontSize: "16px" }}>❌</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#7f8c8d" }}>ምንም ሰራተኛ አልተገኘም</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <style>
        {`
          @media (max-width: 768px) {
            .employees-page-container {
              padding: 15px !important;
              padding-top: 80px !important;
              margin-left: 0px !important;
              width: 100% !important;
            }
            .emp-actions-bar {
              gap: 12px !important;
            }
            th, td {
              padding: 12px 10px !important;
              font-size: 14px !important;
            }
          }
        `}
      </style>
    </div>
  );
}

// =========================
// STYLES
// =========================
const styles = {
  container: { 
    backgroundColor: "#f8f9fa", 
    minHeight: "100vh",
    padding: "30px 20px 20px 20px",
    paddingTop: "85px",
    transition: "margin-left 0.3s ease, width 0.3s ease", 
    boxSizing: "border-box"
  },
  actionBar: { display: "flex", gap: "10px", justifyContent: "space-between", marginBottom: "20px" },
  searchInput: { padding: "11px 12px", borderRadius: "6px", border: "1px solid #ced4da", outline: "none", boxSizing: "border-box", fontSize: "14px" },
  inputStyle: { padding: "11px", margin: "5px 0 12px 0", borderRadius: "6px", border: "1px solid #ced4da", width: "100%", boxSizing: "border-box", fontSize: "14px", outline: "none" },
  labelStyle: { fontSize: "13px", fontWeight: "600", color: "#495057", marginLeft: "2px" },
  gridStyle: { display: "grid", gap: "5px 15px" },
  formStyle: { marginTop: "20px", background: "#fff", borderRadius: "12px", border: "1px solid #e9ecef", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" },
  btnStyle: { padding: "10px 20px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
  addBtn: { margin: "5px 0 15px", padding: "8px 14px", border: "1px solid #dee2e6", background: "#fff", cursor: "pointer", borderRadius: "6px", fontSize: "13px", fontWeight: "600", color: "#495057" },
  submitBtn: { padding: "14px", width: "100%", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "15px" },
  tableStyle: { width: "100%", borderCollapse: "collapse", background: "#fff", minWidth: "650px" },
  thStyle: { padding: "14px 12px", background: "#34495e", color: "#fff", textAlign: "left", fontWeight: "600" },
  tdStyle: { padding: "14px 12px", borderBottom: "1px solid #f1f3f5", color: "#495057" },
  spouseBox: { background: "#f8f9fa", padding: "15px", borderRadius: "10px", marginTop: "15px", marginBottom: "15px", border: "1px solid #e9ecef" },
  sectionTitle: { borderBottom: "2px solid #007bff", paddingBottom: "5px", color: "#2c3e50", marginTop: "20px", marginBottom: "15px", fontSize: "17px", fontWeight: "700" },
  subSectionTitle: { color: "#495057", marginTop: "15px", marginBottom: "8px", fontWeight: "600", fontSize: "15px" }
};