import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Chart from "chart.js/auto";
// 💡 ከ App.js የሚመጣውን 'isSidebarOpen' በ props ተቀብለናል
export default function Employees({ isSidebarOpen = true }) {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
const [search, setSearch] = useState("");

const [darkMode, setDarkMode] = useState(
  localStorage.getItem("employeesTheme") === "dark"
);
useEffect(() => {
  localStorage.setItem(
    "employeesTheme",
    darkMode ? "dark" : "light"
  );
}, [darkMode]);
  // በስክሪን መጠን ለውጥ ላይ ተመስርቶ ገጹን Responsive ለማድረግ
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
const downloadExcel = () => {

  const excelData = employees.map(emp => ({
    "Member ID": emp.memberId,
    "First Name": emp.firstName,
    "Last Name": emp.lastName,
    "Gender": emp.gender,
    "Birth Date": emp.birthDate,
    "Age": emp.age,
    "Category": emp.category,
    "Phone": emp.phone,
    "Marital Status": emp.maritalStatus,
    "Role": emp.role,

    "Father": emp.fatherName,
    "Mother": emp.motherName,

    "Wife": emp.wifeName,
    "Wife Father": emp.wifeFatherName,
    "Wife Mother": emp.wifeMotherName,

    "Husband": emp.husbandName,
    "Husband Father": emp.husbandFatherName,
    "Husband Mother": emp.husbandMotherName,

    "Brothers": emp.brothers?.join(", "),
    "Sisters": emp.sisters?.join(", "),
    "Children": emp.children?.join(", ")
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

  const excelBuffer = XLSX.write(workbook,{
      bookType:"xlsx",
      type:"array"
  });

  const file = new Blob([excelBuffer],{
      type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  saveAs(file,"Employee_List.xlsx");

};

const downloadPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(22);
    doc.text("EMPLOYEE LIST",14,18);

    doc.setFontSize(10);
    doc.text(
      "Employee Management System",
      14,
      26
    );
 doc.text(`Total Employees : ${total}`,14,32);

doc.text(`Adults : ${adults}`,70,32);

doc.text(`Children : ${children}`,110,32);

doc.text(`Admins : ${admins}`,160,32);

doc.text(`Members : ${members}`,210,32);
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      220,
      18
    );

    autoTable(doc,{
        startY:35,

        head:[[
            "ID",
            "Name",
            "Gender",
            "Category",
            "Phone",
            "Role",
            "Father",
            "Mother"
        ]],

        body:employees.map(emp=>[
            emp.memberId,
            emp.firstName+" "+emp.lastName,
            emp.gender,
            emp.category,
            emp.phone,
            emp.role,
            emp.fatherName,
            emp.motherName
        ]),

        styles:{
            fontSize:8
        },

        headStyles:{
            fillColor:[29,78,216]
        }
    });

    doc.save("Employee_List.pdf");

}

const total = employees.length;

const adults = employees.filter(
e=>e.category==="Adult"
).length;

const children = employees.filter(
e=>e.category==="Child"
).length;

const admins = employees.filter(
e=>e.role==="admin"
).length;

const members = employees.filter(
e=>e.role==="member"
).length;


  const initialState = {
    memberId: "",
    birthDate: "",   // 👈 ADD THIS
    age: 0,   
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
const calculateAge = (birthDate) => {
  if (!birthDate) return 0;

  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getFullYear();

  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

  const [formData, setFormData] = useState(initialState);


  useEffect(() => {
  // Destroy previous charts
  if (pieInstance.current) {
    pieInstance.current.destroy();
  }

  if (barInstance.current) {
    barInstance.current.destroy();
  }

  // Pie Chart
  pieInstance.current = new Chart(pieChartRef.current, {
    type: "pie",
    data: {
      labels: ["Adults", "Children", "Admins", "Members"],
      datasets: [
        {
          data: [adults, children, admins, members],
          backgroundColor: [
            "#2563eb",
            "#22c55e",
            "#dc2626",
            "#f59e0b",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });

  // Bar Chart
  barInstance.current = new Chart(barChartRef.current, {
    type: "bar",
    data: {
      labels: [
        "Total Employees",
        "Adults",
        "Children",
        "Admins",
        "Members",
      ],
      datasets: [
        {
          label: "Employees",
          data: [total, adults, children, admins, members],
          backgroundColor: [
            "#1d4ed8",
            "#2563eb",
            "#22c55e",
            "#dc2626",
            "#f59e0b",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });

  return () => {
    if (pieInstance.current) pieInstance.current.destroy();
    if (barInstance.current) barInstance.current.destroy();
  };
}, [total, adults, children, admins, members]);

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
  const { name, value } = e.target;

  if (name === "birthDate") {
    const age = calculateAge(value);

    setFormData((prev) => ({
      ...prev,
      birthDate: value,
      age,
      category: age >= 18 ? "Adult" : "Child",
    }));

    return;
  }

  setFormData({ ...formData, [name]: value });
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
  age: calculateAge(formData.birthDate),
role: (formData.role || "member").toLowerCase(),};

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
  const currentLeftMargin = isMobile ? "0px" : (isSidebarOpen ? "35px" : "30px");



  const dynamicGridStyle = {
    ...styles.gridStyle,
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
  };

  const dynamicActionBarStyle = {
    ...styles.actionBar,
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "center",
  };

  const isMember =
  localStorage.getItem("userRole")?.toLowerCase() === "member";

 const theme = darkMode
  ? {
      pageBg:
        "linear-gradient(135deg,#020617,#0f172a,#1e293b)",
      card: "rgba(15,23,42,0.92)",
      input: "#1e293b",
      text: "#f8fafc",
      secondary: "#cbd5e1",
      border: "#334155",
      primary: "#2563eb",
      success: "#22c55e",
      danger: "#ef4444",
      tableHeader: "#1d4ed8"
    }
  : {
      pageBg:
        "linear-gradient(135deg,#0f4cbd,#2563eb,#3b82f6)",
      card: "rgba(255,255,255,0.95)",
      input: "#ffffff",
      text: "#1e293b",
      secondary: "#475569",
      border: "#dbeafe",
      primary: "#2563eb",
      success: "#22c55e",
      danger: "#ef4444",
      tableHeader: "#1d4ed8"
    };

     const dynamicContainerStyle = {
  ...styles.container,
  marginLeft: currentLeftMargin,
  width: isMobile ? "100%" : `calc(100% - ${currentLeftMargin})`,
  background: theme.pageBg,
  color: theme.text,
};

const pieChartRef = useRef(null);
const barChartRef = useRef(null);

const pieInstance = useRef(null);
const barInstance = useRef(null);

  return (
    <div className="employees-page-container" style={dynamicContainerStyle}>
      <h2
  style={{
    color: theme.text,
    fontWeight: "700",
    marginBottom: "20px"
  }}
>Member Management</h2>
     <div className="emp-actions-bar" style={dynamicActionBarStyle}>
  {!isMember && (
    <button
      onClick={() => {
        setShowForm(!showForm);

        if (!showForm) {
          setEditingId(null);
          setFormData(initialState);
        }
      }}
      style={styles.btnStyle}
    >
      {showForm
        ? "Close Form"
        : editingId
        ? "Edit Member"
        : "Register Member"}
    </button>
  )}

<div
  className="emp-search-box"
  style={{
    width: isMobile ? "100%" : "380px",
  }}
>
  <span className="emp-search-icon">
    🔍
  </span>

  <input
    type="text"
    placeholder="Search Member by Name, Member ID or Phone..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="emp-search-input"
  />

  <span className="emp-search-line"></span>
</div>

     <button
    onClick={downloadExcel}
    style={{
        ...styles.btnStyle,
        background:"#16a34a"
    }}
>
    📗 Excel
</button>

<button
    onClick={downloadPDF}
    style={{
        ...styles.btnStyle,
        background:"#dc2626"
    }}
>
    📄 PDF
</button>
     <button
  onClick={() => setDarkMode(!darkMode)}
  style={{
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    background: darkMode ? "#facc15" : "#1e293b",
    color: darkMode ? "#000" : "#fff"
  }}
>
  {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
</button>
</div>
{!isMember && showForm && (
<form
  onSubmit={handleSubmit}
  style={{
    ...styles.formStyle,
    padding: isMobile ? "15px" : "25px",
    background: theme.card,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    backdropFilter: "blur(12px)",
  }}
>    
    {/* ክፍል 1: Login & Basic Info */}
    <div style={styles.sectionContainer}>
      <h3 style={{
  ...styles.sectionTitle,
  color: theme.text,
  borderBottom: `2px solid ${theme.primary}`
}}>Login & Basic Info</h3>
      <div className="emp-form-grid" style={dynamicGridStyle}>
        <div>
          <label style={{
  ...styles.labelStyle,
  color: theme.secondary
}}>Member ID (Username)</label>
<input
  name="memberId"
  placeholder="Member ID"
  value={formData.memberId}
  onChange={handleChange}
  disabled={editingId}
  style={{
    ...styles.inputStyle,
    background: theme.input,
    color: theme.text,
    WebkitTextFillColor: theme.text,
    opacity: 1,
    border: `1px solid ${theme.border}`,
  }}
/>
        </div>
<div>
  <label style={styles.labelStyle}>Birth Date</label>
  <input
    type="date"
    name="birthDate"
    value={formData.birthDate}
    onChange={handleChange}
    style={styles.inputStyle}
  />
</div>

<div>
  <label style={styles.labelStyle}>Age</label>
<input
  type="number"
  name="age"
  value={formData.age}
  readOnly
  style={{
    ...styles.inputStyle,
    background: theme.input,
    color: theme.text,
    WebkitTextFillColor: theme.text,
    opacity: 1,
    cursor: "not-allowed",
    border: `1px solid ${theme.border}`,
  }}
/>
</div>

       
        {formData.category !== "Child" && (
          <div>
            <label style={{
  ...styles.labelStyle,
  color: theme.secondary
}}>Marital Status</label>
            <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}}>
              <option value="">Marital Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
            </select>
          </div>
        )}
        <div>
          <label style={{
  ...styles.labelStyle,
  color: theme.secondary
}}>Login Password</label>
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}} />
        </div>
        <div>
          <label style={{
  ...styles.labelStyle,
  color: theme.secondary
}}>First Name</label>
          <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}} />
        </div>
        <div>
          <label style={{
  ...styles.labelStyle,
  color: theme.secondary
}}>Last Name</label>
          <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}} />
        </div>
        <div>
          <label style={{
  ...styles.labelStyle,
  color: theme.secondary
}}>Gender</label>
          <select name="gender" value={formData.gender} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}}>
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
        <div>
          <label style={{
  ...styles.labelStyle,
  color: theme.secondary
}}>Phone Number</label>
          <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}} />
        </div>
        <div>
          <label style={{
  ...styles.labelStyle,
  color: theme.secondary
}}>System Role</label>
          <select name="role" value={formData.role} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}}>
            <option value="Member">Member</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </div>
    </div>

    {/* ሰማያዊ መስመር (Blue Divider) */}

    {/* ክፍል 2: Family Info */}
    <div style={styles.sectionContainer}>
      <h3 style={{
  ...styles.sectionTitle,
  color: theme.text,
  borderBottom: `2px solid ${theme.primary}`
}}>Family Info</h3>
      <div className="emp-form-grid" style={dynamicGridStyle}>
        <div>
          <label style={{
  ...styles.labelStyle,
  color: theme.secondary
}}>Father Name</label>
          <input name="fatherName" placeholder="Father Name" value={formData.fatherName} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}} />
        </div>
        <div>
          <label style={{
  ...styles.labelStyle,
  color: theme.secondary
}}>Mother Name</label>
          <input name="motherName" placeholder="Mother Name" value={formData.motherName} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}} />
        </div>
      </div>

      {/* Spouse Logic */}
      {formData.category !== "Child" && formData.maritalStatus === "Married" && (
        <div style={styles.spouseBox}>
          <h4 style={styles.subSectionTitle}>{formData.gender === "Male" ? "Spouse Info (Wife)" : "Spouse Info (Husband)"}</h4>
          <div className="emp-form-grid" style={dynamicGridStyle}>
            {formData.gender === "Male" ? (
              <>
                <input name="wifeName" placeholder="Wife Name" value={formData.wifeName} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}} />
                <input name="wifeFatherName" placeholder="Wife Father's Name" value={formData.wifeFatherName} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}} />
                <input name="wifeMotherName" placeholder="Wife Mother's Name" value={formData.wifeMotherName} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}} />
              </>
            ) : (
              <>
                <input name="husbandName" placeholder="Husband Name" value={formData.husbandName} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}} />
                <input name="husbandFatherName" placeholder="Husband Father's Name" value={formData.husbandFatherName} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}} />
                <input name="husbandMotherName" placeholder="Husband Mother's Name" value={formData.husbandMotherName} onChange={handleChange} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}} />
              </>
            )}
          </div>
        </div>
      )}

      <h4 style={styles.subSectionTitle}>Brothers</h4>
      {formData.brothers.map((b,i)=>
        <input key={i} value={b} placeholder="Brother Name" onChange={(e)=>handleArrayChange(i,"brothers",e.target.value)} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}}/>
      )}
      <button type="button" onClick={()=>addField("brothers")} style={styles.addBtn}>➕ Add Brother</button>

      <h4 style={styles.subSectionTitle}>Sisters</h4>
      {formData.sisters.map((s,i)=>
        <input key={i} value={s} placeholder="Sister Name" onChange={(e)=>handleArrayChange(i,"sisters",e.target.value)} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}}/>
      )}
      <button type="button" onClick={()=>addField("sisters")} style={styles.addBtn}>➕ Add Sister</button>

      <h4 style={styles.subSectionTitle}>Children</h4>
      {formData.children.map((c,i)=>
        <input key={i} value={c} placeholder="Child Name" onChange={(e)=>handleArrayChange(i,"children",e.target.value)} style={{
  ...styles.inputStyle,
  background: theme.input,
  color: theme.text,
  border: `1px solid ${theme.border}`
}}/>
      )}
      <button type="button" onClick={()=>addField("children")} style={styles.addBtn}>➕ Add Child</button>
    </div>

    <br/><br/>
    <button type="submit" style={styles.submitBtn}>{editingId ? "Update Info" : "Register & Create Account"}</button>
  </form>
)}

