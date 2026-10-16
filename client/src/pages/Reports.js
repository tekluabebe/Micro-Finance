import React, { useEffect, useState } from "react";
// axiosን በ API ሰርቪስህ ቀይረነዋል
import API from "../services/api"; 
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
import "./Reports.css";
import axios from "axios";
import { useAppContext } from "./context";
import { translate } from "../utils/translations";

// ከ API ሰርቪሱ ፋንታ በቀጥታ እዚህ ጋር መግለጽ


const Reports = () => {
  const { language } = useAppContext();
  const t = (text) => translate(language, text);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState("01");
  const [year, setYear] = useState("2026");
  const [reportType, setReportType] = useState("individual-monthly");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchEmployee, setSearchEmployee] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const userRole =
  localStorage.getItem("userRole")?.toLowerCase() || "";
  const isMonthlyReport = reportType.endsWith("monthly");
  const isAnnualReport = reportType.endsWith("annual");
  const isTotalReport =
  reportType === "total-monthly" ||
  reportType === "total-annual";

const isMember = userRole === "member";

const loggedMemberId =
  localStorage.getItem("memberId") || "";

useEffect(() => {
  fetchEmployees();
}, []);

useEffect(() => {
  if (isMember && employees.length > 0) {
    const member = employees.find(
      (emp) => emp.memberId === loggedMemberId
    );

    if (member) {
      setEmployeeId(member._id);
    }
  }
}, [employees, isMember, loggedMemberId]);

  const fetchEmployees = async () => {
    try {
      // አድራሻው አሁን ከ API ሰርቪስህ base URL ይነሳል
      const res = await API.get("/employees");
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const generateReport = async () => {
    if (
  isMember &&
  ![
    "individual-monthly",
    "individual-annual",
  ].includes(reportType)
) {
  alert(
    "You are not authorized to view this report."
  );
  return;
}
    if (reportType.includes("individual") && !employeeId) {
      alert("Please select an employee first");
      return;
    }

    try {
      setLoading(true);
      let url = "";

      // Endpoint Logic - localhost ተወግዶ በንጹህ path ተተክቷል
      switch (reportType) {
        case "individual-monthly":
          url = `/reports/individual-monthly?employeeId=${employeeId}&month=${month}&year=${year}`;
          break;
        case "individual-annual":
          url = `/reports/individual-annual?employeeId=${employeeId}&year=${year}`;
          break;
        case "total-monthly":
          url = `/reports/total-members?month=${month}&year=${year}&type=monthly`;
          break;
        case "total-annual":
          url = `/reports/total-members?year=${year}&type=annual`;
          break;
        default:
          break;
      }

      const res = await API.get(url);
      setReport(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Failed to generate report. Please check your internet connection.");
    }
  };

  const downloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text(
  `${reportType.replace("-", " ").toUpperCase()} REPORT`,
  14,
  20
);

doc.setFontSize(11);

doc.text(
  isMonthlyReport
    ? `Period: ${monthNames[month]} ${year}`
    : `Year: ${year}`,
  14,
  28
);
    
    const rows = Object.entries(report).map(([key, value]) => [
      key.replace(/([A-Z])/g, " $1").toUpperCase(),
      typeof value === "object" ? JSON.stringify(value) : `${value} ETB`
    ]);

    autoTable(doc, {
      startY: 36,
      head: [["Description", "Details"]],
      body: rows,
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59] }
    });
    doc.save(`Report_${reportType}_${Date.now()}.pdf`);
  };

  const downloadExcel = () => {
    if (!report) return;
    const worksheet = XLSX.utils.json_to_sheet([
  {
    ReportType: reportType,
    Period: isMonthlyReport
      ? `${monthNames[month]} ${year}`
      : year,
    ...report,
  },
]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(data, `Report_${Date.now()}.xlsx`);
  };

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    return (
      fullName.includes(searchEmployee.toLowerCase()) ||
      emp.memberId?.toLowerCase().includes(searchEmployee.toLowerCase())
    );
  });

  const monthNames = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};
