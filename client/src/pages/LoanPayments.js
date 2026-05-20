import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./LoanPayments.css";

// 💡 ሳይድባሩ ሲዘጋና ሲከፈት ገጹ አብሮ እንዲለጠጥ ፕሮፕስ ተቀብለናል
export default function LoanPayments({ isSidebarOpen = true }) {
  const [employees, setEmployees] = useState([]);
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanType, setLoanType] = useState("");
  const [missingMonths, setMissingMonths] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [payment, setPayment] = useState({
    employeeId: "",
    loanId: "",
    amountPaid: "",
    penalty: 0,
  });

  const [minimumPayment, setMinimumPayment] = useState(0);

  const PENALTY_PER_MONTH = 50;

  // የስክሪን መጠን መለወጫ ማዳመጫ (Responsive)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [emp, loanRes] = await Promise.all([
        API.get("/employees"),
        API.get("/loans")
      ]);
      setEmployees(emp.data || []);
      setLoans(loanRes.data || []);
    } catch (err) {
      console.error("Load error", err);
    }
  };

  const handleEmployeeChange = (e) => {
    setPayment({ ...payment, employeeId: e.target.value, amountPaid: "", penalty: 0 });
    resetSelection();
  };

  const resetSelection = () => {
    setSelectedLoan(null);
    setLoanType("");
    setMinimumPayment(0);
    setMissingMonths(0);
  };

  useEffect(() => {
    if (payment.employeeId && loanType) {
      const loan = loans.find(
        (l) => String(l.employeeId?._id || l.employeeId) === payment.employeeId &&
               l.loanType === loanType && l.status === "approved" && l.remainingAmount > 0
      );

      if (loan) {
        setSelectedLoan(loan);
        setPayment(prev => ({ ...prev, loanId: loan._id }));
        calculateDueAmount(loan);
      } else {
        resetSelection();
      }
    }
  }, [loanType, payment.employeeId, loans]);

  // ==========================================================================
  // ✨ የተስተካከለ የ Grace Period እና የወርሃዊ ክፍያ ስሌት ሎጂክ
  // ==========================================================================
  const calculateDueAmount = (loan) => {
    const loanStartDate = new Date(loan.createdAt || new Date());
    const today = new Date();

    // በወራት መካከል ያለውን ጠቅላላ ልዩነት ማስላት
    let diffInMonths = (today.getFullYear() - loanStartDate.getFullYear()) * 12 + (today.getMonth() - loanStartDate.getMonth());

    // 2 ወር የዕፎይታ ጊዜ (Grace Period) መቀነስ
    const effectiveMonths = diffInMonths - 2;
    const overdueMonths = effectiveMonths > 0 ? effectiveMonths : 0;

    setMissingMonths(overdueMonths);

    // ወርሃዊ መደበኛ ክፍያን ማስላት
    const principal = loan.principalAmount;
    let totalWithInterest = loan.loanType === "normal" ? principal * 1.12 : principal * 1.08;
    let baseMonthly = loan.loanType === "normal" ? totalWithInterest / 12 : totalWithInterest / 6;

    // 💡 ማስተካከያ፡ ዝቅተኛው መክፈያ ከአንድ ወር ቤዝ ክፍያ ማነስ የለበትም፣ 
    // ነገር ግን የቀረው ጠቅላላ እዳ ከወርሃዊው ክፍያ ካነሰ የቀረውን እዳ ብቻ ያሳያል
    const singleMonthPay = Math.round(baseMonthly);
    const calculatedMin = loan.remainingAmount < singleMonthPay ? loan.remainingAmount : singleMonthPay;
    
    setMinimumPayment(calculatedMin);

    // የቅጣት ስሌት (ካመለጡ ወራት አንጻር)
    const currentPenalty = overdueMonths * PENALTY_PER_MONTH;
    setPayment(prev => ({ ...prev, penalty: currentPenalty }));
  };

  const handleChange = (e) => {
    setPayment({ ...payment, [e.target.name]: e.target.value });
  };

  // ==========================================================================
  // 💾 መረጃን ወደ ቤክኤንድ መላኪያ ሎጂክ
  // ==========================================================================
  const submit = async () => {
    const amount = Number(payment.amountPaid);
    const penalty = Number(payment.penalty);

    if (!payment.employeeId || !payment.loanId) {
      alert("❌ Please select a member and loan category first.");
      return;
    }

    if (amount <= 0) {
      alert("❌ Please enter a valid payment amount.");
      return;
    }

    if (amount < minimumPayment) {
      alert(`❌ Minimum payment required is ${minimumPayment} ETB`);
      return;
    }

    // ከቀረው ጠቅላላ ዕዳ በላይ መክፈል አይቻልም
    if (amount > selectedLoan.remainingAmount) {
      alert(`❌ Amount exceeds the remaining loan balance of ${selectedLoan.remainingAmount} ETB`);
      return;
    }

    try {
      await API.post("/loan-payments", {
        employeeId: payment.employeeId,
        loanId: payment.loanId,
        amountPaid: amount,
        penalty: penalty,
      });

      alert("Payment recorded successfully ✅");
      
      // 💡 ማስተካከያ፡ ከሉካል ስቶሬጅ ይልቅ ዳታቤዙን በቀጥታ አድሶ ትክክለኛውን ዳታ እንዲያመጣ ማድረግ
      fetchData(); 
      resetSelection();
      setPayment({ employeeId: "", loanId: "", amountPaid: "", penalty: 0 });
    } catch (err) {
      alert(err.response?.data?.message || "Error saving payment ❌");
    }
  };

  // 🛠️ ከሳይድባር አቀማመጥ ጋር ማጣበቂያ ተለዋዋጭ ማርጅን
  const currentLeftMargin = isMobile ? "0px" : (isSidebarOpen ? "130px" : "65px");

  const dynamicContainerStyle = {
    marginLeft: currentLeftMargin,
    width: isMobile ? "100%" : `calc(100% - ${currentLeftMargin})`,
  };

 return (
    <div className="loan-payment-container" style={dynamicContainerStyle}>
      <div className="loan-payment-card">
        <h2 className="loan-payment-title">Loan Repayment Portal</h2>

        {/* 💡 ዋና ማስተካከያ፦ የ CSS ግሪዱ እንዲሰራ ሁሉንም ፎርሞች በዚህ ዲቭ እንጠቅልላቸዋለን */}
        <div className="loan-form-grid">
          
          {/* ግራውንድ 1፦ አባል መምረጫ */}
          <div className="loan-selection-box">
            <div className="loan-input-group">
              <label>Select Member</label>
              <select onChange={handleEmployeeChange} value={payment.employeeId}>
                <option value="">-- Choose Member --</option>
                {employees.map(e => (
                  <option key={e._id} value={e._id}>{e.memberId} - {e.firstName} {e.lastName}</option>
                ))}
              </select>
            </div>

            {payment.employeeId && (
              <div className="loan-input-group">
                <label>Loan Category</label>
                <select value={loanType} onChange={(e) => setLoanType(e.target.value)}>
                  <option value="">-- Select Loan Type --</option>
                  <option value="normal">Normal Loan (12%)</option>
                  <option value="holiday">Holiday Loan (8%)</option>
                </select>
              </div>
            )}
          </div>

          {/* ቀኙ 2፦ የብድር ሁኔታ ማሳያ ሰሌዳ (የተመረጠ ብድር ካለ ብቻ የሚታይ) */}
          {selectedLoan ? (
            <div className="loan-status-panel">
              <div className="status-row">
                <span>Start Date:</span>
                <strong>{new Date(selectedLoan.createdAt).toLocaleDateString()}</strong>
              </div>
              <div className="status-row">
                <span>Grace Period:</span>
                <span className="badge-green">2 Months Included</span>
              </div>
              <div className="status-row highlight-row">
                <span>Overdue Months:</span>
                <strong className={missingMonths > 0 ? "text-danger" : "text-success"}>
                  {missingMonths} Months
                </strong>
              </div>
              <div className="status-grid">
                <div className="status-item">
                  <label>Monthly Min</label>
                  <p>{minimumPayment} ETB</p>
                </div>
                <div className="status-item">
                  <label>Total Balance</label>
                  <p style={{ color: "#ef4444" }}>{selectedLoan.remainingAmount} ETB</p>
                </div>
              </div>
            </div>
        ) : (
            /* 💡 የተስተካከለ ማራኪ መረጃ ሰጭ ሳጥን (Placeholder) */
            <div className="loan-status-panel loan-status-placeholder">
              <div className="placeholder-icon">ℹ️</div>
              <p className="placeholder-text">
                Please select a member and loan type to view current status.
              </p>
            </div>
          )}

          {/* ከታች 3፦ የክፍያ መሙያ ሳጥኖች (ሙሉ ስፋት የሚይዙ) */}
          <div className="payment-entry-section">
            <div className="loan-input-group">
              <label>Amount to Pay</label>
              <input 
                name="amountPaid" 
                type="number" 
                className="main-payment-input"
                value={payment.amountPaid} 
                onChange={handleChange} 
                placeholder="Enter amount..." 
              />
            </div>

            <div className="loan-input-group">
              <label>Late Penalty (Auto-calculated)</label>
              <input 
                name="penalty" 
                type="number" 
                className={missingMonths > 0 ? "penalty-input active" : "penalty-input"}
                value={payment.penalty} 
                onChange={handleChange} 
              />
            </div>
          </div>

          {/* 4፦ ማረጋገጫ ማቅረቢያ ቁልፍ (Submit Button) */}
          <button onClick={submit} className="loan-submit-btn">
            Confirm Payment
          </button>

        </div> {/* 💡 የ loan-form-grid መዝጊያ */}
      </div>
    </div>
  );
}