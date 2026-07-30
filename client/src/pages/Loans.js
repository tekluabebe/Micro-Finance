import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./Loans.css";

// 💡 ሳይድባሩ ሲዘጋና ሲከፈት ገጹ አብሮ እንዲለጠጥ ፕሮፕስ ተቀብለናል
export default function Loans({ isSidebarOpen = true }) {
  const [employees, setEmployees] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loans, setLoans] = useState([]);
//const loggedInEmployeeId = localStorage.getItem("employeeId");
  const [loan, setLoan] = useState({
    employeeId: "",
    guarantors: [],
    principalAmount: "",
    loanType: "normal",
    durationMonths: 6,
  });
const isMember = localStorage.getItem("userRole")?.toLowerCase() === "member";
const loggedInMemberId = localStorage.getItem("memberId");
console.log("loggedInEmployeeId:", loggedInMemberId);
console.log("employees:", employees);
const [showHistory, setShowHistory] = useState(false);
const [historyLoans, setHistoryLoans] = useState([]);
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
      setLoans(
  (loanRes.data || []).filter(
    loan => loan.status !== "pending"
  )
);
    } catch (err) {
      console.error(err);
    }
  };


useEffect(() => {
  if (
    isMember &&
    loggedInMemberId &&
    employees.length > 0
  ) {
    const employee = employees.find(
      (emp) =>
        String(emp.memberId) === String(loggedInMemberId)
    );

    if (employee) {
      const saving = calculateSaving(employee._id);

      setTotalSaving(saving);

      setLoan((prev) => ({
        ...prev,
        employeeId: employee._id,
      }));
    }
  }
}, [employees, deposits]);
  const loadLoanHistory = async () => {
  try {
    const res = await API.get("/loans");
    setHistoryLoans(
  (res.data || []).filter(
    loan => loan.status !== "pending"
  )
);
  } catch (err) {
    console.error(err);
  }
};

