import React, { useEffect, useMemo, useState } from "react";
import "./CashFlow.css";

import API from "../services/api";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  FaFilePdf,
  FaFileExcel,
  FaPrint,
  FaSyncAlt,
  FaMoneyCheckAlt,
  FaCalendarAlt,
} from "react-icons/fa";

/*=========================================================
    YEARS
=========================================================*/

const years = [];

for (let y = 2023; y <= 2035; y++) {
  years.push(y);
}

/*=========================================================
    DEFAULT DATA
=========================================================*/

const defaultCashFlow = {
  operating: {
    profit: 0,
    depreciation: 0,
    receivableIncrease: 0,
    payableIncrease: 0,
    inventoryDecrease: 0,
    otherAdjustment: 0,
  },

  investing: {
    purchaseAsset: 0,
    saleAsset: 0,
    investmentPurchase: 0,
    investmentSale: 0,
  },

  financing: {
    shareCapital: 0,
    loanReceived: 0,
    loanRepayment: 0,
    dividendPaid: 0,
  },

  openingCash: 0,
};

export default function CashFlow() {
  /*=========================================================
        STATES
    =========================================================*/

  const [year, setYear] = useState(new Date().getFullYear());

  const [loading, setLoading] = useState(false);

  const [cashFlow, setCashFlow] = useState(defaultCashFlow);

  /*=========================================================
        LOAD CASH FLOW
    =========================================================*/

  const loadCashFlow = async () => {
    try {
      setLoading(true);

      const res = await API.get(`/reports/cash-flow?year=${year}`);

      console.log("Cash Flow Response:", res.data);

      const data = res.data || {};

      setCashFlow({
        ...defaultCashFlow,
        ...data,

        operating: {
          ...defaultCashFlow.operating,
          ...(data.operating || {}),
        },

        investing: {
          ...defaultCashFlow.investing,
          ...(data.investing || {}),
        },

        financing: {
          ...defaultCashFlow.financing,
          ...(data.financing || {}),
        },
      });
    } catch (err) {
      console.error("Cash Flow Error:", err);

      setCashFlow(defaultCashFlow);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashFlow();
  }, [year]);

  /*=========================================================
        CALCULATIONS
    =========================================================*/

  const operatingTotal = useMemo(() => {
    const op = cashFlow?.operating || {};

    return (
      Number(op.profit ?? 0) +
      Number(op.depreciation ?? 0) +
      Number(op.inventoryDecrease ?? 0) +
      Number(op.payableIncrease ?? 0) -
      Number(op.receivableIncrease ?? 0) +
      Number(op.otherAdjustment ?? 0)
    );
  }, [cashFlow]);

  const investingTotal = useMemo(() => {
    const inv = cashFlow?.investing || {};

    return (
      Number(inv.saleAsset ?? 0) +
      Number(inv.investmentSale ?? 0) -
      Number(inv.purchaseAsset ?? 0) -
      Number(inv.investmentPurchase ?? 0)
    );
  }, [cashFlow]);

  const financingTotal = useMemo(() => {
    const fin = cashFlow?.financing || {};

    return (
      Number(fin.shareCapital ?? 0) +
      Number(fin.loanReceived ?? 0) -
      Number(fin.loanRepayment ?? 0) -
      Number(fin.dividendPaid ?? 0)
    );
  }, [cashFlow]);

  const netCashIncrease = useMemo(() => {
    return operatingTotal + investingTotal + financingTotal;
  }, [operatingTotal, investingTotal, financingTotal]);

  const closingCash = useMemo(() => {
    return Number(cashFlow?.openingCash ?? 0) + netCashIncrease;
  }, [cashFlow, netCashIncrease]);

  /*=========================================================
        FORMAT MONEY
    =========================================================*/

  const money = (value) => {
    return Number(value ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /*=========================================================
    EXPORT PDF
=========================================================*/

const exportPDF = () => {

    const op = cashFlow?.operating || {};
    const inv = cashFlow?.investing || {};
    const fin = cashFlow?.financing || {};

    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Cash Flow Statement", 105, 18, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Financial Year : ${year}`, 105, 26, {
        align: "center",
    });

    autoTable(doc, {
        startY: 35,

        head: [["Description", "Amount"]],

        body: [

            ["Cash Flow from Operating Activities", ""],

            ["Profit Before Tax", money(op.profit)],

            ["Depreciation Expense", money(op.depreciation)],

            ["Increase in Accounts Receivable", `(${money(op.receivableIncrease)})`],

            ["Increase in Accounts Payable", money(op.payableIncrease)],

            ["Decrease in Inventory", money(op.inventoryDecrease)],

            ["Other Adjustments", money(op.otherAdjustment)],

            ["Net Cash from Operating Activities", money(operatingTotal)],

            ["",""],

            ["Cash Flow from Investing Activities",""],

            ["Purchase of Property", `(${money(inv.purchaseAsset)})`],

            ["Sale of Property", money(inv.saleAsset)],

            ["Investment Purchase", `(${money(inv.investmentPurchase)})`],

            ["Investment Sale", money(inv.investmentSale)],

            ["Net Cash from Investing Activities", money(investingTotal)],

            ["",""],

            ["Cash Flow from Financing Activities",""],

            ["Share Capital", money(fin.shareCapital)],

            ["Loan Received", money(fin.loanReceived)],

            ["Loan Repayment", `(${money(fin.loanRepayment)})`],

            ["Dividend Paid", `(${money(fin.dividendPaid)})`],

            ["Net Cash from Financing Activities", money(financingTotal)],

            ["",""],

            ["Net Increase in Cash", money(netCashIncrease)],

            ["Opening Cash Balance", money(cashFlow?.openingCash)],

            ["Closing Cash Balance", money(closingCash)]

        ],

        headStyles:{
            fillColor:[31,78,121],
            textColor:255,
            fontStyle:"bold",
            halign:"center"
        },

        styles:{
            fontSize:10,
            cellPadding:3
        },

        columnStyles:{
            0:{cellWidth:130},
            1:{
                cellWidth:50,
                halign:"right"
            }
        }

    });

    doc.save(`CashFlow_${year}.pdf`);

};


/*=========================================================
    EXPORT EXCEL
=========================================================*/

const exportExcel = () => {

    const op = cashFlow?.operating || {};
    const inv = cashFlow?.investing || {};
    const fin = cashFlow?.financing || {};

    const rows = [

        {Description:"Cash Flow Statement",Amount:""},
        {Description:`Financial Year ${year}`,Amount:""},
        {},

        {Description:"Cash Flow from Operating Activities",Amount:""},
        {Description:"Profit Before Tax",Amount:op.profit},
        {Description:"Depreciation Expense",Amount:op.depreciation},
        {Description:"Increase in Accounts Receivable",Amount:-Number(op.receivableIncrease||0)},
        {Description:"Increase in Accounts Payable",Amount:op.payableIncrease},
        {Description:"Decrease in Inventory",Amount:op.inventoryDecrease},
        {Description:"Other Adjustments",Amount:op.otherAdjustment},
        {Description:"Net Cash from Operating Activities",Amount:operatingTotal},

        {},

        {Description:"Cash Flow from Investing Activities",Amount:""},
        {Description:"Purchase of Property",Amount:-Number(inv.purchaseAsset||0)},
        {Description:"Sale of Property",Amount:inv.saleAsset},
        {Description:"Investment Purchase",Amount:-Number(inv.investmentPurchase||0)},
        {Description:"Investment Sale",Amount:inv.investmentSale},
        {Description:"Net Cash from Investing Activities",Amount:investingTotal},

        {},

        {Description:"Cash Flow from Financing Activities",Amount:""},
        {Description:"Share Capital",Amount:fin.shareCapital},
        {Description:"Loan Received",Amount:fin.loanReceived},
        {Description:"Loan Repayment",Amount:-Number(fin.loanRepayment||0)},
        {Description:"Dividend Paid",Amount:-Number(fin.dividendPaid||0)},
        {Description:"Net Cash from Financing Activities",Amount:financingTotal},

        {},

        {Description:"Net Increase in Cash",Amount:netCashIncrease},
        {Description:"Opening Cash Balance",Amount:cashFlow?.openingCash ?? 0},
        {Description:"Closing Cash Balance",Amount:closingCash}

    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Cash Flow"
    );

    const excelBuffer = XLSX.write(workbook,{
        bookType:"xlsx",
        type:"array"
    });

    const file = new Blob(
        [excelBuffer],
        {
            type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
    );

    saveAs(file,`CashFlow_${year}.xlsx`);

};


/*=========================================================
    PRINT
=========================================================*/

const printReport = () => {

    window.print();

};
const op = cashFlow?.operating || {};
const inv = cashFlow?.investing || {};
const fin = cashFlow?.financing || {};

return (

    <div className="cashflow-container">

        {/*================ HEADER ================*/}

        <div className="cashflow-header">

            <div>

                <h1>
                    <FaMoneyCheckAlt />
                    Cash Flow Statement
                </h1>

                <p>Statement of Cash Flow</p>

            </div>

            <div className="cashflow-actions">

                <button
                    className="refresh-btn"
                    onClick={loadCashFlow}
                >
                    <FaSyncAlt />
                    Refresh
                </button>

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
                    Print
                </button>

            </div>

        </div>

        {/*================ FILTER ================*/}

        <div className="cashflow-filter-card">

            <div className="filter-group">

                <label>

                    <FaCalendarAlt />

                    Financial Year

                </label>

                <select
                    value={year}
                    onChange={(e)=>setYear(Number(e.target.value))}
                >

                    {years.map(y=>(
                        <option key={y} value={y}>
                            {y}
                        </option>
                    ))}

                </select>

            </div>

        </div>

        {/*================ REPORT ================*/}

        <div className="cashflow-card">

            <div className="report-title">

                <h2>Cash Flow Statement</h2>

                <span>
                    For the Year Ended December 31, {year}
                </span>

            </div>

            <table className="cashflow-table">

                <thead>

                    <tr>

                        <th>Description</th>

                        <th>Amount</th>

                    </tr>

                </thead>

                <tbody>

                    {/*================ Operating =================*/}

                    <tr className="section-row">
                        <td colSpan="2">
                            Cash Flow from Operating Activities
                        </td>
                    </tr>

                    <tr>
                        <td>Profit Before Tax</td>
                        <td>{money(op.profit)}</td>
                    </tr>

                    <tr>
                        <td>Depreciation Expense</td>
                        <td>{money(op.depreciation)}</td>
                    </tr>

                    <tr>
                        <td>Increase in Accounts Receivable</td>
                        <td>({money(op.receivableIncrease)})</td>
                    </tr>

                    <tr>
                        <td>Increase in Accounts Payable</td>
                        <td>{money(op.payableIncrease)}</td>
                    </tr>

                    <tr>
                        <td>Decrease in Inventory</td>
                        <td>{money(op.inventoryDecrease)}</td>
                    </tr>

                    <tr>
                        <td>Other Adjustments</td>
                        <td>{money(op.otherAdjustment)}</td>
                    </tr>

                    <tr className="total-row">
                        <td>
                            Net Cash from Operating Activities
                        </td>
                        <td>{money(operatingTotal)}</td>
                    </tr>

                    {/*================ Investing =================*/}

                    <tr className="section-row">
                        <td colSpan="2">
                            Cash Flow from Investing Activities
                        </td>
                    </tr>

                    <tr>
                        <td>Purchase of Property & Equipment</td>
                        <td>({money(inv.purchaseAsset)})</td>
                    </tr>

                    <tr>
                        <td>Sale of Property</td>
                        <td>{money(inv.saleAsset)}</td>
                    </tr>

                    <tr>
                        <td>Investment Purchase</td>
                        <td>({money(inv.investmentPurchase)})</td>
                    </tr>

                    <tr>
                        <td>Investment Sale</td>
                        <td>{money(inv.investmentSale)}</td>
                    </tr>

                    <tr className="total-row">
                        <td>
                            Net Cash from Investing Activities
                        </td>
                        <td>{money(investingTotal)}</td>
                    </tr>

                    {/*================ Financing =================*/}

                    <tr className="section-row">
                        <td colSpan="2">
                            Cash Flow from Financing Activities
                        </td>
                    </tr>

                    <tr>
                        <td>Share Capital Issued</td>
                        <td>{money(fin.shareCapital)}</td>
                    </tr>

                    <tr>
                        <td>Loan Received</td>
                        <td>{money(fin.loanReceived)}</td>
                    </tr>

                    <tr>
                        <td>Loan Repayment</td>
                        <td>({money(fin.loanRepayment)})</td>
                    </tr>

                    <tr>
                        <td>Dividend Paid</td>
                        <td>({money(fin.dividendPaid)})</td>
                    </tr>

                    <tr className="total-row">
                        <td>
                            Net Cash from Financing Activities
                        </td>
                        <td>{money(financingTotal)}</td>
                    </tr>

                    {/*================ Summary =================*/}

                    <tr className="grand-total-row">

                        <td>
                            Net Increase in Cash
                        </td>

                        <td>
                            {money(netCashIncrease)}
                        </td>

                    </tr>

                    <tr>

                        <td>
                            Opening Cash Balance
                        </td>

                        <td>
                            {money(cashFlow?.openingCash)}
                        </td>

                    </tr>

                    <tr className="closing-row">

                        <td>
                            Closing Cash Balance
                        </td>

                        <td>
                            {money(closingCash)}
                        </td>

                    </tr>

                </tbody>

            </table>

            {loading && (

                <div className="loading-box">

                    Loading Cash Flow...

                </div>

            )}

        </div>

    </div>

)};