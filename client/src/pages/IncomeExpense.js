import React, { useEffect, useRef, useState } from 'react';
import API from '../services/api';
import './IncomeExpense.css';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function IncomeExpense() {

    const reportRef = useRef();

    const [deposits, setDeposits] = useState([]);
    const [loanPayments, setLoanPayments] = useState([]);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // BANK INCOME
    const [bankIncomes, setBankIncomes] = useState([
        { name: "yebank weled9858/የባንክ ወለድ9858", amount: 0 },
        { name: "yebank weled3001/የባንክ ወለድ3001", amount: 0 }
    ]);

    // OTHER INCOME
    const [otherIncomes, setOtherIncomes] = useState([
        { name: "", amount: 0 }
    ]);

    // EXPENSE
    const [expenseData, setExpenseData] = useState([
        { title: "Bank Service9858/የባንክ አገልግሎት9858", amount: 0 },
        { title: "Savings Interest Expense/የቁጠባ ወለድ ወጪ", amount: 0 },
        { title: "Bank Service 3001/የባንክ አገልግሎት 3001", amount: 0 },
        { title: "Commission Fees and Tax/የኮሚሽን ክፍያና ታክስ", amount: 0 },
    ]);

    // FETCH DATA
useEffect(() => {

    const fetchData = async () => {

        const [depRes, lpRes] = await Promise.all([
            API.get("/deposits"),
            API.get("/loan-payments/all")
        ]);


        setDeposits(depRes.data || []);

        setLoanPayments(lpRes.data || []);

    };


    fetchData();

}, []);

    // FILTER
   // FILTER
const filteredDeposits = deposits.filter(
    d => String(d.year) === String(selectedYear)
);


// FILTER LOAN PAYMENTS BY monthYear
const filteredLoanPayments = loanPayments.filter(lp => {

    if(!lp.monthYear) return false;

    const paymentYear = lp.monthYear.split(" ")[1];

    return Number(paymentYear) === Number(selectedYear);

});

    // INCOME LOGIC
    const registrationFees = filteredDeposits.reduce((s, d) => s + Number(d.registrationFee || 0), 0);
    const lateDepositPenalty = filteredDeposits.reduce((s, d) => s + Number(d.latePenalty || 0), 0);
const loanInterestPaid = filteredLoanPayments.reduce(
    (sum, lp) => sum + Number(lp.interestPaid || 0),
    0
);   
const lateLoanPenalty = filteredLoanPayments.reduce((s, lp) => s + Number(lp.penalty || 0), 0);

    const totalBankIncome = bankIncomes.reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalOtherIncome = otherIncomes.reduce((s, i) => s + Number(i.amount || 0), 0);

    const totalIncome =
        registrationFees +
        lateDepositPenalty +
        loanInterestPaid +
        lateLoanPenalty +
        totalBankIncome +
        totalOtherIncome;

    const totalExpense = expenseData.reduce((s, i) => s + Number(i.amount || 0), 0);

    const netProfit = totalIncome - totalExpense;

    // ================= SAVE REPORT =================
    const handleSave = async () => {
       const payload = {

  year: selectedYear,

  registrationFees,
  lateDepositPenalty,
  loanInterestPaid,
  lateLoanPenalty,

  bankIncomes,

  otherIncomes,

  expenses: [
    {
      title: "Bank Service9858/የባንክ አገልግሎት9858",
      amount: expenseData[0]?.amount || 0
    },
    {
      title: "Savings Interest Expense/የቁጠባ ወለድ ወጪ",
      amount: expenseData[1]?.amount || 0
    },
    {
      title: "Bank Service 3001/የባንክ አገልግሎት 3001",
      amount: expenseData[2]?.amount || 0
    },
    {
      title: "Commission Fees and Tax/የኮሚሽን ክፍያና ታክስ",
      amount: expenseData[3]?.amount || 0
    }
  ],

  totalIncome,
  totalExpense,
  netProfit
};


        await API.post("/financial-reports", payload);
        alert("Report Saved Successfully");
    };

    // ================= EXPORT PDF =================
const exportPDF = async () => {

  try {

    const res = await API.get(
      `/financial-reports/${selectedYear}`
    );

    const report = res.data;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(
      `Financial Report ${report.year}`,
      14,
      15
    );

    // Income Section
    autoTable(doc, {
      startY: 25,
      head: [["Income Item", "Amount"]],
      body: [
        ["Registration Fees", report.registrationFees],
        ["Late Deposit Penalty", report.lateDepositPenalty],
        ["Loan Interest Paid", report.loanInterestPaid],
        ["Late Loan Penalty", report.lateLoanPenalty]
      ]
    });

    // Bank Income
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Bank Income", "Amount"]],
      body: report.bankIncomes.map(item => [
        item.name,
        item.amount
      ])
    });

    // Other Income
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Other Income", "Amount"]],
      body: report.otherIncomes.map(item => [
        item.name,
        item.amount
      ])
    });

    // Expenses
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Expense", "Amount"]],
      body: report.expenses.map(item => [
        item.title,
        item.amount
      ])
    });

    // Summary
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Summary", "Amount"]],
      body: [
        ["Total Income", report.totalIncome],
        ["Total Expense", report.totalExpense],
        ["Net Profit", report.netProfit]
      ]
    });

    doc.save(
      `Financial_Report_${report.year}.pdf`
    );

  } catch (err) {

    alert(
      "No financial report found for this year."
    );

    console.error(err);
  }
};

    // ================= EXPORT EXCEL =================
 const exportExcel = async () => {

  try {

    const res = await API.get(
      `/financial-reports/${selectedYear}`
    );

    const report = res.data;

    const wb = XLSX.utils.book_new();

    // Income Sheet
    const incomeSheet =
      XLSX.utils.json_to_sheet([
        {
          RegistrationFees:
            report.registrationFees,
          LateDepositPenalty:
            report.lateDepositPenalty,
          LoanInterestPaid:
            report.loanInterestPaid,
          LateLoanPenalty:
            report.lateLoanPenalty
        }
      ]);

    XLSX.utils.book_append_sheet(
      wb,
      incomeSheet,
      "Income"
    );

    // Bank Income
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        report.bankIncomes
      ),
      "Bank Income"
    );

    // Other Income
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        report.otherIncomes
      ),
      "Other Income"
    );

    // Expenses
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        report.expenses
      ),
      "Expenses"
    );

    // Summary
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        {
          TotalIncome:
            report.totalIncome,
          TotalExpense:
            report.totalExpense,
          NetProfit:
            report.netProfit
        }
      ]),
      "Summary"
    );

    XLSX.writeFile(
      wb,
      `Financial_Report_${report.year}.xlsx`
    );

  } catch (err) {

    alert(
      "No financial report found for this year."
    );

    console.error(err);
  }
};

    // ================= CHART DATA =================
    const chartData = [
        { name: "Income", value: totalIncome },
        { name: "Expense", value: totalExpense },
        { name: "Profit", value: netProfit }
    ];

