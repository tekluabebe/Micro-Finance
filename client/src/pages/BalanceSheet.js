import React, { useState, useMemo } from "react";
import "./Balancesheet.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useAppContext } from "./context";
import { translate } from "../utils/translations";

const years = [];

for (let i = 2023; i <= 2035; i++) {
  years.push(i);
}

const BalanceSheet = () => {
  const { language } = useAppContext();
  const t = (text) => translate(language, text);
   const isMember =
    localStorage.getItem("userRole")?.toLowerCase() === "member";

  const [year, setYear] = useState(2026);
  const [previousYear, setPreviousYear] = useState(2025);

  const [formData, setFormData] = useState({

    // Current Assets
    cashOnHand: "",
    cashAtBank: "",
    accountsReceivable: "",
    otherReceivable: "",

    // Fixed Assets
    officeEquipment: "",
    furniture: "",
    vehicle: "",
    building: "",

    // Liabilities
    accountsPayable: "",
    taxPayable: "",
    otherLiability: "",

    // Equity
    capital: "",
    reserve: "",
    retainedEarnings: ""
  });

  const numberValue = (value) => Number(value || 0);

  const totals = useMemo(() => {

    const currentAssets =
      numberValue(formData.cashOnHand) +
      numberValue(formData.cashAtBank) +
      numberValue(formData.accountsReceivable) +
      numberValue(formData.otherReceivable);

    const fixedAssets =
      numberValue(formData.officeEquipment) +
      numberValue(formData.furniture) +
      numberValue(formData.vehicle) +
      numberValue(formData.building);

    const totalAssets =
      currentAssets +
      fixedAssets;

    const liabilities =
      numberValue(formData.accountsPayable) +
      numberValue(formData.taxPayable) +
      numberValue(formData.otherLiability);

    const equity =
      numberValue(formData.capital) +
      numberValue(formData.reserve) +
      numberValue(formData.retainedEarnings);

    const totalLiabilitiesEquity =
      liabilities +
      equity;

    return {

      currentAssets,
      fixedAssets,
      totalAssets,

      liabilities,
      equity,
      totalLiabilitiesEquity

    };

  }, [formData]);

  const difference =
  totals.totalAssets - totals.totalLiabilitiesEquity;

const isBalanced = Math.abs(difference) < 0.01;

  const handleChange = (e) => {
    if (isMember) return;

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

  };

const saveData = () => {
     if (isMember) {
      alert("Members cannot save balance sheet data.");
      return;
    }
  if (!isBalanced) {
    alert(
      `Balance sheet is not balanced.\nDifference: ${difference.toLocaleString()} ETB`
    );
    return;
  }

  const savedData = {
    year: Number(year),
    previousYear: Number(previousYear),
    formData,
    totals,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(
    `balanceSheet-${year}`,
    JSON.stringify(savedData)
  );

  alert(`Balance sheet for ${year} saved successfully.`);
};

  const downloadExcel = () => {

    const data = [

      ["BALANCE SHEET"],

      [],

      ["Year", year],
      ["Previous Year", previousYear],

      [],

      ["CURRENT ASSETS"],

      ["Cash On Hand", formData.cashOnHand],
      ["Cash At Bank", formData.cashAtBank],
      ["Accounts Receivable", formData.accountsReceivable],
      ["Other Receivable", formData.otherReceivable],
      ["Total Current Assets", totals.currentAssets],

      [],

      ["FIXED ASSETS"],

      ["Office Equipment", formData.officeEquipment],
      ["Furniture", formData.furniture],
      ["Vehicle", formData.vehicle],
      ["Building", formData.building],
      ["Total Fixed Assets", totals.fixedAssets],

      [],

      ["TOTAL ASSETS", totals.totalAssets],

      [],

      ["LIABILITIES"],

      ["Accounts Payable", formData.accountsPayable],
      ["Tax Payable", formData.taxPayable],
      ["Other Liability", formData.otherLiability],
      ["Total Liabilities", totals.liabilities],

      [],

      ["EQUITY"],

      ["Capital", formData.capital],
      ["Reserve", formData.reserve],
      ["Retained Earnings", formData.retainedEarnings],
      ["Total Equity", totals.equity],

      [],

      ["TOTAL LIABILITIES & EQUITY", totals.totalLiabilitiesEquity]

    ];

    const worksheet =
      XLSX.utils.aoa_to_sheet(data);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Balance Sheet"
    );

    const excelBuffer =
      XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array"
      });

    const blob =
      new Blob(
        [excelBuffer],
        {
          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
      );

    saveAs(blob, "BalanceSheet.xlsx");

  };

  const downloadPDF = () => {

    const doc = new jsPDF();

    doc.setFontSize(16);

    doc.text("BALANCE SHEET", 70, 15);

    autoTable(doc, {

      startY: 25,

      head: [["Description", "Amount"]],

      body: [

        ["Cash On Hand", formData.cashOnHand],
        ["Cash At Bank", formData.cashAtBank],
        ["Accounts Receivable", formData.accountsReceivable],
        ["Other Receivable", formData.otherReceivable],
        ["Total Current Assets", totals.currentAssets],

        ["Office Equipment", formData.officeEquipment],
        ["Furniture", formData.furniture],
        ["Vehicle", formData.vehicle],
        ["Building", formData.building],
        ["Total Fixed Assets", totals.fixedAssets],

        ["TOTAL ASSETS", totals.totalAssets],

        ["Accounts Payable", formData.accountsPayable],
        ["Tax Payable", formData.taxPayable],
        ["Other Liability", formData.otherLiability],
        ["Total Liabilities", totals.liabilities],

        ["Capital", formData.capital],
        ["Reserve", formData.reserve],
        ["Retained Earnings", formData.retainedEarnings],
        ["Total Equity", totals.equity],

        [
          "TOTAL LIABILITIES & EQUITY",
          totals.totalLiabilitiesEquity
        ]

      ]

    });

    doc.save("BalanceSheet.pdf");

  };

  return (

    <div className="balance-sheet-container">

      <h1>{t("Balance Sheet")}</h1>

      <div className="top-bar">

        <div>

          <label>{t("Year")}</label>

          <select style={{ color: '#141414' }}
          disabled={isMember}
            value={year}
           onChange={(e) => setYear(Number(e.target.value))}
          >

            {years.map((y) => (

              <option key={y} value={y}>

                {y}

              </option>

            ))}

          </select>

        </div>

        <div>

          <label>{t("Previous Year")}</label>

          <select style={{ color: '#080808' }}
          disabled={isMember}
            value={previousYear}
          onChange={(e) => setPreviousYear(Number(e.target.value))} 
          >

            {years.map((y) => (

              <option key={y} value={y}>

                {y}

              </option>

            ))}

          </select>

        </div>

      </div>

      <div className="section">

        <h2>{t("Current Assets")}</h2>

        <div className="grid">

          <label>{t("Cash On Hand")}</label>
          <input 
            name="cashOnHand"
            type="number"
            value={formData.cashOnHand}
            onChange={handleChange}
            disabled={isMember}
          />

          <label>{t("Cash At Bank")}</label>
          <input
            name="cashAtBank"
            type="number"
            value={formData.cashAtBank}
            onChange={handleChange}
          />

          <label>{t("Accounts Receivable")}</label>
          <input
            name="accountsReceivable"
            type="number"
            value={formData.accountsReceivable}
            onChange={handleChange}
          />

          <label>{t("Other Receivable")}</label>
          <input
            name="otherReceivable"
            type="number"
            value={formData.otherReceivable}
            onChange={handleChange}
          />

        </div>

        <h3 style={{ color: 'rgb(8, 151, 240)' }}>
          {t("Total Current Assets")} :
          {totals.currentAssets.toLocaleString()}
        </h3>

      </div>

      <div className="section">

        <h2>{t("Fixed Assets")}</h2>

        <div className="grid">

          <label>{t("Office Equipment")}</label>
          <input
            name="officeEquipment"
            type="number"
            value={formData.officeEquipment}
            onChange={handleChange}
          />

          <label>{t("Furniture")}</label>
          <input
            name="furniture"
            type="number"
            value={formData.furniture}
            onChange={handleChange}
          />

          <label>{t("Vehicle")}</label>
          <input
            name="vehicle"
            type="number"
            value={formData.vehicle}
            onChange={handleChange}
          />

          <label>{t("Building")}</label>
          <input
            name="building"
            type="number"
            value={formData.building}
            onChange={handleChange}
          />

        </div>

        <h3 style={{ color: 'rgb(8, 151, 240)' }}>
          {t("Total Fixed Assets")} :
          {totals.fixedAssets.toLocaleString()}
        </h3>

      </div>

      <div className="section">

        <h2>{t("Liabilities")}</h2>

        <div className="grid">

          <label>{t("Accounts Payable")}</label>
          <input
            name="accountsPayable"
            type="number"
            value={formData.accountsPayable}
            onChange={handleChange}
          />

          <label>{t("Tax Payable")}</label>
          <input
            name="taxPayable"
            type="number"
            value={formData.taxPayable}
            onChange={handleChange}
          />

          <label>{t("Other Liability")}</label>
          <input
            name="otherLiability"
            type="number"
            value={formData.otherLiability}
            onChange={handleChange}
          />

        </div>

        <h3 style={{ color: 'rgb(8, 151, 240)' }}>
          {t("Total Liabilities")} :
          {totals.liabilities.toLocaleString()}
        </h3>

      </div>

      <div className="section">

        <h2>{t("Equity")}</h2>

        <div className="grid">

          <label>{t("Capital")}</label>
          <input
            name="capital"
            type="number"
            value={formData.capital}
            onChange={handleChange}
          />

          <label>{t("Reserve")}</label>
          <input
            name="reserve"
            type="number"
            value={formData.reserve}
            onChange={handleChange}
          />

          <label>{t("Retained Earnings")}</label>
          <input
            name="retainedEarnings"
            type="number"
            value={formData.retainedEarnings}
            onChange={handleChange}
          />

        </div>

        <h3 style={{ color: 'rgb(8, 151, 240)' }}>
          {t("Total Equity")} :
          {totals.equity.toLocaleString()}
        </h3>

      </div>

      <div className="grand-total">

        <h2 style={{ color: 'rgb(8, 151, 240)' }}>
          {t("Total Assets")} :
          {totals.totalAssets.toLocaleString()}
        </h2>

        <h2 style={{ color: 'rgb(8, 151, 240)' }}>
          {t("Total Liabilities & Equity")} :
          {totals.totalLiabilitiesEquity.toLocaleString()}
        </h2>

      </div>
<div className={`balance-status ${isBalanced ? "balanced" : "unbalanced"}`}>
  <strong>
    {isBalanced ? `✓ ${t("Balance Sheet Balanced")}` : `⚠ ${t("Balance Sheet Not Balanced")}`}
  </strong>

  {!isBalanced && (
    <span>
      {t("Difference:")} {difference.toLocaleString()} ETB
    </span>
  )}
</div>
      <div className="buttons">

     

        <button onClick={downloadExcel}>
          Download Excel
        </button>

        <button onClick={downloadPDF}>
          Download PDF
        </button>

      </div>
      <div lassName="buttons">
  {!isMember && (
    <button onClick={saveData}>
      Save
    </button>
  )}

  
</div>

    </div>

  );

};

export default BalanceSheet;