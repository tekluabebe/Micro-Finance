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
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentMonth, setPaymentMonth] = useState("");
  const [paidMonths, setPaidMonths] = useState([]);
const [memberName, setMemberName] = useState("");
const [multiplePayment, setMultiplePayment] = useState(false);
const [selectedMonths, setSelectedMonths] = useState([]);

  const [payment, setPayment] = useState({
    employeeId: "",
    loanId: "",
    amountPaid: "",
    penalty: 0,
  });

  const [minimumPayment, setMinimumPayment] = useState(0);
  const [monthlyInterest, setMonthlyInterest] = useState(0);
  const [monthlyPrincipal, setMonthlyPrincipal] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  const PENALTY_PER_MONTH = 50;
  const GRACE_PERIOD = 2;

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
const loadPaidMonths = async (loanId, employeeId) => {

  try {


    const res = await API.get(
      `/loan-payments?loanId=${loanId}&employeeId=${employeeId}`
    );


    const months = res.data
      .filter(
        p => 
        String(p.loanId) === String(loanId)
      )
      .map(
        p => p.monthYear
      );


    setPaidMonths(months);


  } catch(err){

    console.error(
      "Load payment history error",
      err
    );


    setPaidMonths([]);

  }

};

  const handleEmployeeChange = (e) => {
  setErrorMessage("");
  setPayment({
    ...payment,
    employeeId: e.target.value,
    amountPaid: "",
    penalty: 0,
  });

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


  setPayment(prev => ({
    ...prev,
    loanId: loan._id
  }));


  calculateDueAmount(loan);


  // Load paid months
  loadPaidMonths(
    loan._id,
    payment.employeeId
  );


  // Get member name
  const employee = employees.find(
    e => e._id === payment.employeeId
  );


  if(employee){

    setMemberName(
      `${employee.firstName} ${employee.lastName}`
    );

  }


}
      else {
        resetSelection();
      }
    }
  }, [loanType, payment.employeeId, loans]);

  // ==========================================================================
  // ✨ የተስተካከለ የ Grace Period እና የወርሃዊ ክፍያ ስሌት ሎጂክ
  // ==========================================================================
const calculateDueAmount = (loan) => {
  const loanStartDate = new Date(loan.createdAt);
  const today = new Date();

  let diffInMonths =
    (today.getFullYear() - loanStartDate.getFullYear()) * 12 +
    (today.getMonth() - loanStartDate.getMonth());
    const GRACE_PERIOD = 2;
    const effectiveMonths = Math.max(diffInMonths - GRACE_PERIOD, 0);
    
  setMissingMonths(effectiveMonths);

  const principal = Number(loan.principalAmount);
  const duration = Number(loan.durationMonths);

  let totalAmount = 0;

  if (loan.loanType === "normal") {
    const monthlyRate = 0.15 / 12;

    totalAmount =
      principal *
      Math.pow(
        1 + monthlyRate,
        duration
      );
  } else {
    totalAmount = principal * 1.08;
  }

  const totalInterest =
    totalAmount - principal;

  const principalPerMonth =
    principal / duration;

  const interestPerMonth =
    totalInterest / duration;

  const monthlyPay =
    principalPerMonth +
    interestPerMonth;

  setMonthlyPrincipal(
    Math.round(principalPerMonth)
  );

  setMonthlyInterest(
    Math.round(interestPerMonth)
  );

  setMonthlyPayment(
    Math.round(monthlyPay)
  );

  const currentPenalty =
    effectiveMonths * PENALTY_PER_MONTH;

  setPayment((prev) => ({
    ...prev,
    amountPaid: Math.round(monthlyPay),
    penalty: currentPenalty,
  }));

  setMinimumPayment(
    Math.round(monthlyPay)
  );
};

  const handleChange = (e) => {
    setPayment({ ...payment, [e.target.name]: e.target.value });
  };

  // ==========================================================================
  // 💾 መረጃን ወደ ቤክኤንድ መላኪያ ሎጂክ
  // ==========================================================================
