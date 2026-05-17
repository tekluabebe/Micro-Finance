import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./withdrawals.css";
import { useNavigate } from "react-router-dom"; // ይህንን ጨምር

export default function Withdrawals() {
  const [employees, setEmployees] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loans, setLoans] = useState([]); // ✅ ADDED
  const navigate = useNavigate();

  const [data, setData] = useState({
    employeeId: "",
    fullName: "",
    totalSaving: "",
    reason: "",
  });

  // =======================
  // LOAD DATA
  // =======================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await API.get("/employees");
        const depRes = await API.get("/deposits");
        const loanRes = await API.get("/loans"); // ✅ ADDED

        setEmployees(empRes.data || []);
        setDeposits(depRes.data || []);
        setLoans(loanRes.data || []);
      } catch (err) {
        console.error("Load error:", err);
      }
    };

    fetchData();
  }, []);

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

    // ❌ BLOCK IF ACTIVE LOAN EXISTS
    if (hasActiveLoan(data.employeeId)) {
      alert("Please finish your loan before proceeding withdrawals ❌");
      return;
    }

    try {
      const emp = employees.find((e) => e._id === data.employeeId);

      // ✅ SAVE TO TERMINATED
      await API.post("/terminated", {
        employeeData: emp,
        totalSaving: data.totalSaving,
        reason: data.reason,
      });

      // ✅ SAVE TO WITHDRAWALS
      await API.post("/withdrawals", {
        employeeId: data.employeeId,
        fullName: data.fullName,
        totalSaving: data.totalSaving,
        reason: data.reason,
        isRead: false,
      });

      // ✅ DELETE EMPLOYEE
      await API.delete(`/employees/${data.employeeId}`);

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

  // =======================
  // UI
  // =======================
  return (
    <div className="withdraw-container">
      <div className="withdraw-card">

        <div className="top-bar">
          <button
  onClick={() => (window.location.href = "/Micro-Finance/#/terminated")}
  className="view-btn"
>
  View Terminated
</button>
        </div>

        <h2>Member Withdrawal</h2>

        {/* EMPLOYEE */}
        <select
          name="employeeId"
          value={data.employeeId}
          onChange={handleChange}
        >
          <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option
              key={emp._id}
              value={emp._id}
            >
              {emp.memberId} - {emp.firstName} {emp.lastName}
              {hasActiveLoan(emp._id) ? " (Active Loan ❌)" : ""}
            </option>
          ))}
        </select>

        {/* FULL NAME */}
        <input
          value={data.fullName}
          placeholder="Full Name"
          readOnly
          className="readonly"
        />

        {/* SAVING */}
        <div className="info success">
          Total Saving: <strong>{data.totalSaving} birr</strong>
        </div>

        {/* REASON */}
        <textarea
          name="reason"
          placeholder="Reason for withdrawal..."
          value={data.reason}
          onChange={handleChange}
        />

        {/* BUTTON */}
        <button onClick={submit} className="withdraw-btn">
          Save Withdrawal
        </button>

      </div>
    </div>
  );
}