<h3
  style={{
    marginTop: 30,
    color: theme.text,
    fontWeight: "600"
  }}
>

<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: "20px",
    margin: "30px 0",
  }}
>
  <div
    style={{
      options: {
  responsive: true,
  maintainAspectRatio: false,   // 🔥 IMPORTANT
  plugins: {
    legend: {
      position: "bottom",
    },
  },
},
      background: theme.card,
      padding: "10px",
      borderRadius: "12px",
      border: `1px solid ${theme.border}`,
       height: "260px",  
    }}
  >
    <h3
      style={{
        textAlign: "center",
        marginBottom: "20px",
        color: theme.text,
      }}
    >
      Member Distribution
    </h3>

    <canvas ref={pieChartRef} style={{ maxHeight: "200px" }}></canvas>
    
  </div>

  <div
    style={{
      options: {
  responsive: true,
  maintainAspectRatio: false,   // 🔥 IMPORTANT
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
},
      background: theme.card,
      padding: "10px",
      borderRadius: "12px",
      border: `1px solid ${theme.border}`,
      height: "260px",  
    }}
  >
    <h3
      style={{
        textAlign: "center",
        marginBottom: "20px",
        color: theme.text,
      }}
    >
      Member Statistics
    </h3>

   <canvas ref={barChartRef} style={{ maxHeight: "200px" }}></canvas>
  </div>
