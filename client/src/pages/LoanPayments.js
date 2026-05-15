import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./LoanPayments.css";

export default function LoanPayments() {
  const [employees, setEmployees] = useState([]);
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanType, setLoanType] = useState("");
  const [missingMonths, setMissingMonths] = useState(0);

  const [payment, setPayment] = useState({
    employeeId: "",
    loanId: "",
    amountPaid: "",
    penalty: 0,
  });

  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [minimumPayment, setMinimumPayment] = useState(0);

  const PENALTY_PER_MONTH = 50; // ለምሳሌ በወር 50 ብር ቅጣት

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
    setPayment({ ...payment, employeeId: e.target.value });
    resetSelection();
  };

  const resetSelection = () => {
    setSelectedLoan(null);
    setLoanType("");
    setCalculatedAmount(0);
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
  }, [loanType, payment.employeeId]);

  // ==========================================
  // ሎጂኩ እዚህ ጋር ነው (Grace Period & Missing Months)
  // ==========================================
  const calculateDueAmount = (loan) => {
    const loanStartDate = new Date(loan.createdAt || new Date()); // ብድሩ የተወሰደበት ቀን
    const today = new Date();

    // በወራት መካከል ያለውን ልዩነት ማስላት
    let diffInMonths = (today.getFullYear() - loanStartDate.getFullYear()) * 12 + (today.getMonth() - loanStartDate.getMonth());

    // 2 ወር የዕፎይታ ጊዜ (Grace Period) መቀነስ
    // ለምሳሌ፡ ጃንዋሪ የተበደረ ሰው ፌብሩዋሪ እና ማርች አይከፍልም፣ ኤፕሪል (3ኛው ወር) ይጀምራል።
    const effectiveMonths = diffInMonths - 2; 
    const overdueMonths = effectiveMonths > 0 ? effectiveMonths : 0;

    setMissingMonths(overdueMonths);

    // ወርሃዊ ክፍያ ማስላት
    const principal = loan.principalAmount;
    let totalWithInterest = loan.loanType === "normal" ? principal * 1.12 : principal * 1.08;
    let baseMonthly = loan.loanType === "normal" ? totalWithInterest / 12 : totalWithInterest / 6;

    // አጠቃላይ መክፈል ያለበት (ያለፉት ወራቶች + የአሁኑ ወር)
    // 3ኛው ወር ላይ ከሆነ 1 ወር + የአሁኑን ይከፍላል
    const monthsToPayNow = overdueMonths + 1;
    const currentMinPayment = Math.round(baseMonthly * monthsToPayNow);
    const currentPenalty = overdueMonths * PENALTY_PER_MONTH;

    setMinimumPayment(currentMinPayment);
    setPayment(prev => ({ ...prev, penalty: currentPenalty }));
    
    const savedTotal = localStorage.getItem(`loan_total_${loan._id}`);
    setCalculatedAmount(savedTotal ? Number(savedTotal) : Math.round(totalWithInterest));
  };

  const handleChange = (e) => {
    setPayment({ ...payment, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    const amount = Number(payment.amountPaid);
    const penalty = Number(payment.penalty);

    if (amount < minimumPayment) {
      alert(`❌ Minimum payment required is ${minimumPayment} ETB (for ${missingMonths + 1} months)`);
      return;
    }

    if (missingMonths > 0 && penalty < (missingMonths * PENALTY_PER_MONTH)) {
      alert(`❌ Minimum penalty required is ${missingMonths * PENALTY_PER_MONTH} ETB`);
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
      const newTotal = Math.max(0, calculatedAmount - amount);
      localStorage.setItem(`loan_total_${payment.loanId}`, newTotal);
      window.location.reload(); // ዳታውን ለማደስ
    } catch (err) {
      alert("Error saving payment ❌");
    }
  };

  // ... (ሌላው የጃቫስክሪፕት ሎጂክ እንዳለ ሆኖ የሪተርን (return) ክፍልን በዚህ ተካው)

  return (
    <div className="loan-payment-container">
      <div className="loan-payment-card">
        <h2 className="loan-payment-title">Loan Repayment Portal</h2>

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

        {selectedLoan && (
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
            <div className="status-divider"></div>
            <div className="status-grid">
              <div className="status-item">
                <label>Monthly Min</label>
                <p>{minimumPayment} ETB</p>
              </div>
              <div className="status-item">
                <label>Total Balance</label>
                <p>{calculatedAmount} ETB</p>
              </div>
            </div>
          </div>
        )}

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

        <button onClick={submit} className="loan-submit-btn">
          Confirm Payment
        </button>
      </div>
    </div>
  );

}

