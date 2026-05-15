import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const initialState = {
    memberId: "",
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    maritalStatus: "",
    role: "Member", // Default role
    password: "",   // ለሎጊን የሚያገለግል
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

  // Fetch employees
  useEffect(() => {
    fetchEmployees();
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

  // CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔴 ቼክ፡ Member ID አስቀድሞ መኖሩን ማረጋገጥ (ሲፈጠር ብቻ)
    if (!editingId) {
      const exists = employees.some(
        (emp) => emp.memberId === formData.memberId
      );

      if (exists) {
        alert("ስህተት: ይህ Member ID አስቀድሞ ተመዝግቧል!");
        return;
      }

      if (!formData.password) {
        alert("እባክህ ለተጠቃሚው ፓስወርድ አስገባ!");
        return;
      }
    }

    try {
      // ለሎጊን እንዲመች ዳታውን አዘጋጅተን እንልካለን
      const submissionData = {
        ...formData,
        role: formData.role.toLowerCase(), // 'admin' ወይም 'member' ለማድረግ
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
        alert("መረጃውን ማስቀመጥ አልተቻለም።");
      }
    }
  };

  // EDIT
  const handleEdit = (emp) => {
    setFormData({ ...emp, password: "" }); // Edit ሲደረግ ፓስወርዱን በባዶ እናሳየዋለን
    setEditingId(emp._id);
    setShowForm(true);
  };

  // DELETE
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

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Employees Management</h2>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={() => {
          setShowForm(!showForm);
          if(!showForm) setEditingId(null); setFormData(initialState);
        }} style={btnStyle}>
          {showForm ? "Close Form" : editingId ? "Edit Employee" : "Register Employee"}
        </button>
        <input
          placeholder="Search by name, ID or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px 12px", width: 300, borderRadius: "6px", border: "1px solid #ccc" }}
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3>Login & Basic Info</h3>
          <div style={gridStyle}>
            <div>
                <label>Member ID (Username)</label>
                <input name="memberId" placeholder="Member ID" value={formData.memberId} onChange={handleChange} style={inputStyle} disabled={editingId} />
            </div>
            <div>
                <label>Login Password</label>
                <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} style={inputStyle}/>
            </div>
            <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} style={inputStyle}/>
            <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} style={inputStyle}/>
            
            <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
              <option value="">Gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>
            
            <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} style={inputStyle}/>
            
            <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} style={inputStyle}>
              <option value="">Marital Status</option>
              <option>Single</option>
              <option>Married</option>
            </select>

            <select name="role" value={formData.role} onChange={handleChange} style={inputStyle}>
              <option>Member</option>
              <option>Admin</option>
            </select>
          </div>

          <h3>Family Info</h3>
          <div style={gridStyle}>
            <input name="fatherName" placeholder="Father Name" value={formData.fatherName} onChange={handleChange} style={inputStyle}/>
            <input name="motherName" placeholder="Mother Name" value={formData.motherName} onChange={handleChange} style={inputStyle}/>
          </div>

          {formData.maritalStatus === "Married" && formData.gender === "Male" && (
            <div style={{background: "#eee", padding: 10, borderRadius: 8, marginTop: 10}}>
              <h4>Spouse Info (Wife)</h4>
              <div style={gridStyle}>
                <input name="wifeName" placeholder="Wife Name" value={formData.wifeName} onChange={handleChange} style={inputStyle}/>
                <input name="wifeFatherName" placeholder="Wife Father's Name" value={formData.wifeFatherName} onChange={handleChange} style={inputStyle}/>
                <input name="wifeMotherName" placeholder="Wife Mother's Name" value={formData.wifeMotherName} onChange={handleChange} style={inputStyle}/>
              </div>
            </div>
          )}

          {formData.maritalStatus === "Married" && formData.gender === "Female" && (
            <div style={{background: "#eee", padding: 10, borderRadius: 8, marginTop: 10}}>
              <h4>Spouse Info (Husband)</h4>
              <div style={gridStyle}>
                <input name="husbandName" placeholder="Husband Name" value={formData.husbandName} onChange={handleChange} style={inputStyle}/>
                <input name="husbandFatherName" placeholder="Husband Father's Name" value={formData.husbandFatherName} onChange={handleChange} style={inputStyle}/>
                <input name="husbandMotherName" placeholder="Husband Mother's Name" value={formData.husbandMotherName} onChange={handleChange} style={inputStyle}/>
              </div>
            </div>
          )}

          <h4>Brothers</h4>
          {formData.brothers.map((b,i)=>
            <input key={i} value={b} placeholder="Brother Name" onChange={(e)=>handleArrayChange(i,"brothers",e.target.value)} style={inputStyle}/>
          )}
          <button type="button" onClick={()=>addField("brothers")} style={addBtn}>➕ Add Brother</button>

          <h4>Sisters</h4>
          {formData.sisters.map((s,i)=>
            <input key={i} value={s} placeholder="Sister Name" onChange={(e)=>handleArrayChange(i,"sisters",e.target.value)} style={inputStyle}/>
          )}
          <button type="button" onClick={()=>addField("sisters")} style={addBtn}>➕ Add Sister</button>

          <h4>Children</h4>
          {formData.children.map((c,i)=>
            <input key={i} value={c} placeholder="Child Name" onChange={(e)=>handleArrayChange(i,"children",e.target.value)} style={inputStyle}/>
          )}
          <button type="button" onClick={()=>addField("children")} style={addBtn}>➕ Add Child</button>

          <br/><br/>
          <button type="submit" style={submitBtn}>{editingId ? "Update Info" : "Register & Create Account"}</button>
        </form>
      )}

      <h3 style={{marginTop:30}}>Employee List</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Member ID</th>
            <th style={thStyle}>Full Name</th>
            <th style={thStyle}>Phone</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map(emp=>(
            <tr key={emp._id}>
              <td style={tdStyle}>{emp.memberId}</td>
              <td style={tdStyle}>{emp.firstName} {emp.lastName}</td>
              <td style={tdStyle}>{emp.phone}</td>
              <td style={tdStyle}>
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
              <td style={tdStyle}>
                <button onClick={()=>handleEdit(emp)} style={{marginRight: 5, cursor: "pointer"}}>✏️</button>
                <button onClick={()=>handleDelete(emp._id)} style={{cursor: "pointer"}}>❌</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// STYLES (Inline)
const inputStyle={padding:"10px",margin:"5px 0",borderRadius:"6px",border:"1px solid #ccc",width:"100%", boxSizing: "border-box"};
const gridStyle={display:"grid",gridTemplateColumns:"1fr 1fr",gap:"15px"};
const formStyle={marginTop:"20px",padding:"20px",background:"#f9f9f9",borderRadius:"10px", border: "1px solid #ddd"};
const btnStyle={padding:"10px 20px",backgroundColor:"#007bff",color:"#fff",border:"none",borderRadius:"8px",cursor:"pointer", fontWeight: "bold"};
const addBtn={margin:"5px 0 15px",padding:"6px 12px",border:"1px solid #ddd",background:"#fff",cursor:"pointer",borderRadius:"6px"};
const submitBtn={padding:"14px",width:"100%",backgroundColor:"#28a745",color:"#fff",border:"none",borderRadius:"8px",fontSize:"16px", fontWeight: "bold", cursor: "pointer"};
const tableStyle={width:"100%",borderCollapse:"collapse",marginTop:"15px"};
const thStyle={border:"1px solid #ddd",padding:"12px",background:"#f4f4f4",textAlign:"left"};
const tdStyle={border:"1px solid #ddd",padding:"12px"};