</div>


  Member List
</h3>      
<div
  className="emp-table-wrapper"
  style={{
    width: "100%",
    overflowX: "auto",
    borderRadius: "18px",
    background: "rgba(10,18,35,0.96)",
    border: "1px solid rgba(59,130,246,.35)",
    boxShadow:
      "0 0 15px rgba(59,130,246,.25), inset 0 0 20px rgba(255,255,255,.03)",
    padding: "15px"
  }}
>      
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
                <tr
    key={emp._id}
    style={{
        transition: ".3s",
        cursor: "pointer"
    }}
    onMouseEnter={(e)=>{
        e.currentTarget.style.transform="scale(1.01)";
        e.currentTarget.style.boxShadow="0 0 15px rgba(59,130,246,.25)";
    }}
    onMouseLeave={(e)=>{
        e.currentTarget.style.transform="scale(1)";
        e.currentTarget.style.boxShadow="none";
    }}
>
                  <td
 style={{
   ...styles.tdStyle,
   borderTopLeftRadius:12,
   borderBottomLeftRadius:12
}}
>{emp.memberId}</td>

                  <td
style={{
   ...styles.tdStyle,
   borderTopRightRadius:12,
   borderBottomRightRadius:12
}}
>{emp.category}</td>
                 <td
 style={{
   ...styles.tdStyle,
   borderTopRightRadius:12,
   borderBottomRightRadius:12
}}
>{emp.firstName} {emp.lastName}</td>
                  <td