const updateLoanStatus = async (loanId, status) => {
  try {
    console.log("Updating:", `/loans/${loanId}/status`);

    const res = await API.put(
      `/loans/${loanId}/status`,
      { status }
    );

    console.log(res.data);

    loadLoanHistory();
    fetchData();

    alert("Loan status updated successfully");
  } catch (err) {
    console.error("ERROR:", err.response?.data);
    console.error("STATUS:", err.response?.status);
    console.error("URL:", err.config?.url);

    alert(
      err.response?.data?.message ||
      "Failed to update status"
    );
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

const principal = amount;
const months = duration;

let totalLoanWithInterest;

if (loan.loanType === "normal") {
  const monthlyRate = 0.15 / 12;

  totalLoanWithInterest =
    amount * Math.pow(1 + monthlyRate, duration);
} else {
  totalLoanWithInterest = amount * 1.08;
}

// Round total loan
const roundedTotalLoan = Math.ceil(totalLoanWithInterest);

// Monthly installment
setMonthlyPayment(
  Math.ceil(roundedTotalLoan / duration)
);

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

let totalLoanWithInterest;

if (loan.loanType === "normal") {
  const monthlyRate = 0.15 / 12;

  totalLoanWithInterest =
    amount * Math.pow(1 + monthlyRate, duration);
} else {
  totalLoanWithInterest = amount * 1.08;
}

// Always round UP
const roundedTotalLoan = Math.ceil(totalLoanWithInterest);

// Monthly installment
const monthlyInstallment = Math.ceil(
  roundedTotalLoan / duration
);
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

  totalSaving,

  loanStartDate: loanDate,
  paymentStartDate: firstPaymentDate,
  loanEndDate: finalEndDate,

  // Monthly payment
  monthlyInstallment,

  // Total loan after interest
  totalAmount: roundedTotalLoan,

  // Remaining balance starts equal to total amount
  remainingAmount: roundedTotalLoan,
};

    try {
      console.log("Payload:", payload);
console.log("Rounded Total:", roundedTotalLoan);
      await API.post("/loans", payload);
      alert(`ብድሩ ተመዝግቧል። ክፍያ የሚጀምረው ${firstPaymentDate.toDateString()} ሲሆን የሚያበቃው ${finalEndDate.toDateString()} ይሆናል። ✅`);
      setLoan({ employeeId: "", guarantors: [], principalAmount: "", loanType: "normal", durationMonths: 6 });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "የብድር ምዝገባው አልተሳካም ❌");
    }
  };

  // 🛠️ ከሳይድባር አቀማመጥ ጋር ማጣበቂያ ተለዋዋጭ ማርጅን
  const currentLeftMargin = isMobile ? "0px" : (isSidebarOpen ? "0px" : "3px");

  const dynamicContainerStyle = {
    marginLeft: currentLeftMargin,
    width: isMobile ? "100%" : `calc(100% - ${currentLeftMargin})`,
  };

  const deleteLoan = async (loanId) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this loan?"
  );

  if (!confirmDelete) return;

  try {
    await API.delete(`/loans/${loanId}`);

    await loadLoanHistory();
    await fetchData();

    alert("Loan deleted successfully");
  } catch (err) {
    console.error(err);

    alert(
      err.response?.data?.message ||
      "Failed to delete loan"
    );
  }
};



  return (
    <div className="loan-container" style={dynamicContainerStyle}>
      <div className="loan-card">
        <h2 className="loan-title">Create Loan Form/የብድር መጠየቂያ ፎርም</h2>

        <div className="loan-form-grid">
          
          {/* ግራውንድ 1: የብድር ቅጽ (Loan Configuration) */}
          <div className="loan-form-section">
            <div className="loan-input-group">
              <label>Select Employee</label>
              <select
  name="employeeId"
  value={loan.employeeId}
  onChange={handleChange}
  disabled={isMember}
>
  {!isMember ? (
    <>
      <option value="">-- Choose Employee --</option>

      {employees.map((emp) => (
        <option key={emp._id} value={emp._id}>
          {emp.firstName} {emp.lastName}
        </option>
      ))}
    </>
  ) : (
    employees
      .filter(
        (emp) =>
          String(emp.memberId) === String(loggedInMemberId)
      )
      .map((emp) => (
        <option key={emp._id} value={emp._id}>
          {emp.firstName} {emp.lastName}
        </option>
      ))
  )}
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
  style={{
    color: "#000000",
    backgroundColor: "#ffffff",
    WebkitTextFillColor: "#000000",
    caretColor: "#000000"
  }}
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
                <option value="normal">Normal Loan (15%)</option>
                <option value="holiday">Holiday Loan (8%)</option>
              </select>
            </div>
          </div>

          {/* ቀኙ 2: የቀጥታ ስሌት እና የዋስትና ሰሌዳ (Live Summary & Guarantor Panel) */}
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
  {requiredGuarantee > 0 && (
    <div className="guarantor-card">
      <h3 className="section-subtitle">
        Guarantor Verification
      </h3>

      <p className="guarantor-warning-text">
        Loan exceeds employee deposits by:{" "}
        <strong>
          {requiredGuarantee.toLocaleString()} ETB
        </strong>
      </p>

    
      <div
        className="loan-input-group"
        style={{ marginTop: "15px" }}
      >
        <label>Add Guarantor</label>

        <select
          value=""
          onChange={(e) =>
            addGuarantor(e.target.value)
          }
        >
          <option value="">
            -- Choose Guarantor --
          </option>

          {employees
            .filter(
              (e) =>
                String(e._id) !==
                  String(loan.employeeId) &&
                String(e._id) !==
                  String(loggedInMemberId) &&
                !loan.guarantors.includes(e._id)
            )
            .map((emp) => (
              <option
                key={emp._id}
                value={emp._id}
              >
                {emp.memberId} -{" "}
                {emp.firstName}{" "}
                {emp.lastName}
              </option>
            ))}
        </select>
      </div>

      <div className="guarantor-list">
        {loan.guarantors.map((id) => {
          const emp = employees.find(
            (e) => e._id === id
          );

          return (
            <div
              key={id}
              className="guarantor-item"
            >
              <span>
                {emp?.firstName}{" "}
                {emp?.lastName?.charAt(0)}. (
                <strong>
                  {guarantorSavings[
                    id
                  ].toLocaleString()}{" "}
                  ETB
                </strong>
                )
              </span>

              <button
                onClick={() =>
                  removeGuarantor(id)
                }
                className="remove-guarantor-btn"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="guarantor-total-footer">
        Total Guarantor Savings:{" "}
        <strong>
          {totalGuarantorSavings.toLocaleString()}{" "}
          ETB
        </strong>
      </div>
    </div>
  )}
</div>

{/* GUARANTOR STATUS MESSAGE - OUTSIDE loan-summary-section */}
{loan.employeeId && loan.principalAmount && (
  <div
    className={
      requiredGuarantee > 0
        ? totalGuarantorSavings >=
          requiredGuarantee
          ? "badge badge-success"
          : "badge badge-danger"
        : "badge badge-success"
    }
    style={{
      marginTop: "15px",
      marginBottom: "15px",
      padding: "15px",
      textAlign: "center",
      width: "100%",
      display: "block",
    }}
  >
    {requiredGuarantee > 0 ? (
      totalGuarantorSavings >=
      requiredGuarantee ? (
        <>
          ✅ Enough guarantor deposits
          selected.
        </>
      ) : (
        <>
          Need at least{" "}
          <strong>
            {(
              requiredGuarantee -
              totalGuarantorSavings
            ).toLocaleString()}{" "}
            ETB
          </strong>{" "}
          more
        </>
      )
    ) : (
      <>
        🎉 No guarantor required.
        Employee deposits cover this
        loan amount.
      </>
    )}
  </div>
)}

          {/* ከታች 3: ስህተት ማሳያ እና ማስገቢያ ቁልፍ (Footer Actions) */}
       <div className="loan-footer-actions">
  {error && <div className="info-box danger-box">{error}</div>}

  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
    <button
      onClick={submit}
      className="loan-btn"
      disabled={
        requiredGuarantee > 0 &&
        totalGuarantorSavings < requiredGuarantee
      }
    >
      Create Loan Account
    </button>

  {!isMember && (
  <button
    className="loan-btn"
    style={{ background: "#1976d2" }}
    onClick={() => {
      setShowHistory(!showHistory);

      if (!showHistory) {
        loadLoanHistory();
      }
    }}
  >
    {showHistory
      ? "Hide History"
      : "Loan History"}
  </button>
)}
  </div>
</div>

        </div>
        </div>

      {/* =========================
          LOAN HISTORY SECTION
      ========================== */}
{/* =========================
    LOAN HISTORY SECTION
========================== */}
{showHistory && (
  <div className="loan-history-card">
    <h2 className="loan-history-title">
      Loan History
    </h2>

    <table className="loan-history-table">
      <thead>
        <tr>
          <th>Member</th>
          <th>Amount</th>
          <th>Type</th>
          <th>Status</th>
          <th>Remaining</th>
          <th>Created</th>
          <th>Update Status</th>
          <th>Delete</th>
        </tr>
      </thead>

      <tbody>
        {historyLoans.length === 0 ? (
          <tr>
            <td
              colSpan="7"
              style={{
                textAlign: "center",
                padding: "30px",
              }}
            >
              No loan records found
            </td>
          </tr>
        ) : (
          historyLoans.map((loanItem) => {
            const employeeId =
              loanItem.employeeId?._id ||
              loanItem.employeeId;

            const employee = employees.find(
              (e) =>
                String(e._id) === String(employeeId)
            );

            

            const paymentStarted =
              Number(loanItem.remainingAmount || 0) <
              Number(loanItem.totalAmount || 0);

            return (
              <tr key={loanItem._id}>
                <td>
                  {employee ? (
                    <>
                      <span className="member-name">
                        {employee.firstName}{" "}
                        {employee.lastName}
                      </span>

                      <span className="member-id">
                        ID: {employee.memberId}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="member-name">
                        Unknown Member
                      </span>

                      <span className="member-id">
                        Employee record not found
                      </span>
                    </>
                  )}
                </td>

                <td>
                  {Number(
                    loanItem.principalAmount || 0
                  ).toLocaleString()}{" "}
                  ETB
                </td>

                <td>
                  {loanItem.loanType}
                </td>

                <td>
                  <span
                    className={`status-${loanItem.status}`}
                  >
                    {loanItem.status}
                  </span>
                </td>

                <td>
                  {Number(
                    loanItem.remainingAmount || 0
                  ).toLocaleString()}{" "}
                  ETB
                </td>

                <td>
                  {new Date(
                    loanItem.createdAt
                  ).toLocaleDateString()}
                </td>

                
<td>
  {loanItem.status === "completed" ? (
    <span className="payment-completed">
      The payment has been completed
    </span>
  ) : paymentStarted ? (
    <span className="payment-started">
      Payment Started
    </span>
  ) : (
    <select
      className="history-select"
      value={loanItem.status}
      onChange={(e) =>
        updateLoanStatus(
          loanItem._id,
          e.target.value
        )
      }
    >
      <option value="pending">Pending</option>
      <option value="approved">Approved</option>
      <option value="rejected">Rejected</option>
    </select>
  )}
</td>

{/* DELETE COLUMN */}
{/* DELETE COLUMN */}
<td>
  {loanItem.status === "completed" ? (
    // ✅ Always allow delete if completed
    <button
      className="delete-btn"
      onClick={() => deleteLoan(loanItem._id)}
    >
      Delete
    </button>
  ) : !paymentStarted ? (
    // ✅ Allow delete if payment has NOT started
    <button
      className="delete-btn"
      onClick={() => deleteLoan(loanItem._id)}
    >
      Delete
    </button>
  ) : (
    // ❌ Block delete if payment started and not completed
    <button
      className="delete-btn disabled-delete-btn"
      disabled
    >
      Cannot Delete (Payment Started)
    </button>
  )}
</td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
)}
    </div>
  );
}