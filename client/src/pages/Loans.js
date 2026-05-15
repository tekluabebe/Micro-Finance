import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./Loans.css";

export default function Loans() {
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

  // =======================
  // LOAD DATA
  // =======================
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

  // =======================
  // CALCULATE SAVINGS
  // =======================
  const calculateSaving = (employeeId) => {
    return deposits
      .filter((d) => String(d.employeeId?._id || d.employeeId) === employeeId)
      .reduce((sum, d) => sum + (Number(d.normalSaving) || 0) + (Number(d.voluntarySaving) || 0), 0);
  };

  // =======================
  // HANDLE INPUTS
  // =======================
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

  // =======================
  // ADD/REMOVE GUARANTORS
  // =======================
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

  // =======================
  // CALCULATE LOAN DETAILS
  // =======================
  // =======================
  // CALCULATE LOAN DETAILS (UI ላይ ወዲያውኑ እንዲታይ)
  // =======================
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

    // --- የብድር ማብቂያ ቀን ማስተካከያ ---
    const today = new Date(); // ዛሬ May 13 (ወር 4 በ JS አቆጣጠር)
    const endDate = new Date();

    // ሎጂኩ፡ ዛሬ ባለበት ወር ላይ 1 ወር (ሰኔን) ዘልሎ + የብድሩን ወራት ይደምራል
    // ግን መጨረሻው ታህሳስ (Month 11) እንዲሆን ከድምሩ ላይ 1 ቀንሰናል
    endDate.setMonth(today.getMonth() + 1 + duration); 

    setLoanEndDate(endDate.toDateString());

    const gap = amount - totalSaving;
    setRequiredGuarantee(gap > 0 ? gap : 0);
  }, [loan.principalAmount, loan.durationMonths, loan.loanType, totalSaving]);
  // =======================
  // SUBMIT
  // =======================
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

    // ገደቦችን ማረጋገጥ... (ከዚህ በፊት የነበረው ኮድ)
    if (amount > maxAllowed || amount > absoluteLimit) {
      setError("የብድር መጠኑ ከተፈቀደው በላይ ነው! ❌");
      return;
    }

    // --- የክፍያ መጀመሪያ እና ማብቂያ ቀናትን ማዘጋጀት ---
    const loanDate = new Date(); // የተወሰደበት ቀን (May 13)
    
    const firstPaymentDate = new Date();
    firstPaymentDate.setMonth(loanDate.getMonth() + 2); // ከ 2 ወር በኋላ (July 13)

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
      
      // Reset Form...
      setLoan({ employeeId: "", guarantors: [], principalAmount: "", loanType: "normal", durationMonths: 6 });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "የብድር ምዝገባው አልተሳካም ❌");
    }
  };
  // ... (የቀረው የ UI ክፍል ቀደም ሲል በነበረው ይቀጥላል)

  return (
    <div className="loan-container">
      <div className="loan-card">
        <h2>Create Loan</h2>

        {/* EMPLOYEE SELECT */}
        <select name="employeeId" value={loan.employeeId} onChange={handleChange}>
          <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.memberId} - {emp.firstName} {emp.lastName}
            </option>
          ))}
        </select>

        {loan.employeeId && (
          <div className="info success">
            Employee Deposit: <strong>{totalSaving.toLocaleString()} birr</strong>
          </div>
        )}

        {/* LOAN AMOUNT INPUT */}
        <input 
          type="number" 
          name="principalAmount" 
          placeholder="Loan Amount" 
          value={loan.principalAmount} 
          onChange={handleChange} 
        />

        {/* አዲሱ የመረጃ ሳጥን (Limit Info Box) */}
        {totalSaving > 0 && (
          <div style={{ color: "#2980b9", fontSize: "13px", marginTop: "5px", background: "#eaf2f8", padding: "8px", borderRadius: "5px" }}>
            ℹ️ ይህ አባል መበደር የሚችለው ከፍተኛ መጠን: 
            <strong> {Math.min(totalSaving * 3, 300000).toLocaleString()} ETB </strong> ነው::
          </div>
        )}

        <select name="durationMonths" value={loan.durationMonths} onChange={handleChange}>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
            <option key={m} value={m}>{m} Month{m > 1 ? "s" : ""}</option>
          ))}
        </select>

        <select name="loanType" value={loan.loanType} onChange={handleChange}>
          <option value="normal">Normal Loan</option>
          <option value="holiday">Holiday Loan</option>
        </select>

        {monthlyPayment > 0 && (
          <div className="info success">
            <p>Monthly Payment: <strong>{monthlyPayment.toLocaleString()} birr</strong></p>
            <p>Loan Ends: <strong>{loanEndDate}</strong></p>
          </div>
        )}

        {/* GUARANTOR SECTION */}
        {requiredGuarantee > 0 && (
          <div className="info warning">
            <p>Loan exceeds employee deposits by: <strong>{requiredGuarantee.toLocaleString()} birr</strong></p>
            
            {totalGuarantorSavings >= requiredGuarantee ? (
              <p style={{ color: "green", fontWeight: "bold" }}>✅ Enough guarantor deposits selected</p>
            ) : (
              <p style={{ color: "red" }}>Need at least <strong>{requiredGuarantee.toLocaleString()} birr</strong> guarantor deposits</p>
            )}

            <select value="" onChange={(e) => addGuarantor(e.target.value)}>
              <option value="">Select Guarantor</option>
              {employees
                .filter((e) => e._id !== loan.employeeId && !loan.guarantors.includes(e._id))
                .map((emp) => (
                  <option key={emp._id} value={emp._id}>{emp.memberId} - {emp.firstName} {emp.lastName}</option>
                ))}
            </select>

            <div className="guarantor-list">
              {loan.guarantors.map((id) => {
                const emp = employees.find((e) => e._id === id);
                return (
                  <div key={id} className="guarantor-item" style={{ display: "flex", justifyContent: "space-between", margin: "5px 0" }}>
                    <span>{emp?.firstName} - <strong>{guarantorSavings[id].toLocaleString()} birr</strong></span>
                    <button onClick={() => removeGuarantor(id)} style={{ background: "red", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", padding: "2px 8px" }}>Remove</button>
                  </div>
                );
              })}
            </div>
            <hr />
            <p>Total Guarantor Savings: <strong>{totalGuarantorSavings.toLocaleString()} birr</strong></p>
          </div>
        )}

        {error && <div className="info danger" style={{ whiteSpace: "pre-line" }}>{error}</div>}

        <button onClick={submit} className="loan-btn" disabled={requiredGuarantee > 0 && totalGuarantorSavings < requiredGuarantee}>
          Create Loan
        </button>
      </div>
    </div>
  );
}