style={{
   ...styles.tdStyle,
   borderTopRightRadius:12,
   borderBottomRightRadius:12
}}
>{emp.phone}</td>
                  <td
  style={{
    ...styles.tdStyle,
    color: theme.text,
  }}
>
                    <span style={{
                        padding: "4px 8px", 
                        borderRadius: 4, 
                        fontSize: 12, 
background: emp.role === "admin"
  ? "#dc2626"
  : "#2563eb",                        
color: "#fff",
                        fontWeight: 'bold'
                    }}>
                     {(emp.role || "member").toUpperCase()}
                    </span>
                  </td>
                 <td
  style={{
    ...styles.tdStyle,
    color: theme.text,
  }}
>
  {!isMember ? (
    <>
      <button
        onClick={() => handleEdit(emp)}
        style={{
          marginRight: 12,
          cursor: "pointer",
          border: "none",
          background: "none",
          fontSize: "16px"
        }}
      >
        ✏️
      </button>

      <button
        onClick={() => handleDelete(emp._id)}
        style={{
          cursor: "pointer",
          border: "none",
          background: "none",
          fontSize: "16px"
        }}
      >
        ❌
      </button>
    </>
  ) : (
    <span
      style={{
        color: "#888",
        fontSize: "13px",
        fontStyle: "italic"
      }}
    >
      View Only
    </span>
  )}
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
        /*==================================================
SUPER AESTHETIC EMPLOYEE SEARCH
==================================================*/

