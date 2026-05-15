import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  FaSearch,
  FaFilePdf,
  FaFileExcel,
  FaChartLine,
  FaMoneyBillWave,
  FaUsers
} from "react-icons/fa";
import "./Reports.css"; // ከታች ያለውን CSS በዚህ ስም ሴቭ አድርገው

const Reports = () => {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState("01");
  const [year, setYear] = useState("2026");
  const [reportType, setReportType] = useState("individual-monthly");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchEmployee, setSearchEmployee] =
  useState("");
const [showMembers, setShowMembers] =
  useState(false);
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/employees");
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const generateReport = async () => {
    if ((reportType.includes("individual")) && !employeeId) {
      alert("Please select an employee first");
      return;
    }

    try {
      setLoading(true);
      let url = "";

      // Endpoint Logic
      switch (reportType) {
        case "individual-monthly":
          url = `http://localhost:5000/api/reports/individual-monthly?employeeId=${employeeId}&month=${month}&year=${year}`;
          break;
        case "individual-annual":
          url = `http://localhost:5000/api/reports/individual-annual?employeeId=${employeeId}&year=${year}`;
          break;
        case "total-monthly":
          url = `http://localhost:5000/api/reports/total-members?month=${month}&year=${year}&type=monthly`;
          break;
        case "total-annual":
          url = `http://localhost:5000/api/reports/total-members?year=${year}&type=annual`;
          break;
        default:
          break;
      }

      const res = await axios.get(url);
      setReport(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Failed to generate report. Please check your backend connection.");
    }
  };

  const downloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text(`${reportType.replace("-", " ").toUpperCase()} REPORT`, 14, 20);
    
    const rows = Object.entries(report).map(([key, value]) => [
      key.replace(/([A-Z])/g, " $1").toUpperCase(),
      typeof value === "object" ? JSON.stringify(value) : `${value} ETB`
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Description", "Details"]],
      body: rows,
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59] }
    });
    doc.save(`Report_${reportType}_${Date.now()}.pdf`);
  };

  const downloadExcel = () => {
    if (!report) return;
    const worksheet = XLSX.utils.json_to_sheet([report]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(data, `Report_${Date.now()}.xlsx`);
  };

  const filteredEmployees =
  employees.filter((emp) => {

    const fullName =
      `${emp.firstName} ${emp.lastName}`
        .toLowerCase();

    return (
      fullName.includes(
        searchEmployee.toLowerCase()
      ) ||

      emp.memberId
        ?.toLowerCase()
        .includes(
          searchEmployee.toLowerCase()
        )
    );
  });
  return (
    <div className="reports-container">
      {/* FILTER CARD */}
      <div className="filter-card">
        <div className="header-section">
          <div className="icon-box">
            <FaChartLine />
          </div>
          <div>
            <h1>Financial Reports Dashboard</h1>
            <p>Generate precise financial statements for members and total assets</p>
          </div>
        </div>

        <div className="filter-grid">
          {/* Row 1 */}
  <div className="report-type-section">

  <label className="section-title">
    Choose Report Type
  </label>

  <div className="report-cards">

    {/* INDIVIDUAL MONTHLY */}
    <div
      className={`report-card blue ${
        reportType === "individual-monthly"
          ? "active"
          : ""
      }`}
      onClick={() =>
        setReportType(
          "individual-monthly"
        )
      }
    >
      <div className="diamond"></div>

      <div className="report-content">
        <h3>Individual Monthly</h3>

        <p>
          Monthly employee savings,
          loans & deposits
        </p>
      </div>
    </div>

    {/* INDIVIDUAL ANNUAL */}
    <div
      className={`report-card purple ${
        reportType === "individual-annual"
          ? "active"
          : ""
      }`}
      onClick={() =>
        setReportType(
          "individual-annual"
        )
      }
    >
      <div className="diamond"></div>

      <div className="report-content">
        <h3>Individual Annual</h3>

        <p>
          Annual employee financial
          summary
        </p>
      </div>
    </div>

    {/* TOTAL MONTHLY */}
    <div
      className={`report-card green ${
        reportType === "total-monthly"
          ? "active"
          : ""
      }`}
      onClick={() =>
        setReportType(
          "total-monthly"
        )
      }
    >
      <div className="diamond"></div>

      <div className="report-content">
        <h3>Total Monthly</h3>

        <p>
          Overall monthly cooperative
          transactions
        </p>
      </div>
    </div>

    {/* TOTAL ANNUAL */}
    <div
      className={`report-card orange ${
        reportType === "total-annual"
          ? "active"
          : ""
      }`}
      onClick={() =>
        setReportType(
          "total-annual"
        )
      }
    >
      <div className="diamond"></div>

      <div className="report-content">
        <h3>Total Annual</h3>

        <p>
          Annual cooperative financial
          performance
        </p>
      </div>
    </div>

  </div>
</div>
         {/* =========================
   SELECT MEMBER SECTION
========================= */}

{/* =========================
   SELECT MEMBER SECTION
========================= */}

<div className="member-select-section">

  {/* SELECTED EMPLOYEE */}
  {employeeId ? (

    <div
      className={`member-trigger-card active-trigger`}
      onClick={() =>
        setShowMembers(!showMembers)
      }
    >

      {employees
        .filter(
          (emp) =>
            emp._id === employeeId
        )
        .map((emp) => (

          <React.Fragment key={emp._id}>

            <div className="selected-member-image-wrapper">

              {emp.photo ? (

                <img
                  src={emp.photo}
                  alt="member"
                  className="selected-member-image"
                />

              ) : (

                <div className="selected-member-placeholder">
                  {emp.firstName?.charAt(0)}
                </div>

              )}

            </div>

            <h2>
              {emp.firstName}
              {" "}
              {emp.lastName}
            </h2>

            <p className="selected-member-id">
              ID:
              {" "}
              {emp.memberId}
            </p>

            <span className="change-member-text">
              Click to change member
            </span>

          </React.Fragment>

        ))}

    </div>

  ) : (

    /* EMPTY CARD */
    <div
      className={`member-trigger-card`}
      onClick={() =>
        setShowMembers(!showMembers)
      }
    >

      <div className="trigger-icon">
        <FaUsers />
      </div>

      <h2>Select Member</h2>

      <p>
        Click here to choose employee
        for financial reports
      </p>

    </div>

  )}

  {/* DROPDOWN */}
  {showMembers && (

    <div className="member-dropdown">

      {/* SEARCH */}
      <div className="employee-search-box">

        <input
          type="text"
          placeholder="Search employee by name or ID..."
          value={searchEmployee}
          onChange={(e) =>
            setSearchEmployee(
              e.target.value
            )
          }
          className="employee-search-input"
        />

      </div>

      {/* EMPLOYEES */}
      <div className="employee-list-wrapper">

        {filteredEmployees.map((emp) => (

          <div
            key={emp._id}
            className={`member-row-card ${
              employeeId === emp._id
                ? "active-member"
                : ""
            }`}
            onClick={() => {
              setEmployeeId(emp._id);
              setShowMembers(false);
            }}
          >

            {/* IMAGE */}
            <div className="member-image-box">

              {emp.photo ? (

                <img
                  src={emp.photo}
                  alt="member"
                  className="member-image"
                />

              ) : (

                <div className="member-placeholder">
                  {emp.firstName?.charAt(0)}
                </div>

              )}

            </div>

            {/* DETAILS */}
            <div className="member-details">

              <h3>
                {emp.firstName}
                {" "}
                {emp.lastName}
              </h3>

              <p>
                Member ID:
                {" "}
                {emp.memberId}
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>

  )}

</div>

          {/* Row 2 */}
       {/* =========================
   DATE & ACTION SECTION
========================= */}

<div className="report-controls-wrapper">

  {/* MONTH CIRCLE */}
  <div
    className={`date-circle-card ${
      reportType.endsWith("annual")
        ? "disabled-circle"
        : ""
    }`}
  >

    <div className="circle-glow"></div>

    <div className="circle-content">

      <span className="circle-label">
        Reporting Month
      </span>

      <select
        value={month}
        onChange={(e) =>
          setMonth(e.target.value)
        }
        disabled={reportType.endsWith("annual")}
        className="circle-select"
      >

        <option value="01">
          January
        </option>

        <option value="02">
          February
        </option>

        <option value="03">
          March
        </option>

        <option value="04">
          April
        </option>

        <option value="05">
          May
        </option>

        <option value="06">
          June
        </option>

        <option value="07">
          July
        </option>

        <option value="08">
          August
        </option>

        <option value="09">
          September
        </option>

        <option value="10">
          October
        </option>

        <option value="11">
          November
        </option>

        <option value="12">
          December
        </option>

      </select>

    </div>

  </div>

    <div className="date-circle-card year-card">

    <div className="circle-glow purple"></div>

    <div className="circle-content">

      <span className="circle-label">
        Reporting Year
      </span>

      <input
        type="number"
        value={year}
        onChange={(e) =>
          setYear(e.target.value)
        }
        className="circle-input"
      />

    </div>

  </div>

  {/* GENERATE BUTTON */}
  <button
    className="generate-report-premium-btn"
    onClick={generateReport}
    disabled={loading}
  >

    <div className="generate-inner">

      <FaSearch className="generate-icon" />

      <span>
        {loading
          ? "Processing..."
          : "Generate Report"}
      </span>

    </div>

  </button>

  {/* YEAR CIRCLE */}


</div>
        </div>

       
      </div>

      {/* RESULTS SECTION */}
      {report && (
        <div className="results-card animate-fade-in">
          <div className="results-header">
            <div className="title-group">
              <FaMoneyBillWave className="result-icon" />
              <h2 className="report-main-title">

  {reportType === "individual-monthly" &&
    "Individual Monthly Report Summary"}

  {reportType === "individual-annual" &&
    "Individual Annual Report Summary"}

  {reportType === "total-monthly" &&
    "Total Members Monthly Report Summary"}

  {reportType === "total-annual" &&
    "Total Members Annual Report Summary"}

</h2>
            </div>
            <div className="export-actions">
              <button className="export-btn pdf" onClick={downloadPDF}><FaFilePdf /> PDF</button>
              <button className="export-btn excel" onClick={downloadExcel}><FaFileExcel /> Excel</button>
            </div>
          </div>

          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Value (ETB)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(report).map(([key, value], index) => (
                  <tr key={key}>
                    <td className="field-label">{key.replace(/([A-Z])/g, " $1").toUpperCase()}</td>
                    <td className="field-value">
                      {typeof value === "number" ? (
                        <span className="amount">{value.toLocaleString()} </span>
                      ) : (
                        String(value)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;