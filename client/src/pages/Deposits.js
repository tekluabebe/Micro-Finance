import React, { useEffect, useState } from "react";
import API from "../services/api";
import { FaPiggyBank, FaInfoCircle, FaCalendarAlt, FaMoneyBillWave } from "react-icons/fa";
import "./Deposits.css"

export default function Deposits() {
  const [employees, setEmployees] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  

  const [data, setData] = useState({
    employeeId: "",
    month: "",
    year: "",
    normalSaving: "",
    voluntarySaving: "",
    sharedPurchase: "",
    registrationFee: "",
    latePenalty: "",
    depositForPurchase: "",
  });

  const [isNewEmployee, setIsNewEmployee] = useState(false);
  const [isLate, setIsLate] = useState(false);
  const [missingMonthsCount, setMissingMonthsCount] = useState(0);

  const MONTHLY_NORMAL_SAVING = 200; 
  const MONTHLY_PENALTY = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, depRes] = await Promise.all([
          API.get("/employees"),
          API.get("/deposits")
        ]);
        setEmployees(empRes.data || []);
        setDeposits(depRes.data || []);
      } catch (err) {
        console.error("Data fetching error:", err);
      }
    };
    fetchData();
  }, []);
const sharedPurchaseQty = parseFloat(data.sharedPurchase || 0);
const showDepositForPurchase = sharedPurchaseQty > 0;
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const hasAlreadyDeposited = (employeeId, month, year) => {
  return deposits.some((d) => {
    const depositEmployee =
      String(d.employeeId?._id || d.employeeId);

    return (
      depositEmployee === String(employeeId) &&
      d.month === month &&
      String(d.year) === String(year)
    );
  });
};
  const calculateMissingMonths = (empId, selectedMonth, selectedYear) => {
    const empDeposits = deposits.filter(d => String(d.employeeId?._id || d.employeeId) === String(empId));
    if (empDeposits.length === 0) return 0;

    const sorted = empDeposits.sort((a, b) => {
      const dateA = new Date(a.year, months.indexOf(a.month));
      const dateB = new Date(b.year, months.indexOf(b.month));
      return dateB - dateA;
    });

    const last = sorted[0]; 
    const lastDate = new Date(last.year, months.indexOf(last.month));
    const current = new Date(selectedYear, months.indexOf(selectedMonth));

    let diff = (current.getFullYear() - lastDate.getFullYear()) * 12;
    diff += current.getMonth() - lastDate.getMonth();
    
    return diff > 1 ? diff - 1 : 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...data, [name]: value };
    setErrorMessage(""); 

    if (name === "employeeId" || name === "month" || name === "year") {
      if (updatedData.employeeId && updatedData.month && updatedData.year) {
        
const alreadyPaid = hasAlreadyDeposited(
  updatedData.employeeId,
  updatedData.month,
  updatedData.year
);

if (alreadyPaid) {
  setErrorMessage(
    `❌ You already deposited for the month "${updatedData.month}" (${updatedData.year}).`
  );

  setData({
    ...updatedData,
    month: "",
    year: "",
    normalSaving: "",
    latePenalty: "",
  });

  return;
}

        const missing = calculateMissingMonths(updatedData.employeeId, updatedData.month, updatedData.year);
        setMissingMonthsCount(missing);
        
        updatedData.normalSaving = (missing + 1) * MONTHLY_NORMAL_SAVING;
        updatedData.latePenalty = missing * MONTHLY_PENALTY;
        
        const hasDeposit = deposits.some(d => String(d.employeeId?._id || d.employeeId) === String(updatedData.employeeId));
        setIsNewEmployee(!hasDeposit);
        updatedData.registrationFee = !hasDeposit ? "500" : "";
        setIsLate(missing > 0);
      }
    }
    if (name === "sharedPurchase") {
  const qty = parseFloat(value || 0);

  updatedData.sharedPurchase = qty;

  // OPTIONAL: store calculated cost (you can reuse field or create new one)
  updatedData.sharedPurchaseCost = qty * 500;
}
    setData(updatedData);

    
  };

  const submit = async () => {
    if (!data.employeeId || !data.month || !data.year) {
      // Prevent duplicate deposits
if (
  hasAlreadyDeposited(
    data.employeeId,
    data.month,
    data.year
  )
) {
  setErrorMessage(
    `❌ You already deposited for the month "${data.month}" (${data.year}).`
  );

  return;
}
      setErrorMessage("እባክዎ መጀመሪያ ትክክለኛ ወር እና አመት ይምረጡ!");
      return;
    }

    const minRequiredSaving = (missingMonthsCount + 1) * MONTHLY_NORMAL_SAVING;
    const minRequiredPenalty = missingMonthsCount * MONTHLY_PENALTY;

    if (parseFloat(data.normalSaving) < minRequiredSaving) {
      setErrorMessage(`የመደበኛ ቁጠባ መጠን ከ ${minRequiredSaving} ETB ማነስ የለበትም!`);
      return;
    }

    try {
      const empDeposits = deposits.filter(d => String(d.employeeId?._id || d.employeeId) === String(data.employeeId));
      let lastDate;
      if (empDeposits.length > 0) {
        const sorted = empDeposits.sort((a, b) => {
          const dateA = new Date(a.year, months.indexOf(a.month));
          const dateB = new Date(b.year, months.indexOf(b.month));
          return dateB - dateA;
        });
        const last = sorted[0];
        lastDate = new Date(last.year, months.indexOf(last.month));
      }

      for (let i = 0; i <= missingMonthsCount; i++) {
        let currentMonthIndex;
        let currentYear = parseInt(data.year);

        if (lastDate) {
          let nextMonthDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1 + i);
          currentMonthIndex = nextMonthDate.getMonth();
          currentYear = nextMonthDate.getFullYear();
        } else {
          currentMonthIndex = months.indexOf(data.month);
        }
        if (parseFloat(data.latePenalty) < minRequiredPenalty) {
          setErrorMessage(`የቅጣት መጠን ከ ${minRequiredPenalty} ETB ማነስ የለበትም! (${missingMonthsCount} ወራት ተዘልለዋል)`);
          return;
        }

        const payload = {
          ...data,
          month: months[currentMonthIndex],
          year: String(currentYear),
          normalSaving: MONTHLY_NORMAL_SAVING,
          latePenalty: i < missingMonthsCount ? MONTHLY_PENALTY : 0,
          voluntarySaving: i === missingMonthsCount ? (parseFloat(data.voluntarySaving) || 0) : 0,
          sharedPurchase: i === missingMonthsCount ? (parseFloat(data.sharedPurchase) || 0) : 0,
depositForPurchase:
  i === missingMonthsCount
    ? (parseFloat(data.sharedPurchase) || 0) * 500
    : 0,
          registrationFee: (i === 0 && isNewEmployee) ? parseFloat(data.registrationFee) : 0,
        };

        await API.post("/deposits", payload);
      }

      alert("ሁሉም ወራት በተሳካ ሁኔታ ተመዝግበዋል ✅");
      
      setData({
        employeeId: "", month: "", year: "",
        normalSaving: "", voluntarySaving: "",
        sharedPurchase: "", registrationFee: "", latePenalty: ""
      });
      setMissingMonthsCount(0);
      window.location.reload(); 

    } catch (err) {
      console.error(err);
      setErrorMessage("መረጃውን ማስቀመጥ አልተቻለም ❌");
    }
  };

  const selectedEmployeeData = employees.find(emp => emp._id === data.employeeId);

  return (
    <div className="deposit-container">
      <div className="deposit-card">
        <h2 className="form-title">
          <FaPiggyBank color="#3498db" /> Member Deposit Portal/የአባሉ ገንዘብ ማስቀመጫ
        </h2>

        {errorMessage && (
          <div className="error-banner">
            {errorMessage}
          </div>
        )}
        
        {/* የላይኛው ክፍል፡ ልክ እንደ ብድር መክፈያው ወደ ጎን ሰፋ ተደርጓል */}
        <div className="selection-row-container">
          <div className="selection-section">
            <div className="input-group full">
              <label>SELECT MEMBER/አባል ይምረጡ</label>
              <select name="employeeId" value={data.employeeId} onChange={handleChange} className="modern-select">
                <option value="">-- Choose Member/አባል ይምረጡ --</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.memberId} - {emp.firstName} {emp.lastName}</option>
                ))}
              </select>
            </div>
            
            <div className="input-row">
              <div className="input-group">
                <label><FaCalendarAlt /> Month/ወር</label>
                <select name="month" value={data.month} onChange={handleChange} className="modern-select">
                  <option value="">Month</option>
                  {months.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label><FaCalendarAlt /> Year/አመት</label>
                <select name="year" value={data.year} onChange={handleChange} className="modern-select">
                  <option value="">Year</option>
                  {[2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 💡 ልክ በምስሉ ላይ እንዳለው አይነት የመረጃ ማሳያ ሰረዝ ሳጥን (Dotted Status Box) */}
<div className="status-display-box">
  {selectedEmployeeData ? (
    <>
      <h3 className="status-title">
        Active Member Status
      </h3>

      <div className="member-status-grid">

        <div className="status-card blue-card">
          <span className="status-label">Member Name</span>
          <h4>
            {selectedEmployeeData.firstName} {selectedEmployeeData.lastName}
          </h4>
        </div>

        <div className="status-card purple-card">
          <span className="status-label">Member ID</span>
          <h4>{selectedEmployeeData.memberId}</h4>
        </div>

        <div className="status-card green-card">
          <span className="status-label">Category</span>
          <h4>{selectedEmployeeData.category}</h4>
        </div>

        <div
          className={`status-card ${
            missingMonthsCount > 0 ? "red-card" : "success-card"
          }`}
        >
          <span className="status-label">Deposit Status</span>

          <h4>
            {missingMonthsCount > 0
              ? `${missingMonthsCount} Months Overdue`
              : "Up To Date"}
          </h4>
        </div>

      </div>
    </>
  ) : (
    <div className="status-placeholder">
      <div className="info-icon-wrapper">
        <FaInfoCircle size={30} color="#3b82f6" />
      </div>

      <p>
        Please select a member and date to view member status.
      </p>
    </div>
  )}
</div>
        </div>

        {missingMonthsCount > 0 && (
          <div className="alert-box warning">
             <strong>{missingMonthsCount} ወራት</strong> አልፈዋል። ለነዚህ ወራት ክፍያ እና ቅጣት በራስ-ሰር ታስቧል።
          </div>
        )}

        {/* የታችኛው ክፍል ግሪድ ቁመትና ስፋቱ እንዲጨምር ተደርጓል */}
       {/* የታችኛው ክፍል ግሪድ ቁመትና ስፋቱ እንዲጨምር ተደርጓል */}
<div className="deposit-grid">
  <div className="input-group field-large">
    <label>AMOUNT TO PAY / NORMAL SAVING(መደበኛ ቁጠባ) (ETB)</label>
    <input name="normalSaving" type="number" value={data.normalSaving} onChange={handleChange} className="modern-input green-glow" placeholder="Enter amount..." />
  </div>
  
  <div className="input-group field-large">
    <label>VOLUNTARY SAVING(የፍቃደኝነት ቁጠባ) (ETB)</label>
    <input name="voluntarySaving" type="number" value={data.voluntarySaving} onChange={handleChange} className="modern-input" placeholder="0" />
  </div>

  {/* 🛠️ እዚህ ጋ ነው ለውጡ የተደረገው */}
<div className="input-group field-large highlight">
  <label style={{ 
    color: selectedEmployeeData?.category === "Child" ? "#ef4444" : "#3b82f6", // ቀይ ለልጅ፣ ሰማያዊ ለአዋቂ
    fontWeight: "bold" 
  }}>
    SHARED PURCHASE(የሚገዙት አክሲዮን) 
    <span style={{ fontSize: "13px", marginLeft: "5px" }}>
      {selectedEmployeeData?.category === "Child" 
        ? "(ለህጻናት የ አክሲዮን ግዢ አይፈቀድም።)" 
        : " (አዋቂዎች ቢያንስ 1 አክሲዮን መግዛት አለባችው።)"}
    </span>
  </label>
  
  <input 
    name="sharedPurchase" 
    type="number" 
    value={selectedEmployeeData?.category === "Child" ? "0" : data.sharedPurchase} 
    onChange={handleChange} 
    className="modern-input" 
    placeholder={selectedEmployeeData?.category === "Child" ? "Inactive" : "Enter amount..."}
    disabled={selectedEmployeeData?.category === "Child"} 
    style={{ 
      borderColor: selectedEmployeeData?.category === "Child" ? "#ef4444" : "#cbd5e1" 
    }}
  />
  {showDepositForPurchase && (
  <div className="input-group field-large highlight">
    <label>
      DEPOSIT FOR PURCHASE (500 ETB per unit)
    </label>

    <input
      name="depositForPurchase"
      type="number"
      value={data.sharedPurchase * 500}
      readOnly
      className="modern-input green-glow"
    />
  </div>
)}
</div>

  <div className="input-group field-large">
    <label>LATE PENALTY (AUTO-CALCULATED)</label>
    <input name="latePenalty" type="number" value={data.latePenalty} onChange={handleChange} className={`modern-input ${isLate ? "error-border" : ""}`} placeholder="0" />
  </div>

  {isNewEmployee && (
    <div className="input-group field-large success-group">
      <label>REGISTRATION FEE</label>
      <input name="registrationFee" type="number" value={data.registrationFee} onChange={handleChange} className="modern-input" />
    </div>
  )}
</div>

        <button onClick={submit} className="submit-btn">
          <FaMoneyBillWave /> Confirm & Complete Deposit(መረጃዉን አስቀምጥ)
        </button>
      </div>

     
    </div>
  );
}