.emp-search-box{

    position:relative;

    display:flex;

    align-items:center;

    height:60px;

    border-radius:18px;

    overflow:hidden;

    background:
    rgba(15,20,35,.82);

    backdrop-filter:blur(18px);
    -webkit-backdrop-filter:blur(18px);

    border:1px solid rgba(0,255,255,.18);

    box-shadow:
    inset 0 0 25px rgba(0,255,255,.05),
    0 10px 35px rgba(0,0,0,.45);

    transition:.4s;
}

.emp-search-box::before{

    content:"";

    position:absolute;

    top:0;
    left:-130%;

    width:120%;
    height:100%;

    background:linear-gradient(
        120deg,
        transparent,
        rgba(0,255,255,.25),
        transparent
    );

    transition:1.1s;
}

.emp-search-box:hover::before{
    left:120%;
}

.emp-search-box:hover{

    border-color:#28fff4;

    box-shadow:
    0 0 20px rgba(0,255,255,.25),
    0 0 45px rgba(0,255,255,.12);
}

.emp-search-box:focus-within{

    transform:translateY(-2px);

    border-color:#00fff2;

    box-shadow:
    0 0 28px rgba(0,255,255,.45),
    0 0 55px rgba(0,255,255,.18);
}

.emp-search-icon{

    width:60px;

    display:flex;

    justify-content:center;
    align-items:center;

    font-size:22px;

    color:#18fff2;

    text-shadow:
    0 0 10px #00fff2;
}

