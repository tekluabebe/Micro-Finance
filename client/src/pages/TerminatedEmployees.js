import React, { useEffect, useState } from "react";
import API from "../services/api";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { FaTrashAlt, FaUserTimes, FaMoon, FaSun } from "react-icons/fa";

export default function TerminatedEmployeesDashboard() {
  const [data, setData] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // ================= SEARCH + FILTER =================
  const [search, setSearch] = useState("");
  const [filterReason, setFilterReason] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await API.get("/terminated");
      setData(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete permanently?")) return;

    try {
      await API.delete(`/terminated/${id}`);
      setData((prev) => prev.filter((x) => x._id !== id));
    } catch (err) {
      console.error(err);
    }
  };


const handleRestore = async (id) => {
  if (!window.confirm("Restore this employee?")) return;

  try {
    const response = await API.post(`/terminated/restore/${id}`, {});

    if (response.data.success) {
      // Remove from terminated list
      setData((prev) => prev.filter((x) => x._id !== id));
      
      // Show detailed success message
      alert(
        `✅ ${response.data.message}\n\n` +
        `Total Savings: ${response.data.employee.calculatedSavings.totalSaving} ETB\n` +
        `Normal Saving: ${response.data.employee.calculatedSavings.normalSaving} ETB\n` +
        `Voluntary Saving: ${response.data.employee.calculatedSavings.voluntarySaving} ETB\n` +
        `Deposit Records: ${response.data.employee.calculatedSavings.depositCount}`
      );
    }

  } catch (err) {
    console.error("Restore error:", err);
    alert(err.response?.data?.message || "❌ Failed to restore employee");
  }
};
  // ================= FILTER LOGIC =================
  const uniqueReasons = [
    "all",
    ...new Set(data.map((item) => item.reason || "Unknown")),
  ];

  const filteredData = data.filter((item) => {
    const matchSearch =
      item.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      item.memberId?.toLowerCase().includes(search.toLowerCase());

    const matchReason =
      filterReason === "all" || (item.reason || "Unknown") === filterReason;

    return matchSearch && matchReason;
  });

  // ================= KPIs =================
  const total = filteredData.length;

  const totalSaving = filteredData.reduce(
    (sum, item) => sum + (Number(item.totalSaving) || 0),
    0
  );

  const avgSaving = total ? (totalSaving / total).toFixed(0) : 0;

  // ================= CHART DATA =================
  const chartData = filteredData.map((item, i) => ({
    name: item.memberId || `M${i + 1}`,
    saving: Number(item.totalSaving) || 0,
  }));

  const reasonData = Object.values(
    filteredData.reduce((acc, item) => {
      const key = item.reason || "Unknown";
      acc[key] = acc[key] || { name: key, value: 0 };
      acc[key].value += 1;
      return acc;
    }, {})
  );

  // ================= EXPORT EXCEL =================
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Terminated");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const file = new Blob([buffer], { type: "application/octet-stream" });

    saveAs(file, "filtered_terminated_employees.xlsx");
  };

  // ================= EXPORT PDF =================
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.text("Filtered Terminated Employees Report", 14, 10);

    const tableData = filteredData.map((item) => [
      item.memberId,
      item.fullName,
      item.totalSaving,
      item.reason,
      item.terminatedAt
        ? new Date(item.terminatedAt).toLocaleDateString()
        : "N/A",
    ]);

    autoTable(doc, {
      head: [["ID", "Name", "Saving", "Reason", "Date"]],
      body: tableData,
    });

    doc.save("filtered_report.pdf");
  };

  return (
    <div className={`dashboard ${darkMode ? "dark" : ""}`}>

      {/* HEADER */}
      <div className="top-bar">
        <h2>
          <FaUserTimes /> Terminated Dashboard
        </h2>

        <button className="toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <FaSun /> : <FaMoon />}
          {darkMode ? " Light" : " Dark"}
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="filter-bar">

        <input
          type="text"
          placeholder="🔍 Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select
          value={filterReason}
          onChange={(e) => setFilterReason(e.target.value)}
          className="filter-select"
        >
          {uniqueReasons.map((r, i) => (
            <option key={i} value={r}>
              {r}
            </option>
          ))}
        </select>

      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h4>Total Employees</h4>
          <h2>{total}</h2>
        </div>

        <div className="kpi-card">
          <h4>Total Savings</h4>
          <h2>{totalSaving} ETB</h2>
        </div>

        <div className="kpi-card highlight">
          <h4>Average Saving</h4>
          <h2>{avgSaving} ETB</h2>
        </div>
      </div>

      {/* EXPORT */}
      <div className="export-buttons">
        <button onClick={exportExcel}>Export Excel</button>
        <button onClick={exportPDF}>Export PDF</button>
      </div>

      {/* CHARTS */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Saving Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="saving" stroke="#6366f1" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <Tooltip />
              <Bar dataKey="saving" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Reasons</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={reasonData} dataKey="value" nameKey="name" outerRadius={90} label>
                {reasonData.map((_, i) => (
                  <Cell key={i} fill={["#6366f1", "#ec4899", "#f59e0b", "#22c55e"][i % 4]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CARDS */}
      <div className="card-grid">
        {filteredData.map((item) => (
          <div key={item._id} className="card">

            <div className="card-header">
              <span className="badge">{item.memberId}</span>

              <button className="delete" onClick={() => handleDelete(item._id)}>
                <FaTrashAlt />
              </button>
              <button
  className="restore"
  onClick={() => handleRestore(item._id)}
  title="Restore Employee"
>
  ♻ Restore
</button>
       
            </div>

            <h3>{item.fullName}</h3>
            <p>{item.reason || "No reason"}</p>

            <div className="footer">
              <span className="saving">{item.totalSaving} ETB</span>
              <span>
                {item.terminatedAt
                  ? new Date(item.terminatedAt).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>

          </div>
        ))}
      </div>

      {/* STYLE (keep your existing CSS + add below) */}
      <style>{`
      .restore {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #10b981;
  font-size: 16px;
  transition: 0.2s;
}

.restore:hover {
  transform: scale(1.2);
  color: #059669;
}

      .dashboard {
  padding: 30px;
  max-width: 1200px;
  margin: auto;
  padding-top: 90px;
  background: linear-gradient(135deg,#fdf2f8,#eef2ff,#ecfeff);
  min-height: 100vh;
  transition: all 0.3s ease;
}

/* =========================
   DARK MODE BASE
========================= */
.dark {
  background: #0f172a;
  color: #f9fafb;
}

/* TOP BAR */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* TOGGLE BUTTON */
.toggle {
  padding: 8px 12px;
  border: none;
  border-radius: 10px;
  background: #111827;
  color: white;
  display: flex;
  gap: 8px;
  cursor: pointer;
}

/* =========================
   KPI GRID
========================= */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 15px;
  margin-top: 20px;
}

/* =========================
   💎 GLASS KPI CARDS (LIGHT)
========================= */
.kpi-card {
  position: relative;
  padding: 18px;
  border-radius: 16px;

  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);

  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);

  transition: all 0.3s ease;
  overflow: hidden;
}

/* glowing border effect */
.kpi-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 1px;
  background: linear-gradient(135deg, #a18292, #6366f1, #22c55e);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.6;
}

/* hover effect */
.kpi-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px rgba(0,0,0,0.15);
}

/* text */
.kpi-card h4 {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.kpi-card h2 {
  font-size: 26px;
  font-weight: 700;
  color: #111827;
}

/* highlight card */
.highlight {
  background: linear-gradient(135deg, rgba(236,72,153,0.9), rgba(139,92,246,0.9));
  color: white;
}

.highlight h4,
.highlight h2 {
  color: white;
}

/* =========================
   EXPORT BUTTONS
========================= */
.export-buttons {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.export-buttons button {
  padding: 10px 14px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  background: linear-gradient(135deg,#6366f1,#ec4899);
  color: white;
  font-weight: 600;
}

/* =========================
   CHARTS
========================= */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 15px;
  margin-top: 30px;
}

.chart-card {
  background: white;
  padding: 15px;
  border-radius: 14px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.06);
  transition: 0.3s ease;
}

.chart-card:hover {
  transform: translateY(-4px);
}

/* =========================
   EMPLOYEE CARDS
========================= */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 15px;
  margin-top: 30px;
}

.card {
  background: #ffffff;
  color: #111827;
  padding: 15px;
  border-radius: 14px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}

.card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
}

.badge {
  background: #6366f1;
  color: white;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.delete {
  border: none;
  background: transparent;
  color: black;
  cursor: pointer;
}

.saving {
  color: #10b981;
  font-weight: 700;
}

.footer {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

/* =========================
   🌙 DARK MODE SUPPORT
========================= */

.dark .chart-card,
.dark .card {
  background: #1f2937;
  color: #f9fafb;
}

/* KPI dark glass */
.dark .kpi-card {
  background: rgba(17, 24, 39, 0.6);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
}

.dark .kpi-card h4 {
  color: #cbd5e1;
}

.dark .kpi-card h2 {
  color: #ffffff;
}

/* highlight in dark mode */
.dark .highlight {
  background: linear-gradient(135deg,#ec4899,#8b5cf6);
}

/* =========================
   RESPONSIVE
========================= */
@media(max-width:900px){
  .kpi-grid,
  .charts-grid,
  .card-grid{
    grid-template-columns:1fr;
  }
}
/* FILTER BAR */
.filter-bar {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.search-input,
.filter-select {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #ddd;
  outline: none;
}

.dark .search-input,
.dark .filter-select {
  background: #1f2937;
  color: white;
  border: 1px solid #374151;
}

.top-bar h2 {
  color: #111827;
  font-weight: 700;
}

.dark .top-bar h2 {
  color: #ffffff;
}
`}</style>

    </div>
  );
}