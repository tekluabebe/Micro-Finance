import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./Deposits.css";

export default function Deposits() {

  const [employees, setEmployees] = useState([]);
  const [deposits, setDeposits] = useState([]);

  const [data, setData] = useState({
    employeeId: "",
    month: "",
    year: "",
    normalSaving: "",
    voluntarySaving: "",
    sharedPurchase: "",
    registrationFee: "",
    latePenalty: "",
  });

  const [isNewEmployee, setIsNewEmployee] = useState(false);
  const [isLate, setIsLate] = useState(false);

  // ================= FETCH DATA =================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {

      const empRes = await API.get("/employees");
      const depRes = await API.get("/deposits");

      setEmployees(empRes.data || []);
      setDeposits(depRes.data || []);

    } catch (err) {
      console.error(err);
    }
  };

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {

    const { name, value } = e.target;

    // EMPLOYEE
    if (name === "employeeId") {

      const hasDeposit = deposits.some(
        (d) =>
          String(d.employeeId?._id || d.employeeId) === String(value)
      );

      setIsNewEmployee(!hasDeposit);

      setData({
        ...data,
        employeeId: value,
        registrationFee: !hasDeposit ? "500" : "",
      });

      return;
    }

    // MONTH / YEAR
    if (name === "month" || name === "year") {

      const updatedData = {
        ...data,
        [name]: value,
      };

      setData(updatedData);

      if (updatedData.month && updatedData.year) {
        checkLate(updatedData.month, updatedData.year);
      }

      return;
    }

    setData({
      ...data,
      [name]: value,
    });
  };

  // ================= CHECK LATE PAYMENT =================
  const checkLate = (month, year) => {

    const monthIndex = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ].indexOf(month);

    const dueDate = new Date(year, monthIndex, 5);

    const today = new Date();

    setIsLate(today > dueDate);
  };

  // ================= SAVE DEPOSIT =================
  const submit = async () => {

    if (!data.employeeId || !data.month || !data.year) {
      alert("Please fill required fields");
      return;
    }

    if (
      isNewEmployee &&
      (!data.registrationFee || data.registrationFee <= 0)
    ) {
      alert("Registration fee is required");
      return;
    }

    if (
      isLate &&
      (!data.latePenalty || data.latePenalty <= 0)
    ) {
      alert("Late penalty is required");
      return;
    }

    try {

      const payload = {

        employeeId: data.employeeId,
        month: data.month,
        year: data.year,

        normalSaving: parseFloat(data.normalSaving) || 0,
        voluntarySaving: parseFloat(data.voluntarySaving) || 0,
        sharedPurchase: parseFloat(data.sharedPurchase) || 0,

        registrationFee: parseFloat(data.registrationFee) || 0,
        latePenalty: parseFloat(data.latePenalty) || 0,
      };

      await API.post("/deposits", payload);

      alert("Deposit saved successfully ✅");

      // RESET FORM
      setData({
        employeeId: "",
        month: "",
        year: "",
        normalSaving: "",
        voluntarySaving: "",
        sharedPurchase: "",
        registrationFee: "",
        latePenalty: "",
      });

      setIsNewEmployee(false);
      setIsLate(false);

      fetchData();

    } catch (err) {
      console.error(err);
      alert("Error saving deposit ❌");
    }
  };

  // ================= DELETE ALL DEPOSITS =================
  const deleteAllDeposits = async () => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete ALL deposits?\n\nThis action cannot be undone."
    );

    if (!confirmDelete) return;

    try {

      await API.delete("/deposits");

      alert("All deposits deleted successfully ✅");

      // CLEAR LOCAL STATE
      setDeposits([]);

      fetchData();

    } catch (err) {
      console.error(err);
      alert("Error deleting deposits ❌");
    }
  };

  // ================= MONTHS =================
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // ================= YEARS =================
  const years = Array.from(
    { length: 26 },
    (_, i) => 2025 + i
  );

  return (
    <div className="deposit-container">

      <div className="deposit-card">

        <h2>Add Deposit</h2>

        {/* ================= SELECTS ================= */}
        <div className="grid-3">

          {/* EMPLOYEE */}
          <select
            name="employeeId"
            value={data.employeeId}
            onChange={handleChange}
          >
            <option value="">
              Select Employee
            </option>

            {employees.map((emp) => (
              <option
                key={emp._id}
                value={emp._id}
              >
                {emp.memberId} - {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>

          {/* MONTH */}
          <select
            name="month"
            value={data.month}
            onChange={handleChange}
          >
            <option value="">
              Month
            </option>

            {months.map((m) => (
              <option key={m}>
                {m}
              </option>
            ))}
          </select>

          {/* YEAR */}
          <select
            name="year"
            value={data.year}
            onChange={handleChange}
          >
            <option value="">
              Year
            </option>

            {years.map((y) => (
              <option key={y}>
                {y}
              </option>
            ))}
          </select>

        </div>

        {/* ================= REGISTRATION FEE ================= */}
        {isNewEmployee && (
          <div className="info success">

            Registration fee required for new employee

            <input
              type="number"
              name="registrationFee"
              placeholder="Registration Fee"
              value={data.registrationFee}
              onChange={handleChange}
            />

          </div>
        )}

        {/* ================= LATE PENALTY ================= */}
        {isLate && (
          <div className="info danger">

            Late payment → penalty required

            <input
              type="number"
              name="latePenalty"
              placeholder="Late Payment Penalty"
              value={data.latePenalty}
              onChange={handleChange}
            />

          </div>
        )}

        {/* ================= SAVINGS ================= */}
        <div className="grid-3">

          <input
            type="number"
            name="normalSaving"
            placeholder="Normal Saving"
            value={data.normalSaving}
            onChange={handleChange}
          />

          <input
            type="number"
            name="voluntarySaving"
            placeholder="Voluntary Saving"
            value={data.voluntarySaving}
            onChange={handleChange}
          />

          <input
            type="number"
            name="sharedPurchase"
            placeholder="Shared Purchase"
            value={data.sharedPurchase}
            onChange={handleChange}
          />

        </div>

        {/* ================= BUTTONS ================= */}
        <div className="button-group">

          <button
            onClick={submit}
            className="save-btn"
          >
            Save Deposit
          </button>

          <button
            onClick={deleteAllDeposits}
            className="delete-btn"
          >
            Delete All Deposits
          </button>

        </div>

      </div>
    </div>
  );
}