import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { FaUserMinus, FaListUl, FaMoneyCheckAlt } from "react-icons/fa";
import './withdrawals.css';

export default function Withdrawals() {
  const userRole = localStorage.getItem("userRole")?.toLowerCase() || "member";
  const isMember = userRole === "member";
  const [employees, setEmployees] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loans, setLoans] = useState([]); 
  const navigate = useNavigate();

  const [data, setData] = useState({
    employeeId: "",
    fullName: "",
    totalSaving: "",
    reason: "",
  });

 // const userRole =
  //localStorage.getItem("userRole")?.toLowerCase() || "member";

//const isMember = userRole === "member";

const loggedInMemberId =
  localStorage.getItem("memberId");

  // =======================
  // LOAD DATA
  // =======================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await API.get("/employees");
        const depRes = await API.get("/deposits");
        const loanRes = await API.get("/loans"); 

        setEmployees(empRes.data || []);
        setDeposits(depRes.data || []);
        setLoans(loanRes.data || []);
      } catch (err) {
        console.error("Load error:", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
  if (
    isMember &&
    loggedInMemberId &&
    employees.length > 0
  ) {
    const employee = employees.find(
      (emp) =>
        String(emp.memberId) === String(loggedInMemberId)
    );

    if (employee) {
      const total = calculateSaving(employee._id);

      setData({
        employeeId: employee._id,
        fullName: `${employee.firstName} ${employee.lastName}`,
        totalSaving: total,
        reason: "",
      });
    }
  }
}, [employees, deposits]);

  // =======================
  // CHECK ACTIVE LOAN
  // =======================
  const hasActiveLoan = (employeeId) => {
    return loans.some(
      (l) =>
        String(l.employeeId?._id || l.employeeId) === String(employeeId) &&
        l.status === "approved" &&
        l.remainingAmount > 0
    );
  };

  // =======================
  // CALCULATE SAVING
  // =======================
  const calculateSaving = (employeeId) => {
    const total = deposits
      .filter(
        (d) =>
          String(d.employeeId?._id || d.employeeId) === String(employeeId)
      )
      .reduce((sum, d) => {
        const normal = parseFloat(d.normalSaving) || 0;
        const voluntary = parseFloat(d.voluntarySaving) || 0;
        return sum + normal + voluntary;
      }, 0);

    return total;
  };

  // =======================
  // HANDLE CHANGE
  // =======================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "employeeId") {
      const selectedEmp = employees.find((emp) => emp._id === value);
      const total = calculateSaving(value);

      setData({
        ...data,
        employeeId: value,
        fullName: selectedEmp
          ? `${selectedEmp.firstName} ${selectedEmp.lastName}`
          : "",
        totalSaving: total,
      });
    } else {
      setData({
        ...data,
        [name]: value,
      });
    }
  };

  // =======================
  // SUBMIT
  // =======================
  const submit = async () => {
    if (!data.employeeId || !data.reason) {
      alert("Please fill all required fields");
      return;
    }

    if (hasActiveLoan(data.employeeId)) {
      alert("Please finish your loan before proceeding withdrawals ❌");
      return;
    }

    try {
      const emp = employees.find((e) => e._id === data.employeeId);

    

  await API.post("/withdrawals", {
  employeeId: data.employeeId,
  fullName: data.fullName,
  totalSaving: data.totalSaving,
  reason: data.reason,
  status: "pending",
  isRead: false,
});

      //await API.delete(`/employees/${data.employeeId}`);

      alert("Employee moved to terminated list ✅");

      setEmployees((prev) =>
        prev.filter((e) => e._id !== data.employeeId)
      );

      setData({
        employeeId: "",
        fullName: "",
        totalSaving: "",
        reason: "",
      });

    } catch (err) {
      console.error("FRONT ERROR:", err.response?.data || err.message);
      alert("Error processing withdrawal ❌");
    }
  };

  return (
    <div className="withdraw-container">
      <div className="withdraw-card">
        
       {!isMember && (
  <div className="top-bar">
    <button
      onClick={() => (window.location.href = "/Micro-Finance/#/terminated")}
      className="view-btn"
    >
      <FaListUl /> View Terminated
    </button>
  </div>
)}

        <h2 className="withdraw-title">
          <FaUserMinus color="#8e44ad" /> 
          Leave Request Form/የመውጫ ፎርም
        </h2>

        {/* EMPLOYEE */}
      <div className="input-field-group">
  <label className="field-label">
    Select Employee 
  </label>

  <select
    name="employeeId"
    value={data.employeeId}
    onChange={handleChange}
    className="modern-select"
    disabled={isMember}
  >
    {!isMember ? (
      <>
        <option value="">
          Choose an employee...
        </option>

        {employees.map((emp) => (
          <option
            key={emp._id}
            value={emp._id}
          >
            {emp.memberId} - {emp.firstName}{" "}
            {emp.lastName}
            {hasActiveLoan(emp._id)
              ? " (Active Loan ❌)"
              : ""}
          </option>
        ))}
      </>
    ) : (
      employees
        .filter(
          (emp) =>
            String(emp.memberId) ===
            String(loggedInMemberId)
        )
        .map((emp) => (
          <option
            key={emp._id}
            value={emp._id}
          >
            {emp.firstName} {emp.lastName}
          </option>
        ))
    )}
  </select>
</div>

        {/* FULL NAME */}
        <div className="input-field-group">
          <label className="field-label">Employee Full Name</label>
          <input
            value={data.fullName}
            placeholder="Full Name (Auto-filled)"
            readOnly
            className="readonly modern-input"
          />
        </div>

        {/* SAVING */}
        <div className="info success">
          <div className="info-icon-title">
            <FaMoneyCheckAlt size={18} />
            <span>Total Saving:</span>
          </div>
          <strong className="amount-highlight">{data.totalSaving || 0} ETB</strong>
        </div>

        {/* REASON */}
        <div className="input-field-group">
          <label className="field-label">Reason for Withdrawal *</label>
          <textarea
            name="reason"
            placeholder="Please specify the clear reason for leaving or withdrawal..."
            value={data.reason}
            onChange={handleChange}
            className="modern-textarea"
          />
        </div>

        {/* BUTTON */}
        <button onClick={submit} className="withdraw-btn">
          Save & Terminate Member
        </button>

      </div>

    
    </div>
  );
}