const submit = async () => {
  if (!selectedLoan) {
    alert("❌ Loan not found");
    return;
  }

  const inputAmount = Number(payment.amountPaid);
  const penalty = Number(payment.penalty);
  const remainingBalance = Number(selectedLoan.remainingAmount);


  // 1. Check payment amount
  if (inputAmount > remainingBalance) {
    alert("❌ የገባው ክፍያ ከቀሪ ሂሳብ ይበልጣል!");
    return;
  }


  // 2. Calculate Principal and Interest
  let interestPaid = 0;
  let principalPaid = 0;


  // FULL LOAN PAYMENT
  if (inputAmount >= Number(selectedLoan.totalAmount)) {

    // Total interest = Total repayment - Original principal
    interestPaid =
      Number(selectedLoan.totalAmount) -
      Number(selectedLoan.principalAmount);


    // Principal = original loan amount
    principalPaid =
      Number(selectedLoan.principalAmount);


  } 
  // NORMAL MONTHLY PAYMENT
  else {

    const numberOfMonths = Math.max(
      1,
      Math.floor(inputAmount / monthlyPayment)
    );


    interestPaid =
      numberOfMonths * monthlyInterest;


    principalPaid =
      inputAmount - interestPaid;

  }


  const totalPaid = inputAmount + penalty;


let monthsToPay=[];
const isMultiple = monthsToPay.length > 1;


if(multiplePayment){


if(selectedMonths.length === 0){

setErrorMessage(
"❌ Please select months for paying."
);

return;

}


monthsToPay = selectedMonths;


}
else{


if(!paymentMonth){

setErrorMessage(
"❌ Please select payment month."
);

return;

}


monthsToPay=[paymentMonth];


}


const currentMonthYear = paymentMonth;


  // 3. Payload
  const payload = {
    employeeId: payment.employeeId,
    loanId: payment.loanId,
    monthYear: currentMonthYear,

    // Example:
    // Principal 300
    // Interest 23
    // Total 323
    amountPaid: Math.round(principalPaid),

    interestPaid: Math.round(interestPaid),

    penalty: Math.round(penalty),

    totalPaid: Math.round(totalPaid)
  };


  console.log("Payment Payload:", payload);

  try {
    // 4. መላክ
    let existingPayment = null;
    try {
      const checkRes = await API.get(`/loan-payments/check?loanId=${payment.loanId}&month=${currentMonthYear}`);
      existingPayment = checkRes.data;
    } catch (checkErr) {
      existingPayment = { exists: false };
    }

  if (existingPayment.exists) {

  setErrorMessage(
    `❌ You already paid for ${currentMonthYear}.`
  );

  return;
}

setErrorMessage("");

for(const month of monthsToPay){


const checkRes =
await API.get(
`/loan-payments/check?loanId=${payment.loanId}&month=${month}`
);


if(checkRes.data.exists){


setErrorMessage(
`❌ You already paid for ${month}`
);


return;


}


const payload={

employeeId: payment.employeeId,

loanId: payment.loanId,

monthYear: month,


amountPaid:
Math.round(principalPaid),

interestPaid:
Math.round(interestPaid),

penalty:
Math.round(penalty),

totalPaid:
Math.round(totalPaid)

};



await API.post(
"/loan-payments",
payload
);


}


const isMultiple = monthsToPay.length > 1;

if (isMultiple) {
  alert("Multiple month payment saved successfully ✅");
} else {
  alert(`Your payment for ${monthsToPay[0]} is successful ✅`);
}

    fetchData();
    resetSelection();
    setPayment({ employeeId: "", loanId: "", amountPaid: "", penalty: 0 });

  } catch (err) {
    // እዚህ ላይ Backend የሚልከውን የስህተት መልእክት በግልጽ እናያለን
    console.error("Backend Error Response:", err.response?.data);
    alert("ክፍያውን መዝግቦ መያዝ አልተቻለም። እባክዎ የBackend Console ይመልከቱ። ❌");
  }
};
  // 🛠️ ከሳይድባር አቀማመጥ ጋር ማጣበቂያ ተለዋዋጭ ማርጅን
  const currentLeftMargin = isMobile ? "0px" : (isSidebarOpen ? "0px" : "65px");

  const dynamicContainerStyle = {
    marginLeft: currentLeftMargin,
    width: isMobile ? "100%" : `calc(100% - ${currentLeftMargin})`,
  };