const handleBankIncomeChange = (index, value) => {
    const updated = [...bankIncomes];
    updated[index].amount = Number(value) || 0;
    setBankIncomes(updated);
};

const handleOtherIncomeChange = (index, field, value) => {
    const updated = [...otherIncomes];
    updated[index][field] =
        field === "amount" ? Number(value) || 0 : value;
    setOtherIncomes(updated);
};

const handleExpenseChange = (index, value) => {
    const updated = [...expenseData];
    updated[index].amount = Number(value) || 0;
    setExpenseData(updated);
};


// ADD OTHER INCOME ROW
const addOtherIncomeRow = () => {
    setOtherIncomes([...otherIncomes, { name: "", amount: 0 }]);
};

// REMOVE OTHER INCOME ROW
const removeOtherIncomeRow = (index) => {
    setOtherIncomes(otherIncomes.filter((_, i) => i !== index));
};

    return (
        <div ref={reportRef} className="income-expense-container">

            <h2 className="main-title">ገቢ እና ወጪ Dashboard</h2>

            {/* FILTER */}
            <div className="filter-container">
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    {[2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                        <option key={y}>{y}</option>
                    ))}
                </select>
            </div>

            {/* ================= DASHBOARD CHART ================= */}
<div className="chart-container">                <ResponsiveContainer>
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value">
  {chartData.map((entry, index) => (
    <Cell
      key={`cell-${index}`}
      fill={
        entry.name === "Income"
          ? "#28a745" // Green
          : entry.name === "Expense"
          ? "#dc3545" // Red
          : "#007bff" // Blue
      }
    />
  ))}
</Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* BUTTONS */}
<div className="button-group">
                  <button className="save-btn" onClick={handleSave}>💾 Save</button>
                <button className="pdf-btn" onClick={exportPDF}>🧾 Export PDF</button>
                <button className="excel-btn" onClick={exportExcel}>📊 Export Excel</button>
            </div>

            {/* EXISTING UI (your full income/expense UI stays same below) */}

            <div className="report-grid">

                {/* ========================= INCOME ========================= */}
                <div className="report-card">

                    <h3 className="report-title" style={{ color: '#28a745' }}>
                        ገቢ (Income)
                    </h3>

                    {/* FIXED INCOME ROWS (NO EDIT STRUCTURE CHANGE) */}
                    <div className="table-row">
                        <span>Registration Fees/መመዝገቢያ</span>
                        <span>{registrationFees.toLocaleString()}</span>
                    </div>

                    <div className="table-row">
                        <span>Late Deposit Penalty/የቁጠባ ቅጣት</span>
                        <span>{lateDepositPenalty.toLocaleString()}</span>
                    </div>

                   <div className="table-row">
    <span>Loan Interest Paid/የብድር ወለድ</span>
    <span>{loanInterestPaid.toLocaleString()}</span>
</div>

                    <div className="table-row">
                        <span>Late Loan Penalty/የብድር ቅጣት</span>
                        <span>{lateLoanPenalty.toLocaleString()}</span>
                    </div>

                    {/* ================= BANK INCOME (FIXED) ================= */}
                    <h4 style={{ marginTop: 20 }}>Bank Income</h4>

                    {bankIncomes.map((item, i) => (
                        <div key={i} className="table-row">
                            <span>{item.name}</span>

                            <input
                                type="number"
                                value={item.amount}
                                onChange={(e) =>
                                    handleBankIncomeChange(i, e.target.value)
                                }
                            />
                        </div>
                    ))}

                    {/* ================= OTHER INCOME (ONLY DYNAMIC) ================= */}
                    <h4 style={{ marginTop: 20 }}>Other Income</h4>

                    {otherIncomes.map((income, index) => (
                        <div key={index} className="table-row">

                            <input
                                placeholder="Income Name"
                                value={income.name}
                                onChange={(e) =>
                                    handleOtherIncomeChange(index, "name", e.target.value)
                                }
                            />

                            <input
                                type="number"
                                placeholder="Amount"
                                value={income.amount}
                                onChange={(e) =>
                                    handleOtherIncomeChange(index, "amount", e.target.value)
                                }
                            />

<button
  className="remove-btn"
  onClick={() => removeOtherIncomeRow(index)}
>                                ❌
                            </button>

                        </div>
                    ))}

<button className="add-income-btn" onClick={addOtherIncomeRow}>                        + Add Other Income
                    </button>

                    {/* TOTAL */}
                    <div className="total-row">
                      <h3  style={{ color: '#19cd31' }}>
                        ጠቅላላ ገቢ (Total Income)
                    </h3>
                        <span style={{ color: '#19cd31' }}>{totalIncome.toLocaleString()}</span>
                    </div>

                </div>

                {/* ========================= EXPENSE ========================= */}
                <div className="report-card">

                    <h3 className="report-title" style={{ color: '#dc3545' }}>
                        ወጪ (Expense)
                    </h3>

                    {expenseData.map((item, i) => (
                        <div key={i} className="table-row">
                            <span>{item.title}</span>

                            <input
                                type="number"
                                value={item.amount}
                                onChange={(e) =>
                                    handleExpenseChange(i, e.target.value)
                                }
                            />
                        </div>
                    ))}

                    <div className="total-row">
                        <span style={{ color: '#ef6f0d' }}>ጠቅላላ ወጪ</span>
                        <span style={{ color: '#cd6d19' }}>{totalExpense.toLocaleString()}</span>
                    </div>

                </div>

            </div>

            <div className="kpi-container">
                <div className="kpi-card income-bg">
                    <h4>Total Income</h4>
                    <p>{totalIncome.toLocaleString()} ETB</p>
                </div>

                <div className="kpi-card expense-bg">
                    <h4>Total Expenses</h4>
                    <p>{totalExpense.toLocaleString()} ETB</p>
                </div>

                <div className="kpi-card profit-bg">
                    <h4>Net Profit</h4>
                    <p>{netProfit.toLocaleString()} ETB</p>
                </div>
            </div>

        </div>
    );
}