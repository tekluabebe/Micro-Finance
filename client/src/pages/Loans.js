import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./Loans.css";

// 💡 ሳይድባሩ ሲዘጋና ሲከፈት ገጹ አብሮ እንዲለጠጥ ፕሮፕስ ተቀብለናል
export default function Loans({ isSidebarOpen = true }) {
  const [employees, setEmployees] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loans, setLoans] = useState([]);

  const [loan, setLoan] = useState({
    employeeId: "",
    guarantors: [],
    principalAmount: "",
    loanType: "normal",
    durationMonths: 6,
  });

  const [totalSaving, setTotalSaving] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [loanEndDate, setLoanEndDate] = useState("");
  const [requiredGuarantee, setRequiredGuarantee] = useState(0);
  const [guarantorSavings, setGuarantorSavings] = useState({});
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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
      const emp = await API.get("/employees");
      const dep = await API.get("/deposits");
      const loanRes = await API.get("/loans");
      setEmployees(emp.data || []);
      setDeposits(dep.data || []);
      setLoans(loanRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const calculateSaving = (employeeId) => {
    return deposits
      .filter((d) => String(d.employeeId?._id || d.employeeId) === employeeId)
      .reduce((sum, d) => sum + (Number(d.normalSaving) || 0) + (Number(d.voluntarySaving) || 0), 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");

    if (name === "employeeId") {
      const saving = calculateSaving(value);
      setTotalSaving(saving);
      setGuarantorSavings({});
      setLoan((prev) => ({
        ...prev,
        employeeId: value,
        guarantors: [],
      }));
    } else {
      setLoan((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const addGuarantor = (selectedId) => {
    if (!selectedId || loan.guarantors.includes(selectedId)) return;

    const saving = calculateSaving(selectedId);
    setGuarantorSavings((prev) => ({ ...prev, [selectedId]: saving }));
    setLoan((prev) => ({
      ...prev,
      guarantors: [...prev.guarantors, selectedId],
    }));
  };

  const removeGuarantor = (id) => {
    const updated = loan.guarantors.filter((g) => g !== id);
    setLoan((prev) => ({ ...prev, guarantors: updated }));
    const copy = { ...guarantorSavings };
    delete copy[id];
    setGuarantorSavings(copy);
  };

  const totalGuarantorSavings = Object.values(guarantorSavings).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const amount = Number(loan.principalAmount);
    const duration = Number(loan.durationMonths);

    if (!amount || !duration) {
      setMonthlyPayment(0);
      setLoanEndDate("");
      setRequiredGuarantee(0);
      return;
    }

    let totalLoanWithInterest = loan.loanType === "normal" ? amount * 1.12 : amount * 1.08;
    setMonthlyPayment(Math.ceil(totalLoanWithInterest / duration));

    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + 1 + duration); 

    setLoanEndDate(endDate.toDateString());

    const gap = amount - totalSaving;
    setRequiredGuarantee(gap > 0 ? gap : 0);
  }, [loan.principalAmount, loan.durationMonths, loan.loanType, totalSaving]);

  const submit = async () => {
    const amount = Number(loan.principalAmount);
    const duration = Number(loan.durationMonths);
    const maxAllowed = totalSaving * 3;
    const absoluteLimit = 300000;

    setError(""); 

    if (!loan.employeeId || !amount || !duration) {
      setError("እባክዎ ሁሉንም አስፈላጊ መረጃዎች ይሙሉ ❌");
      return;
    }

    if (amount > maxAllowed || amount > absoluteLimit) {
      setError("የብድር መጠኑ ከተፈቀደው በላይ ነው! ❌");
      return;
    }

    const loanDate = new Date();
    const firstPaymentDate = new Date();
    firstPaymentDate.setMonth(loanDate.getMonth() + 2);

    const finalEndDate = new Date();
    finalEndDate.setMonth(loanDate.getMonth() + 1 + duration);

    const payload = {
      ...loan,
      principalAmount: amount,
      totalSaving: totalSaving,
      loanStartDate: loanDate, 
      paymentStartDate: firstPaymentDate, 
      loanEndDate: finalEndDate,
      monthlyInstallment: monthlyPayment, 
    };

    try {
      await API.post("/loans", payload);
      alert(`ብድሩ ተመዝግቧል። ክፍያ የሚጀምረው ${firstPaymentDate.toDateString()} ሲሆን የሚያበቃው ${finalEndDate.toDateString()} ይሆናል። ✅`);
      setLoan({ employeeId: "", guarantors: [], principalAmount: "", loanType: "normal", durationMonths: 6 });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "የብድር ምዝገባው አልተሳካም ❌");
    }
  };

  // 🛠️ ከሳይድባር አቀማመጥ ጋር ማጣበቂያ ተለዋዋጭ ማርጅን
  const currentLeftMargin = isMobile ? "0px" : (isSidebarOpen ? "130px" : "65px");

  const dynamicContainerStyle = {
    marginLeft: currentLeftMargin,
    width: isMobile ? "100%" : `calc(100% - ${currentLeftMargin})`,
  };

  return (
    <div className="loan-container" style={dynamicContainerStyle}>
      <div className="loan-card">
        <h2 className="loan-title">Create Loan Account</h2>

        <div className="loan-form-grid">
          
          {/* ግራውንድ 1: የብድር ቅጽ (Loan Configuration) */}
          <div className="loan-form-section">
            <div className="loan-input-group">
              <label>Select Employee</label>
              <select name="employeeId" value={loan.employeeId} onChange={handleChange}>
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.memberId} - {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>

            {loan.employeeId && (
              <div className="info-box success-box">
                Employee Deposit: <strong>{totalSaving.toLocaleString()} ETB</strong>
              </div>
            )}

            <div className="loan-input-group">
              <label>Loan Amount</label>
              <input 
                type="number" 
                name="principalAmount" 
                placeholder="Enter amount (ETB)..." 
                value={loan.principalAmount} 
                onChange={handleChange} 
              />
            </div>

            {totalSaving > 0 && (
              <div className="info-box limit-box">
                ℹ️ ይህ አባል መበደር የሚችለው ከፍተኛ መጠን: 
                <strong> {Math.min(totalSaving * 3, 300000).toLocaleString()} ETB </strong> ነው::
              </div>
            )}

            <div className="loan-input-group">
              <label>Duration (Months)</label>
              <select name="durationMonths" value={loan.durationMonths} onChange={handleChange}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                  <option key={m} value={m}>{m} Month{m > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>

            <div className="loan-input-group">
              <label>Loan Category</label>
              <select name="loanType" value={loan.loanType} onChange={handleChange}>
                <option value="normal">Normal Loan (12%)</option>
                <option value="holiday">Holiday Loan (8%)</option>
              </select>
            </div>
          </div>

          {/* ቀኙ 2: የቀጥታ ስሌት እና የዋስትና ሰሌዳ (Live Summary & Guarantor Panel) */}
          <div className="loan-summary-section">
            {monthlyPayment > 0 ? (
              <div className="info-box summary-card">
                <div className="summary-row">
                  <span>Monthly Payment:</span>
                  <strong>{monthlyPayment.toLocaleString()} ETB</strong>
                </div>
                <div className="summary-row">
                  <span>Loan Maturity Date:</span>
                  <strong>{loanEndDate}</strong>
                </div>
              </div>
            ) : (
              <div className="info-box empty-summary">
                ℹ️ Enter an amount and employee to view live calculation summary.
              </div>
            )}

            {/* GUARANTOR SECTION */}
            {requiredGuarantee > 0 ? (
              <div className="guarantor-card">
                <h3 className="section-subtitle">Guarantor Verification</h3>
                <p className="guarantor-warning-text">
                  Loan exceeds employee deposits by: <strong>{requiredGuarantee.toLocaleString()} ETB</strong>
                </p>
                
                {totalGuarantorSavings >= requiredGuarantee ? (
                  <div className="badge badge-success">✅ Enough guarantor deposits selected</div>
                ) : (
                  <div className="badge badge-danger">
                    Need at least <strong>{(requiredGuarantee - totalGuarantorSavings).toLocaleString()} ETB</strong> more
                  </div>
                )}

                <div className="loan-input-group" style={{ marginTop: "15px" }}>
                  <label>Add Guarantor</label>
                  <select value="" onChange={(e) => addGuarantor(e.target.value)}>
                    <option value="">-- Choose Guarantor --</option>
                    {employees
                      .filter((e) => e._id !== loan.employeeId && !loan.guarantors.includes(e._id))
                      .map((emp) => (
                        <option key={emp._id} value={emp._id}>{emp.memberId} - {emp.firstName} {emp.lastName}</option>
                      ))}
                  </select>
                </div>

                <div className="guarantor-list">
                  {loan.guarantors.map((id) => {
                    const emp = employees.find((e) => e._id === id);
                    return (
                      <div key={id} className="guarantor-item">
                        <span>{emp?.firstName} {emp?.lastName?.charAt(0)}. (<strong>{guarantorSavings[id].toLocaleString()} ETB</strong>)</span>
                        <button onClick={() => removeGuarantor(id)} className="remove-guarantor-btn">Remove</button>
                      </div>
                    );
                  })}
                </div>
                <div className="guarantor-total-footer">
                  Total Guarantor Savings: <strong>{totalGuarantorSavings.toLocaleString()} ETB</strong>
                </div>
              </div>
            ) : (
              loan.employeeId && loan.principalAmount && (
                <div className="badge badge-success" style={{ padding: "20px", fontSize: "14px", display: "block", textAlign: "center" }}>
                  🎉 No guarantor required. Employee deposits cover this loan amount.
                </div>
              )
            )}
          </div>

          {/* ከታች 3: ስህተት ማሳያ እና ማስገቢያ ቁልፍ (Footer Actions) */}
          <div className="loan-footer-actions">
            {error && <div className="info-box danger-box">{error}</div>}

            <button 
              onClick={submit} 
              className="loan-btn" 
              disabled={requiredGuarantee > 0 && totalGuarantorSavings < requiredGuarantee}
            >
              Create Loan Account
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}