const getAvailableMonths = (loanCreatedAt) => {
  if (!loanCreatedAt) return [];

  const startDate = new Date(loanCreatedAt);

  // 👉 Skip 2 months (June → August)
  const firstPayDate = new Date(startDate);
  firstPayDate.setMonth(firstPayDate.getMonth() + 2);

  const months = [];

  let current = new Date(firstPayDate);

  for (let i = 0; i < 24; i++) {
    const monthName = current.toLocaleString("default", {
      month: "long",
    });

    const year = current.getFullYear();

    months.push(`${monthName} ${year}`);

    current.setMonth(current.getMonth() + 1);
  }

  return months;
};

 return (
    <div className="loan-payment-container" style={dynamicContainerStyle}>
      <div className="loan-payment-card">
        <h2 className="loan-payment-title">Loan Repayment Portal/የብድር መክፈያ ፎርም</h2>
          
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
                <select value={loanType} onChange={(e) => {
  setErrorMessage("");
  setLoanType(e.target.value);
}}>
                  <option value="">-- Select Loan Type --</option>
                  <option value="normal">Normal Loan (15%)</option>
                  <option value="holiday">Holiday Loan (8%)</option>
                </select>
              </div>
            )}
          </div>

          {/* ቀኙ 2፦ የብድር ሁኔታ ማሳያ ሰሌዳ (የተመረጠ ብድር ካለ ብቻ የሚታይ) */}
          {selectedLoan ? (
            <div className="loan-status-panel">
              {paidMonths.length > 0 && (

<div
style={{
  marginBottom:"15px",
  padding:"12px",
  background:"#eff6ff",
  border:"1px solid #bfdbfe",
  borderRadius:"8px",
  color:"#1e3a8a",
  fontWeight:"600"
}}
>
 {memberName}   የከፈለው የ

<br/>

{paidMonths.join(", ")}ን ነው።

</div>

)}
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
    <label>Principal Amount</label>
<p>
  {selectedLoan.principalAmount} ETB
</p>
</div>

  <div className="status-item">
    <label>Total Amount</label>
    <p>
  {Math.round(selectedLoan.totalAmount)} ETB
     </p>
  </div>

  <div className="status-item">
  <label>Monthly Principal</label>
  <p>{monthlyPrincipal} ETB</p>
</div>

<div className="status-item">
  <label>Monthly Interest</label>
  <p>{monthlyInterest} ETB</p>
</div>
     <div className="status-item">
  <label>Monthly Payment</label>
  <p>{monthlyPayment} ETB</p>
</div>
  <div className="status-item">
    <label>Remaining Balance</label>
    <p style={{ color: "#ef4444" }}>
      {selectedLoan.remainingAmount} ETB
    </p>
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
       <label>
<input
type="checkbox"
checked={multiplePayment}
onChange={(e)=>{

setMultiplePayment(e.target.checked);

setPaymentMonth("");

setSelectedMonths([]);

setErrorMessage("");

}}
/>

&nbsp; Pay Multiple Months
</label>

</div>


{
!multiplePayment && (

<div className="loan-input-group">

<label>Select Payment Month</label>


<select

value={paymentMonth}

onChange={(e)=>{

setPaymentMonth(e.target.value);

setErrorMessage("");

}}

>




{
  
getAvailableMonths(selectedLoan?.createdAt || "").map(month => (

<option
key={month}
value={month}
>

{month}

</option>

))
}


</select>


</div>

)
}



{
multiplePayment && (

<div className="loan-input-group">

<label>
Select Months For Payment
</label>


<div
style={{
display:"grid",
gridTemplateColumns:"repeat(3,1fr)",
gap:"10px"
}}
>


{
getAvailableMonths(selectedLoan?.createdAt).map(month => (

<label key={month}>


<input

type="checkbox"

checked={
selectedMonths.includes(month)
}


onChange={(e)=>{


if(e.target.checked){

setSelectedMonths([
...selectedMonths,
month
]);

}

else{


setSelectedMonths(

selectedMonths.filter(
m=>m!==month
)

);

}


}}

></input>


{month}


</label>


))

}


</div>


</div>

)

}

   

  </div>
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
{errorMessage && (
  <div
    style={{
      color: "#dc2626",
      background: "#fef2f2",
      border: "1px solid #fecaca",
      padding: "12px",
      borderRadius: "8px",
      marginTop: "15px",
      textAlign: "center",
      fontWeight: "600",
    }}
  >
    {errorMessage}
  </div>
)}
        </div> {/* 💡 የ loan-form-grid መዝጊያ */}
      </div>
    
  );
}