import React, {
  useState,
  useEffect,
  useMemo
} from "react";

import "./CheckBalance.css";

import API from "../services/api";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useAppContext } from "./context";
import { translate } from "../utils/translations";

import {
  FaSearch,
  FaPrint,
  FaFilePdf,
  FaFileExcel,
  FaSyncAlt
} from "react-icons/fa";

/*=====================================================
    MONTHS
=====================================================*/

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
  "December"
];

/*=====================================================
    YEARS
=====================================================*/

const years = [];

for (let y = 2023; y <= 2035; y++) {
  years.push(y);
}

/*=====================================================
    COMPONENT
=====================================================*/

export default function CheckBalance() {
  const { language } = useAppContext();
  const t = (text) => translate(language, text);

  const [loading, setLoading] = useState(false);

  const [records, setRecords] = useState([]);

  const [month, setMonth] = useState(
    months[new Date().getMonth()]
  );

  const [year, setYear] = useState(
    new Date().getFullYear()
  );

  const [search, setSearch] = useState("");

  /*=====================================================
      LOAD DATA
  =====================================================*/

  const loadData = async () => {

    try {

      setLoading(true);


        const res = await API.get("/reports/check-balance", {
            params: {
                month,
                year
            }
        });

        console.log(res.data);

      setRecords(res.data || []);

    }

    catch (err) {

      console.error(err);

      alert("Unable to load report.");

    }

    finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadData();
 

  }, [month, year]);

  /*=====================================================
      SEARCH
  =====================================================*/