.emp-search-input{

    flex:1;

    height:100%;

    background:transparent;

    border:none;

    outline:none;

    color:#ffffff;

    font-size:16px;

    font-weight:500;

    letter-spacing:.3px;

    padding-right:20px;
}

.emp-search-input::placeholder{

    color:#8ed7dc;

    opacity:.9;
}

.emp-search-line{

    position:absolute;

    left:0;

    bottom:0;

    width:100%;

    height:3px;

    background:linear-gradient(
        90deg,
        transparent,
        #00ffff,
        #5effff,
        #00ffff,
        transparent
    );

    background-size:300%;

    animation:empGlow 3s linear infinite;
}

@keyframes empGlow{

    from{
        background-position:0%;
    }

    to{
        background-position:300%;
    }
}

@media(max-width:768px){

    .emp-search-box{

        width:100%;

        height:56px;
    }

    .emp-search-input{

        font-size:15px;
    }
}
        * {
  transition:
    background-color .3s ease,
    color .3s ease,
    border-color .3s ease,
    box-shadow .3s ease;
}
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
            .employees-page-container input:disabled,
.employees-page-container input[readonly] {
  opacity: 1 !important;
  color: #f8fafc !important;
  -webkit-text-fill-color: #f8fafc !important;
  background-color: #1e293b !important;
}

.employees-page-container input:disabled {
  cursor: not-allowed;
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
  minHeight: "100vh",
  padding: "30px 20px",
  paddingTop: "85px",
  boxSizing: "border-box",
  transition: "all .3s ease"
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
tableStyle: {
  width: "100%",
  tableLayout: "fixed",
  borderCollapse: "collapse",
  minWidth: "900px",
  color: "#e2e8f0",
},

thStyle: {
  padding: "14px 18px",
  color: "rgb(13, 243, 51)",
  fontWeight: "800",
  fontSize: "13px",
  textTransform: "uppercase",
  textAlign: "left",
  background: "linear-gradient(135deg,#7c3aed,#2563eb)",
  borderBottom: "2px solid #60a5fa",
},

tdStyle: {
  padding: "15px 18px",
  background: "#111c34",
  color: "#f8fafc",
  fontSize: "14px",
  textAlign: "left",
  borderBottom: "1px solid rgba(59,130,246,.15)",
},
 spouseBox: { background: "#f8f9fa", padding: "15px", borderRadius: "10px", marginTop: "15px", marginBottom: "15px", border: "1px solid #e9ecef" },
  sectionTitle: { borderBottom: "2px solid #007bff", paddingBottom: "5px", color: "#2c3e50", marginTop: "20px", marginBottom: "15px", fontSize: "17px", fontWeight: "700" },
  subSectionTitle: { color: "#495057", marginTop: "15px", marginBottom: "8px", fontWeight: "600", fontSize: "15px" }
};