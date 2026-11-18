import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useAppContext } from "./context";
import { translate } from "../utils/translations";
import "./Loans.css";

const addMonthsClamped = (date, months) => {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
};

// 💡 ሳይድባሩ ሲዘጋና ሲከፈት ገጹ አብሮ እንዲለጠጥ ፕሮፕስ ተቀብለናል
export default function Loans({ isSidebarOpen = true }) {
  const { language } = useAppContext();
  const amharic = language === "Amharic";
  const tr = (text) => amharic ? ({
    "Loan status updated successfully": "የብድር ሁኔታ በተሳካ ሁኔታ ተዘምኗል",
    "Failed to update status": "ሁኔታውን ማዘመን አልተሳካም",
    "Are you sure you want to delete this loan?": "ይህን ብድር ማጥፋት እርግጠኛ ነዎት?",
    "Loan deleted successfully": "ብድሩ በተሳካ ሁኔታ ተሰርዟል",
    "Failed to delete loan": "ብድሩን መሰረዝ አልተሳካም",
    "Select Employee": "ሰራተኛ ይምረጡ",
    "-- Choose Employee --": "-- ሰራተኛ ይምረጡ --",
    "Employee Deposit:": "የሰራተኛ ቁጠባ:",
    "Loan Amount": "የብድር መጠን",
    "Enter amount (ETB)...": "መጠን ያስገቡ (ብር)...",
    "Duration (Months)": "የጊዜ ቆይታ (ወራት)",
    "Month": "ወር",
    "Months": "ወራት",
    "Loan Category": "የብድር ዓይነት",
    "Normal Loan (15%)": "መደበኛ ብድር (15%)",
    "Holiday Loan (8%)": "የበዓል ብድር (8%)",
    "Monthly Payment:": "ወርሃዊ ክፍያ:",
    "Loan Maturity Date:": "የብድር ማብቂያ ቀን:",
    "Enter an amount and employee to view live calculation summary.": "የቀጥታ ስሌቱን ለማየት መጠን እና ሰራተኛ ያስገቡ።",
    "Guarantor Verification": "የዋስ ማረጋገጫ",
    "Guarantor type": "የዋስ አይነት",
    "Member guarantor": "አባል ዋስ",
    "External guarantor": "ውጭ ዋስ",
    "Member savings guarantors": "ቁጠባ የሚያረጋግጡ አባል ዋሶች",
    "Full name": "ሙሉ ስም",
    "Phone number": "ስልክ ቁጥር",
    "Digital ID number": "ዲጂታል መታወቂያ ቁጥር",
    "Enter guarantor full name": "የዋሱን ሙሉ ስም ያስገቡ",
    "Enter guarantor phone number": "የዋሱን ስልክ ቁጥር ያስገቡ",
    "Enter guarantor digital ID number": "የዋሱን ዲጂታል መታወቂያ ቁጥር ያስገቡ",
    "Add External Guarantor": "ውጭ ዋስ ጨምር",
    "Remove External Guarantor": "ውጭ ዋስ አስወግድ",
    "External guarantors": "ውጭ ዋሶች",
    "Please add at least one complete external guarantor.": "እባክዎ ቢያንስ አንድ ሙሉ የውጭ ዋስ መረጃ ያስገቡ።",
    "Add External Guarantor": "ውጭ ዋስ ጨምር",
    "Remove External Guarantor": "ውጭ ዋስ አስወግድ",
    "Please add at least one complete external guarantor.": "እባክዎ ቢያንስ አንድ ሙሉ የውጭ ዋስ መረጃ ያስገቡ።",
    "Please fill all external guarantor details.": "እባክዎ የውጭ ዋሱን ሁሉንም መረጃ ይሙሉ።",
    "Please add member guarantors with sufficient savings.": "እባክዎ በቂ ቁጠባ ያላቸውን አባል ዋሶች ያክሉ።",
    "You already have an unfinished loan of this type. Pay it off before applying for another one.": "የዚህ ዓይነት ያልተጠናቀቀ ብድር አለዎት። ሌላ ከማመልከትዎ በፊት ይህን ብድር ይጨርሱ።",
    "External guarantor phone must be +251 followed by 9 digits starting with 9.": "የውጭ ዋሱ ስልክ +251 ተከትሎ በ9 የሚጀምሩ 9 ቁጥሮች መሆን አለበት።",
    "External guarantor digital ID must be exactly 16 digits.": "የውጭ ዋሱ ዲጂታል መታወቂያ በትክክል 16 ቁጥሮች መሆን አለበት።",
    "The loan server has not been updated to accept external guarantors. Please redeploy the server and try again.": "የብድር ሰርቨሩ ውጭ ዋሶችን እንዲቀበል አልተዘመነም። እባክዎ ሰርቨሩን እንደገና ያስጀምሩና ይሞክሩ።",
    "External guarantor details complete.": "የውጭ ዋስ መረጃ ተሟልቷል።",
    "Loan exceeds employee deposits by:": "ብድሩ የሰራተኛውን ቁጠባ የሚበልጠው:",
    "Add Guarantor": "ዋስ ያክሉ",
    "-- Choose Guarantor --": "-- ዋስ ይምረጡ --",
    "Remove": "አስወግድ",
    "Total Guarantor Savings:": "የዋሶች ጠቅላላ ቁጠባ:",
    "✅ Enough guarantor deposits selected.": "✅ በቂ የዋስ ቁጠባ ተመርጧል።",
    "more": "ተጨማሪ",
    "🎉 No guarantor required. Employee deposits cover this loan amount.": "🎉 ዋስ አያስፈልግም። የሰራተኛው ቁጠባ ይህን የብድር መጠን ይሸፍናል።",
    "Create Loan Account": "የብድር ሂሳብ ፍጠር",
    "Hide History": "ታሪኩን ደብቅ",
    "Loan History": "የብድር ታሪክ",
    "Member": "አባል",
    "Amount": "መጠን",
    "Type": "ዓይነት",
    "Status": "ሁኔታ",
    "Remaining": "ቀሪ",
    "Created": "የተፈጠረበት ቀን",
    "Update Status": "ሁኔታ አዘምን",
    "Delete": "ሰርዝ",
    "No loan records found": "ምንም የብድር መዝገብ አልተገኘም",
    "ID:": "መለያ:",
    "Unknown Member": "ያልታወቀ አባል",
    "Employee record not found": "የሰራተኛ መዝገብ አልተገኘም",
    "completed": "ተጠናቋል",
    "The payment has been completed": "ክፍያው ተጠናቋል",
    "Payment Started": "ክፍያ ተጀምሯል",
    "Pending": "በመጠባበቅ ላይ",
    "Approved": "ጸድቋል",
    "Rejected": "ውድቅ ተደርጓል",
    "pending": "በመጠባበቅ ላይ",
    "approved": "ጸድቋል",
    "rejected": "ውድቅ ተደርጓል",
    "normal": "መደበኛ",
    "holiday": "የበዓል",
    "Cannot Delete (Payment Started)": "መሰረዝ አይቻልም (ክፍያ ተጀምሯል)",
  }[text] || text) : translate(language, text);
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
  const [guarantorType, setGuarantorType] = useState("member");
  const [externalGuarantors, setExternalGuarantors] = useState([]);
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
    
    // 🔥 Make sure employees have totalSaving field
    console.log("Employees loaded:", emp.data);
    
    setEmployees(emp.data || []);
    setDeposits(dep.data || []);
    setLoans(loanRes.data || []);
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
      // 🔥 Use employee's totalSaving field directly
      const saving = employee.totalSaving || calculateSaving(employee._id);

      console.log("Logged in employee:", employee);
      console.log("Employee totalSaving:", employee.totalSaving);
      console.log("Calculated saving:", saving);

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
  if (!window.confirm(`Update this loan status to "${status}"?\n\nOK: Update\nCancel: Cancel`)) {
    return;
  }

  try {
    console.log("Updating:", `/loans/${loanId}/status`);

    const res = await API.put(
      `/loans/${loanId}/status`,
      { status }
    );

    console.log(res.data);

    loadLoanHistory();
    fetchData();

    alert(tr("Loan status updated successfully"));
  } catch (err) {
    console.error("ERROR:", err.response?.data);
    console.error("STATUS:", err.response?.status);
    console.error("URL:", err.config?.url);

    alert(
      err.response?.data?.message ||
      tr("Failed to update status")
    );
  }
};

 const calculateSaving = (employeeId) => {
  // 🔥 First, find the employee and use their totalSaving field
  const employee = employees.find(emp => emp._id === employeeId);
  
  if (employee && employee.totalSaving > 0) {
    return employee.totalSaving;
  }

  // Fallback: Calculate from deposits (for non-restored members)
  return deposits
    .filter((d) => String(d.employeeId?._id || d.employeeId) === employeeId)
    .reduce((sum, d) => sum + (Number(d.normalSaving) || 0) + (Number(d.voluntarySaving) || 0), 0);
};