const filteredData = useMemo(() => {

  if (!Array.isArray(records)) return [];

  return records.filter(item =>
    item.accountName
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

}, [records, search]);

  /*=====================================================
      TOTALS
  =====================================================*/

  const totalDebit = useMemo(() => {

    return filteredData.reduce(

      (sum, item) =>
        sum + Number(item.debit || 0),

      0

    );

  }, [filteredData]);

  const totalCredit = useMemo(() => {

    return filteredData.reduce(

      (sum, item) =>
        sum + Number(item.credit || 0),

      0

    );

  }, [filteredData]);

  /*=====================================================
      NUMBER FORMAT
  =====================================================*/

  const money = (value) => {

    return Number(value || 0).toLocaleString(

      undefined,

      {

        minimumFractionDigits: 2,

        maximumFractionDigits: 2

      }

    );

  };

  /*=====================================================
      PRINT
  =====================================================*/

  const printReport = () => {

    window.print();

  };

  /*=====================================================
      PDF EXPORT
  =====================================================*/

  const exportPDF = () => {

    const doc = new jsPDF();

    doc.setFontSize(17);

    doc.text(
      "CHECK & BALANCE REPORT",
      14,
      18
    );

    doc.setFontSize(10);

    doc.text(
      `Month : ${month}`,
      14,
      27
    );

    doc.text(
      `Year : ${year}`,
      70,
      27
    );

    autoTable(doc, {

      startY: 35,

      head: [[

        "Account",

        "Debit",

        "Credit"

      ]],

      body: filteredData.map(item => [

        item.accountName,

        money(item.debit),

        money(item.credit)

      ]),

      foot: [[

        "TOTAL",

        money(totalDebit),

        money(totalCredit)

      ]]

    });

    doc.save(`CheckBalance_${month}_${year}.pdf`);

  };

  /*=====================================================
      EXCEL EXPORT
  =====================================================*/

  const exportExcel = () => {

    const excelData = filteredData.map(item => ({

      Account: item.accountName,

      Debit: item.debit,

      Credit: item.credit

    }));

    excelData.push({

      Account: "TOTAL",

      Debit: totalDebit,

      Credit: totalCredit

    });

    const ws =
      XLSX.utils.json_to_sheet(excelData);

    const wb =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(

      wb,

      ws,

      "Check Balance"

    );

    const buffer =
      XLSX.write(

        wb,

        {

          bookType: "xlsx",

          type: "array"

        }

      );

    saveAs(

      new Blob([buffer]),

      `CheckBalance_${month}_${year}.xlsx`

    );

  };
  /*=====================================================
      RETURN UI
  =====================================================*/

  return (
    <div className="checkbalance-container">

      {/* ================= HEADER ================= */}

      <div className="cb-header">

        <div>
          <h1>{t("Check & Balance Report")}</h1>
          <p>{t("General Ledger Check and Balance Statement")}</p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadData}
        >
          <FaSyncAlt />
          {t("Refresh")}
        </button>

      </div>

      {/* ================= FILTER CARD ================= */}

      <div className="filter-cards">

        <div className="filter-group">

          <label>{t("Month")}</label>

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >

            {months.map((m) => (

              <option
                key={m}
                value={m}
              >
                {t(m)}
              </option>

            ))}

          </select>

        </div>

        <div className="filter-group">

          <label>{t("Year")}</label>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >

            {years.map((y) => (

              <option
                key={y}
                value={y}
              >
                {y}
              </option>

            ))}

          </select>

        </div>

        <div className="filter-group search-group">

          <label>{t("Search Account")}</label>

          <div className="search-box">

            <FaSearch />

            <input
              type="text"
              placeholder={t("Search account...")}
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

        </div>

      </div>

      {/* ================= ACTION BUTTONS ================= */}

      <div className="action-bar">

        <button
          className="pdf-btn"
          onClick={exportPDF}
        >
          <FaFilePdf />
          PDF
        </button>

        <button
          className="excel-btn"
          onClick={exportExcel}
        >
          <FaFileExcel />
          Excel
        </button>

        <button
          className="print-btn"
          onClick={printReport}
        >
          <FaPrint />
          {t("Print")}
        </button>

      </div>

      {/* ================= REPORT CARD ================= */}

      <div className="report-card">

        <div className="report-title">

          <h2>{t("Check & Balance Report")}</h2>

          <span>
            {month} {year}
          </span>

        </div>

        {/* ================= ORGANIZATION HEADER ================= */}

        <div className="organization-header">

          <h3>{t("YOUR ORGANIZATION NAME")}</h3>

          <p>{t("General Ledger Check & Balance Report")}</p>

          <p>
            {t("Period:")}
            <strong>
              {" "}
              {month} {year}
            </strong>
          </p>

        </div>

        {/* ================= TABLE START ================= */}

        <div className="table-wrapper">

          <table className="checkbalance-table">

            <thead>

              <tr>

                <th
                  style={{ width: "60%" }}
                >
                  {t("Account Description")}
                </th>

                <th
                  style={{
                    width: "20%",
                    textAlign: "right"
                  }}
                >
                  {t("Debit")}
                </th>

                <th
                  style={{
                    width: "20%",
                    textAlign: "right"
                  }}
                >
                  {t("Credit")}
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="3"
                    className="loading-row"
                  >
                    {t("Loading report...")}
                  </td>

                </tr>

              ) : filteredData.length === 0 ? (

                <tr>

                  <td
                    colSpan="3"
                    className="loading-row"
                  >
                    {t("No data found.")}
                  </td>

                </tr>

              ) : (

                filteredData.map((item, index) => (

                  <tr key={index}>

                    <td>
                      {item.accountName}
                    </td>

                    <td className="amount">

                      {item.debit > 0
                        ? money(item.debit)
                        : ""}

                    </td>

                    <td className="amount">

                      {item.credit > 0
                        ? money(item.credit)
                        : ""}

                    </td>

                  </tr>

                ))

              )}
                          </tbody>

            <tfoot>

              <tr className="total-row">

                <td>
                  <strong>{t("TOTAL")}</strong>
                </td>

                <td className="amount">
                  <strong>{money(totalDebit)}</strong>
                </td>

                <td className="amount">
                  <strong>{money(totalCredit)}</strong>
                </td>

              </tr>

            </tfoot>

          </table>

        </div>

        {/* ================= REPORT SUMMARY ================= */}

        <div className="summary-section">

          <div className="summary-card debit-card">

            <span>{t("Total Debit")}</span>

            <h3>{money(totalDebit)}</h3>

          </div>

          <div className="summary-card credit-card">

            <span>{t("Total Credit")}</span>

            <h3>{money(totalCredit)}</h3>

          </div>

          <div
            className={`summary-card ${
              totalDebit === totalCredit
                ? "balance-card"
                : "unbalance-card"
            }`}
          >

            <span>{t("Status")}</span>

            <h3>
              {totalDebit === totalCredit
                ? t("BALANCED")
                : t("NOT BALANCED")}
            </h3>

          </div>

        </div>

      </div>

    </div>

  );

}