const reportTypeTitle = {
  "individual-monthly": t("Individual Monthly"),
  "individual-annual": t("Individual Annual"),
  "total-monthly": t("Total Monthly"),
  "total-annual": t("Total Annual"),
}[reportType];

  return (
    <div className="reports-container">
      <div className="filter-card">
        <div className="header-section">
          <div className="icon-box">
            <FaChartLine />
          </div>
          <div>
            <div className="reports-hero">
  <div className="hero-content">
    <h1>
      {t("Financial Intelligence Dashboard")}
    </h1>

    <p>
      {t("Advanced reporting, analytics and cooperative financial insights.")}
    </p>
  </div>

  <div className="hero-stats">
    <div className="hero-stat">
      <span>{t("Reports")}</span>
      <strong>{t("4 Types")}</strong>
    </div>

    <div className="hero-stat">
      <span>{t("Data Source")}</span>
      <strong>Mongo DB</strong>
    </div>
  </div>
</div>
          </div>
        </div>

        <div className="filter-grid">
          <div className="report-type-section">
            <label className="section-title">{t("Choose Report Type")}</label>
            <div className="report-cards">
              
<div
  className={`report-card blue ${
    reportType === "individual-monthly"
      ? "active"
      : ""
  }`}
  onClick={() =>
    setReportType("individual-monthly")
  }
>
  <div className="diamond"></div>
  <div className="report-content">
    <h3>{t("Individual Monthly (የግለሰብ ወርሃዊ ሪፖርት ዝርዝር)")}</h3>
    <p>
      {t("Monthly employee savings, loans & deposits")}
    </p>
  </div>
</div>

<div
  className={`report-card purple ${
    reportType === "individual-annual"
      ? "active"
      : ""
  }`}
  onClick={() =>
    setReportType("individual-annual")
  }
>
  
  <div className="diamond"></div>
  <div className="report-content">
    <h3>{t("Individual Annual (የግለሰቡ አመታዊ ረፖርት ዝርዝር)")}</h3>
    <p>
      {t("Annual employee financial summary")}
    </p>
  </div>
</div>

{/* ADMIN ONLY */}
{!isMember && (
  <>
    <div
      className={`report-card green ${
        reportType === "total-monthly"
          ? "active"
          : ""
      }`}
      onClick={() =>
        setReportType("total-monthly")
      }
    >
      <div className="diamond"></div>
      <div className="report-content">
        <h3>{t("Total Monthly(የማህበሩ አባል ወርሃዊ ረፖርት)")}</h3>
        <p>
          {t("Overall monthly cooperative transactions")}
        </p>
      </div>
    </div>

    <div
      className={`report-card orange ${
        reportType === "total-annual"
          ? "active"
          : ""
      }`}
      onClick={() =>
        setReportType("total-annual")
      }
    >
      <div className="diamond"></div>
      <div className="report-content">
        <h3>{t("Total Annual (የማህበሩ አባል አመታዊ ረፖርት)")}</h3>
        <p>
          {t("Annual cooperative financial performance")}
        </p>
      </div>
    </div>
  </>
)}
            </div>
          </div>

         {!isMember && (
  <div
  className={`member-select-section ${
    isTotalReport ? "disabled-member-section" : ""
  }`}
>

    {employeeId ? (
      <div
        className="member-trigger-card active-trigger"
       onClick={() => {
  if (!isTotalReport) {
    setShowMembers(!showMembers);
  }
}}
      >
        {employees
          .filter(
            (emp) =>
              emp._id === employeeId
          )
          .map((emp) => (
            <React.Fragment
              key={emp._id}
            >
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
                {emp.firstName}{" "}
                {emp.lastName}
              </h2>

              <p className="selected-member-id">
                {t("ID:")} {emp.memberId}
              </p>

              <span className="change-member-text">
                {t("Click to change member")}
              </span>
            </React.Fragment>
          ))}
      </div>
    ) : (
      <div
        className="member-trigger-card"
      onClick={() => {
  if (!isTotalReport) {
    setShowMembers(!showMembers);
  }
}}
      >
        <div className="member-selector-card">

  <FaUsers className="member-icon" />

  <h3>{t("Select Member")}</h3>

  <p>
    {t("Search and choose employee for individual reports")}
  </p>

</div>
      </div>
    )}

    {showMembers && !isTotalReport && (
      <div className="member-dropdown">
        <div className="report-search-box">

  <FaSearch />

<input
  placeholder={t("Search member...")}
  value={searchEmployee}
  onChange={(e) =>
    setSearchEmployee(e.target.value)
  }
  disabled={isTotalReport}
/>

</div>

        <div className="employee-list-wrapper">
          {filteredEmployees.map(
            (emp) => (
              <div
                key={emp._id}
                className={`member-row-card ${
                  employeeId === emp._id
                    ? "active-member"
                    : ""
                }`}
              onClick={() => {
  if (isTotalReport) return;

  setEmployeeId(emp._id);
  setShowMembers(false);
}}
              >
                <div className="member-image-box">
                  {emp.photo ? (
                    <img
                      src={emp.photo}
                      alt="member"
                      className="member-image"
                    />
                  ) : (
                    <div className="member-placeholder">
                      {emp.firstName?.charAt(
                        0
                      )}
                    </div>
                  )}
                </div>

                <div className="member-details">
                  <h3>
                    {emp.firstName}{" "}
                    {emp.lastName}
                  </h3>

                  <p>
                    {t("Member ID")}:{" "}
                    {emp.memberId}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    )}

  </div>
)}

          <div className="report-controls-wrapper">
<div
  className={`date-circle-card ${
    isAnnualReport ? "disabled-circle" : ""
  }`}
>
  <div className="circle-glow"></div>

  <div className="circle-content">
    <span className="circle-label">{t("Month")} /</span>

    <select
      value={month}
      onChange={(e) => setMonth(e.target.value)}
      disabled={isAnnualReport}
      className="circle-select"
    >
      <option value="01">{t("January")}</option>
      <option value="02">{t("February")}</option>
      <option value="03">{t("March")}</option>
      <option value="04">{t("April")}</option>
      <option value="05">{t("May")}</option>
      <option value="06">{t("June")}</option>
      <option value="07">{t("July")}</option>
      <option value="08">{t("August")}</option>
      <option value="09">{t("September")}</option>
      <option value="10">{t("October")}</option>
      <option value="11">{t("November")}</option>
      <option value="12">{t("December")}</option>
    </select>
  </div>
</div>

            <div className="date-circle-card year-card">
              <div className="circle-glow purple"></div>
            <div
  className={`date-circle-card year-card ${
    isMonthlyReport ? "disabled-circle" : ""
  }`}
>
  <div className="circle-glow purple"></div>

  <div className="circle-content">
    <span className="circle-label">{t("Year")} /</span>

    <input
      type="number"
      value={year}
      onChange={(e) => setYear(e.target.value)}
      disabled={isMonthlyReport}
      className="circle-input"
      min="2020"
      max="2100"
    />
  </div>
</div>
            </div>

            <button
  className="generate-report-btn"
  onClick={generateReport}
>

  <FaChartLine />

  <span>
    {t("Generate Financial Report")}
  </span>

</button>
          </div>
        </div>
      </div>

      {report && (
      <div className="results-card animate-fade-in">
    <div className="results-header">

        <div className="title-group">
            <FaMoneyBillWave className="result-icon" />

            <div>
                <h2 className="report-main-title">
                    {reportTypeTitle}
                </h2>

                <p className="report-period">
                    {isMonthlyReport
                        ? `${t(monthNames[month])} ${year}`
                        : `${t("Year")} ${year}`}
                </p>
            </div>
        </div>

        <div className="export-actions">
            <button
                className="export-btn pdf"
                onClick={downloadPDF}
            >
                <FaFilePdf />
                PDF
            </button>

            <button
                className="export-btn excel"
                onClick={downloadExcel}
            >
                <FaFileExcel />
                Excel
            </button>
        </div>

    </div>

    <div className="table-container">

        <table className="modern-table">

            <thead>
                <tr>
                    <th>{t("Description")}</th>
                    <th>{t("Amount")}</th>
                </tr>
            </thead>

            <tbody>

                {Object.entries(report).map(([key, value]) => (

                    <tr key={key}>

                        <td className="description-column">

                            <div className="description-cell">

                               

                                <span>
                                    {key
                                        .replace(/([A-Z])/g, " $1")
                                        .toUpperCase()}
                                </span>

                            </div>

                        </td>

                        

<td className="field-value">
  <span className="value-text">
    {typeof value === "object" && value !== null ? (
  <>
    <div>{t("Member ID")} : {value.memberId}</div>
    <div>{t("Full Name")} : {value.fullName}</div>
  </>
) : (
  String(value)
)}
  </span>
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