const handleChange = (e) => {
  const { name, value } = e.target;
  setError("");

  if (name === "employeeId") {
    // 🔥 Get the selected employee and pass it to calculateSaving
    const selectedEmployee = employees.find(emp => emp._id === value);
    
    // Calculate saving using the employee's totalSaving field
    const saving = selectedEmployee?.totalSaving || calculateSaving(value);
    
    console.log("Selected Employee:", selectedEmployee);
    console.log("Total Saving:", saving);
    
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

  // 🔥 Use guarantor's totalSaving field
  const guarantor = employees.find(emp => emp._id === selectedId);
  const saving = guarantor?.totalSaving || calculateSaving(selectedId);
  
  console.log("Guarantor:", guarantor);
  console.log("Guarantor saving:", saving);
  
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

  const addExternalGuarantor = () => {
    setExternalGuarantors((current) => [
      ...current,
      { fullName: "", phone: "+251", digitalId: "" },
    ]);
  };

  const updateExternalGuarantor = (index, field, value) => {
    if (field === "phone") {
      const digits = value.replace(/\D/g, "");
      const localNumber = digits.startsWith("251") ? digits.slice(3) : digits;
      value = `+251${localNumber.slice(0, 9)}`;
    } else if (field === "digitalId") {
      value = value.replace(/\D/g, "").slice(0, 16);
    }

    setExternalGuarantors((current) =>
      current.map((guarantor, itemIndex) =>
        itemIndex === index ? { ...guarantor, [field]: value } : guarantor
      )
    );
  };

  const removeExternalGuarantor = (index) => {
    setExternalGuarantors((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const totalGuarantorSavings = Object.values(guarantorSavings).reduce((a, b) => a + b, 0);
  const hasCompleteExternalGuarantor =
    externalGuarantors.length > 0 &&
    externalGuarantors.every(
      (guarantor) =>
        guarantor.fullName.trim() &&
        guarantor.phone.trim() &&
        guarantor.digitalId.trim()
    );
  const externalGuarantorComplete =
    externalGuarantors.length > 0 && hasCompleteExternalGuarantor;
  const hasUnfinishedSameTypeLoan = loans.some((loanItem) => {
    const employeeId = loanItem.employeeId?._id || loanItem.employeeId;
    return (
      String(employeeId) === String(loan.employeeId) &&
      loanItem.loanType === loan.loanType &&
      !["rejected", "completed"].includes(loanItem.status) &&
      Number(loanItem.remainingAmount || 0) > 0
    );
  });
  const guarantorRequired = requiredGuarantee > 0;
  const requiredGuarantorSavings = requiredGuarantee;
  const memberGuarantorComplete =
    loan.guarantors.length > 0 &&
    totalGuarantorSavings >= requiredGuarantorSavings;
  const guarantorDetailsComplete =
    !guarantorRequired ||
    (guarantorType === "external"
      ? externalGuarantorComplete &&
        externalGuarantors.every(
          (guarantor) =>
            /^\+2519\d{8}$/.test(guarantor.phone) &&
            /^\d{16}$/.test(guarantor.digitalId)
        )
      : memberGuarantorComplete);

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

    const endDate = addMonthsClamped(new Date(), duration);

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
    if (hasUnfinishedSameTypeLoan) {
      setError(tr("You already have an unfinished loan of this type. Pay it off before applying for another one."));
      return;
    }

    if (!loan.employeeId || !amount || !duration) {
      setError("እባክዎ ሁሉንም አስፈላጊ መረጃዎች ይሙሉ ❌");
      return;
    }

    if (guarantorRequired && guarantorType === "external") {
      if (externalGuarantors.length === 0) {
        setError(tr("Please add at least one complete external guarantor."));
        return;
      }

      if (!hasCompleteExternalGuarantor) {
        setError(tr("Please fill all external guarantor details."));
        return;
      }

      if (externalGuarantors.some((guarantor) => !/^\+2519\d{8}$/.test(guarantor.phone))) {
        setError(tr("External guarantor phone must be +251 followed by 9 digits starting with 9."));
        return;
      }

      if (externalGuarantors.some((guarantor) => !/^\d{16}$/.test(guarantor.digitalId))) {
        setError(tr("External guarantor digital ID must be exactly 16 digits."));
        return;
      }
    } else if (guarantorRequired && !memberGuarantorComplete) {
      setError(tr("Please add member guarantors with sufficient savings."));
      return;
    }

    if (amount > maxAllowed || amount > absoluteLimit) {
      setError("የብድር መጠኑ ከተፈቀደው በላይ ነው! ❌");
      return;
    }

    const loanDate = new Date();
    const firstPaymentDate = addMonthsClamped(loanDate, 1);
    const finalEndDate = addMonthsClamped(loanDate, duration);

const payload = {
  ...loan,
  externalGuarantors:
    guarantorRequired && guarantorType === "external"
      ? externalGuarantors.map((guarantor) => ({
          fullName: guarantor.fullName.trim(),
          phone: guarantor.phone.trim(),
          digitalId: guarantor.digitalId.trim(),
        }))
      : [],

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

  if (!window.confirm("ብድሩን ማስቀመጥ ይፈልጋሉ?\n\nOK: ብድሩን ያስቀምጡ\nCancel: ወደ ቅጹ ተመልሰው መረጃውን ያስተካክሉ")) {
    return;
  }

  try {
    await API.post("/loans", payload);
    alert(`ብድሩ ተመዝግቧል። ክፍያ የሚጀምረው ${firstPaymentDate.toDateString()} ሲሆን የሚያበቃው ${finalEndDate.toDateString()} ይሆናል። ✅`);
    setLoan({ employeeId: "", guarantors: [], principalAmount: "", loanType: "normal", durationMonths: 6 });
    setExternalGuarantors([]);
    setGuarantorType("member");
    fetchData();
    } catch (err) {
      const serverMessage = err.response?.data?.message || "";
      const serverStillRequiresMemberGuarantor =
        guarantorRequired &&
        guarantorType === "external" &&
        /guarantor.*required|ዋስ.*(ግዴታ|ያስፈልጋል)/i.test(serverMessage);

      setError(
        serverStillRequiresMemberGuarantor
          ? tr("The loan server has not been updated to accept external guarantors. Please redeploy the server and try again.")
          : serverMessage || "የብድር ምዝገባው አልተሳካም ❌"
      );
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
    tr("Are you sure you want to delete this loan?")
  );

  if (!confirmDelete) return;

  try {
    await API.delete(`/loans/${loanId}`);

    await loadLoanHistory();
    await fetchData();

    alert(tr("Loan deleted successfully"));
  } catch (err) {
    console.error(err);

    alert(
      err.response?.data?.message ||
      tr("Failed to delete loan")
    );
  }
};



  return (
    <div className="loan-container" style={dynamicContainerStyle}>
      <div className="loan-card">
        <h2 className="loan-title">{amharic ? "የብድር መጠየቂያ ቅጽ" : "Create Loan Form"}</h2>

        <div className="loan-form-grid">
          
          {/* ግራውንድ 1: የብድር ቅጽ (Loan Configuration) */}
          <div className="loan-form-section">
            <div className="loan-input-group">
              <label>{tr("Select Employee")}</label>
              <select
  name="employeeId"
  value={loan.employeeId}
  onChange={handleChange}
  disabled={isMember}
>
  {!isMember ? (
    <>
      <option value="">{tr("-- Choose Employee --")}</option>

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
                {tr("Employee Deposit:")} <strong>{totalSaving.toLocaleString()} ETB</strong>
              </div>
            )}

            <div className="loan-input-group">
              <label>{tr("Loan Amount")}</label>
             <input
  type="number"
  name="principalAmount"
  placeholder={tr("Enter amount (ETB)...")}
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
              <label>{tr("Duration (Months)")}</label>
              <select name="durationMonths" value={loan.durationMonths} onChange={handleChange}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                  <option key={m} value={m}>{m} {tr(m > 1 ? "Months" : "Month")}</option>
                ))}
              </select>
            </div>

            <div className="loan-input-group">
              <label>{tr("Loan Category")}</label>
              <select name="loanType" value={loan.loanType} onChange={handleChange}>
                <option value="normal">{tr("Normal Loan (15%)")}</option>
                <option value="holiday">{tr("Holiday Loan (8%)")}</option>
              </select>
            </div>
          </div>

          {/* ቀኙ 2: የቀጥታ ስሌት እና የዋስትና ሰሌዳ (Live Summary & Guarantor Panel) */}
         {/* ቀኙ 2: የቀጥታ ስሌት እና የዋስትና ሰሌዳ (Live Summary & Guarantor Panel) */}
<div className="loan-summary-section">
  {monthlyPayment > 0 ? (
    <div className="info-box summary-card">
      <div className="summary-row">
        <span>{tr("Monthly Payment:")}</span>
        <strong>{monthlyPayment.toLocaleString()} ETB</strong>
      </div>

      <div className="summary-row">
        <span>{tr("Loan Maturity Date:")}</span>
        <strong>{loanEndDate}</strong>
      </div>
    </div>
  ) : (
    <div className="info-box empty-summary">
      ℹ️ {tr("Enter an amount and employee to view live calculation summary.")}
    </div>
  )}

  {/* GUARANTOR SECTION */}
  {guarantorRequired && (
    <div className="guarantor-card">
      <h3 className="section-subtitle">
        {tr("Guarantor Verification")}
      </h3>

      <p className="guarantor-warning-text">
        <>
          {tr("Loan exceeds employee deposits by:")}{" "}
          <strong>{requiredGuarantee.toLocaleString()} ETB</strong>
        </>
      </p>

    
      <div
        className="loan-input-group"
        style={{ marginTop: "15px" }}
      >
        <label>{tr("Guarantor type")}</label>
        <select
          value={guarantorType}
          onChange={(event) => {
            setGuarantorType(event.target.value);
            setError("");
          }}
        >
          <option value="member">{tr("Member guarantor")}</option>
          <option value="external">{tr("External guarantor")}</option>
        </select>

        {guarantorType === "external" && (
          <div className="external-guarantor-fields">
            <label>{tr("External guarantors")}</label>
            {externalGuarantors.map((guarantor, index) => (
              <div className="external-guarantor-item" key={index}>
                <label>{tr("Full name")}</label>
                <input
                  type="text"
                  value={guarantor.fullName}
                  onChange={(event) =>
                    updateExternalGuarantor(index, "fullName", event.target.value)
                  }
                  placeholder={tr("Enter guarantor full name")}
                  required
                />

                <label>{tr("Phone number")}</label>
                <input
                  type="tel"
                  value={guarantor.phone}
                  onChange={(event) =>
                    updateExternalGuarantor(index, "phone", event.target.value)
                  }
                  placeholder="+2519XXXXXXXX"
                  maxLength={13}
                  pattern="\+2519[0-9]{8}"
                  title={tr("External guarantor phone must be +251 followed by 9 digits starting with 9.")}
                  required
                />

                <label>{tr("Digital ID number")}</label>
                <input
                  type="text"
                  value={guarantor.digitalId}
                  onChange={(event) =>
                    updateExternalGuarantor(index, "digitalId", event.target.value)
                  }
                  placeholder={tr("Enter guarantor digital ID number")}
                  inputMode="numeric"
                  maxLength={16}
                  pattern="[0-9]{16}"
                  title={tr("External guarantor digital ID must be exactly 16 digits.")}
                  required
                />

                <button
                  type="button"
                  className="remove-guarantor-btn"
                  onClick={() => removeExternalGuarantor(index)}
                >
                  {tr("Remove External Guarantor")}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="loan-btn add-external-guarantor-btn"
              onClick={addExternalGuarantor}
            >
              {tr("Add External Guarantor")}
            </button>
          </div>
        )}

        {guarantorType === "member" && (
          <>
            <label>{tr("Member savings guarantors")}</label>

            <select
              value=""
              onChange={(e) => addGuarantor(e.target.value)}
            >
              <option value="">
                {tr("-- Choose Guarantor --")}
              </option>

              {employees
                .filter(
                  (e) =>
                    String(e._id) !== String(loan.employeeId) &&
                    String(e._id) !== String(loggedInMemberId) &&
                    !loan.guarantors.includes(e._id)
                )
                .map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.memberId} - {emp.firstName} {emp.lastName}
                  </option>
                ))}
            </select>
          </>
        )}
      </div>

      {guarantorType === "member" && (
        <>
          <div className="guarantor-list">
            {loan.guarantors.map((id) => {
              const emp = employees.find((e) => e._id === id);

              return (
                <div key={id} className="guarantor-item">
                  <span>
                    {emp?.firstName} {emp?.lastName?.charAt(0)}. (
                    <strong>
                      {(guarantorSavings[id] || 0).toLocaleString()} ETB
                    </strong>
                    )
                  </span>

                  <button
                    onClick={() => removeGuarantor(id)}
                    className="remove-guarantor-btn"
                  >
                    {tr("Remove")}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="guarantor-total-footer">
            {tr("Total Guarantor Savings:")}{" "}
            <strong>{totalGuarantorSavings.toLocaleString()} ETB</strong>
          </div>
        </>
      )}
    </div>
  )}
</div>

{/* GUARANTOR STATUS MESSAGE - OUTSIDE loan-summary-section */}
{loan.employeeId && loan.principalAmount && (
  <div
    className={
      guarantorRequired
        ? guarantorType === "external"
          ? guarantorDetailsComplete
            ? "badge badge-success"
            : "badge badge-danger"
          : memberGuarantorComplete
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
    {guarantorRequired && guarantorType === "external" ? (
      guarantorDetailsComplete
        ? tr("External guarantor details complete.")
        : externalGuarantors.length === 0
          ? tr("Please add at least one complete external guarantor.")
          : externalGuarantors.some((guarantor) => !/^\+2519\d{8}$/.test(guarantor.phone))
            ? tr("External guarantor phone must be +251 followed by 9 digits starting with 9.")
            : externalGuarantors.some((guarantor) => !/^\d{16}$/.test(guarantor.digitalId))
              ? tr("External guarantor digital ID must be exactly 16 digits.")
              : tr("Please fill all external guarantor details.")
    ) : guarantorRequired ? (
      totalGuarantorSavings >=
    requiredGuarantorSavings ? (
        <>
          {tr("✅ Enough guarantor deposits selected.")}
        </>
      ) : (
        <>
          Need at least{" "}
          <strong>
            {(
              requiredGuarantorSavings -
              totalGuarantorSavings
            ).toLocaleString()}{" "}
            ETB
          </strong>{" "}
          {tr("more")}
        </>
      )
    ) : (
      <>
        {tr("🎉 No guarantor required. Employee deposits cover this loan amount.")}
      </>
    )}
  </div>
)}

          {/* ከታች 3: ስህተት ማሳያ እና ማስገቢያ ቁልፍ (Footer Actions) */}
       <div className="loan-footer-actions">
         {hasUnfinishedSameTypeLoan && (
           <div className="info-box danger-box">
             {tr("You already have an unfinished loan of this type. Pay it off before applying for another one.")}
           </div>
         )}
         {error && <div className="info-box danger-box">{error}</div>}

  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
    <button
      onClick={submit}
      className="loan-btn"
      disabled={
        !loan.employeeId ||
        !Number(loan.principalAmount) ||
        hasUnfinishedSameTypeLoan ||
        !guarantorDetailsComplete
      }
    >
      {tr("Create Loan Account")}
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
      ? tr("Hide History")
      : tr("Loan History")}
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
      {tr("Loan History")}
    </h2>

    <table className="loan-history-table">
      <thead>
        <tr>
          <th>{tr("Member")}</th>
          <th>{tr("Amount")}</th>
          <th>{tr("Type")}</th>
          <th>{tr("Status")}</th>
          <th>{tr("Remaining")}</th>
          <th>{tr("Created")}</th>
          <th>{tr("Update Status")}</th>
          <th>{tr("Delete")}</th>
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
              {tr("No loan records found")}
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
                        {tr("ID:")} {employee.memberId}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="member-name">
                        {tr("Unknown Member")}
                      </span>

                      <span className="member-id">
                        {tr("Employee record not found")}
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
                  {tr(loanItem.loanType)}
                </td>

                <td>
                  <span
                    className={`status-${loanItem.status}`}
                  >
                    {tr(loanItem.status)}
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
      {tr("The payment has been completed")}
    </span>
  ) : paymentStarted ? (
    <span className="payment-started">
      {tr("Payment Started")}
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
      <option value="pending">{tr("Pending")}</option>
      <option value="approved">{tr("Approved")}</option>
      <option value="rejected">{tr("Rejected")}</option>
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
      {tr("Delete")}
    </button>
  ) : !paymentStarted ? (
    // ✅ Allow delete if payment has NOT started
    <button
      className="delete-btn"
      onClick={() => deleteLoan(loanItem._id)}
    >
      {tr("Delete")}
    </button>
  ) : (
    // ❌ Block delete if payment started and not completed
    <button
      className="delete-btn disabled-delete-btn"
      disabled
    >
      {tr("Cannot Delete (Payment Started)")}
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