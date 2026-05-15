import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./Deposits.css";

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
  });

  const [isNewEmployee, setIsNewEmployee] = useState(false);
  const [isLate, setIsLate] = useState(false);
  const [missingMonthsCount, setMissingMonthsCount] = useState(0);

  // የገንዘብ መጠኖች እንደ መመሪያው
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

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // የቅርብ ጊዜ ክፍያን መሰረት አድርጎ ያመለጡ ወራትን ማስላት
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
        
        // ነጥብ 1፡ የተመረጠው ወር ቀድሞ በተከፈለ ክፍያ ውስጥ መኖሩን ቼክ ማድረግ
        // (የቀጥታ ክፍያ ወይም በቅጣት/በጥቅል ክፍያ ውስጥ መኖሩን ያያል)
        const alreadyPaid = deposits.some(d => {
          const isSameEmp = String(d.employeeId?._id || d.employeeId) === String(updatedData.employeeId);
          const isSameMonth = d.month === updatedData.month && String(d.year) === String(updatedData.year);
          
          // አማራጭ፡ ድርጅታችሁ በጥቅል ክፍያ ጊዜ 'extraMonths' የሚል ዝርዝር የሚይዝ ከሆነ እሱንም እዚህ ቼክ ማድረግ ይቻላል
          return isSameEmp && isSameMonth;
        });

        if (alreadyPaid) {
          setErrorMessage(`⚠️ ስህተት፡ ${updatedData.month} ${updatedData.year} ቀድሞ ተከፍሏል! (በጥቅል ክፍያ ወይም በቅጣት ወቅት ተካቶ ሊሆን ይችላል)`);
          // ስህተት ሲኖር ወሩን እና አመቱን ባዶ በማድረግ save እንዳይደረግ መከላከል
          setData({ ...updatedData, month: "", year: "", normalSaving: "", latePenalty: "" });
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
    setData(updatedData);
  };

  const submit = async () => {
    if (!data.employeeId || !data.month || !data.year) {
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
      // 1. ያመለጡ ወራትን ዝርዝር ማውጣት (ለምሳሌ ግንቦት ካመለጠ ግንቦትን ማግኘት)
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

      // 2. ለሁሉም ወራት (ያመለጡት + የአሁኑ) ክፍያ መላክ
      // ለምሳሌ፡ missingMonthsCount 1 ከሆነ፣ 2 ክፍያዎችን ይልካል
      for (let i = 0; i <= missingMonthsCount; i++) {
        let currentMonthIndex;
        let currentYear = parseInt(data.year);

        if (lastDate) {
          // ካለፈው ክፍያ ቀጥሎ ያለውን ወር ማስላት
          let nextMonthDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1 + i);
          currentMonthIndex = nextMonthDate.getMonth();
          currentYear = nextMonthDate.getFullYear();
        } else {
          // አዲስ ሰራተኛ ከሆነ በቀጥታ የተመረጠውን ወር መውሰድ
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
          normalSaving: MONTHLY_NORMAL_SAVING, // ለእያንዳንዱ ወር 200 ብር
          latePenalty: i < missingMonthsCount ? MONTHLY_PENALTY : 0, // ያለፈው ወር ከሆነ ቅጣት አለው
          voluntarySaving: i === missingMonthsCount ? (parseFloat(data.voluntarySaving) || 0) : 0, // የአሁኑ ወር ላይ ብቻ ይጨመራል
          sharedPurchase: i === missingMonthsCount ? (parseFloat(data.sharedPurchase) || 0) : 0,
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
  return (
    <div className="deposit-container">
      <div className="deposit-card">
        <h2 className="form-title">Member Deposit Form</h2>

        {errorMessage && (
          <div className="error-banner">
            {errorMessage}
          </div>
        )}
        
        <div className="selection-section">
          <div className="input-group full">
            <label>Select Employee</label>
            <select name="employeeId" value={data.employeeId} onChange={handleChange}>
              <option value="">Choose a member...</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.memberId} - {emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          </div>
          
          <div className="input-row">
            <div className="input-group">
              <label>Month</label>
              <select name="month" value={data.month} onChange={handleChange}>
                <option value="">Month</option>
                {months.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Year</label>
              <select name="year" value={data.year} onChange={handleChange}>
                <option value="">Year</option>
                {[2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {missingMonthsCount > 0 && (
          <div className="alert-box warning">
             <strong>{missingMonthsCount} ወራት</strong> አልፈዋል። ለነዚህ ወራት ክፍያ እና ቅጣት ተጨምሯል።
          </div>
        )}

        <div className="deposit-grid">
          <div className="input-group">
            <label>Normal Saving (ETB)</label>
            <input name="normalSaving" type="number" value={data.normalSaving} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Voluntary Saving</label>
            <input name="voluntarySaving" type="number" value={data.voluntarySaving} onChange={handleChange} />
          </div>
          <div className="input-group highlight">
            <label>Shared Purchase</label>
            <input name="sharedPurchase" type="number" value={data.sharedPurchase} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Late Penalty</label>
            <input name="latePenalty" type="number" value={data.latePenalty} onChange={handleChange} className={isLate ? "error-border" : ""} />
          </div>
          {isNewEmployee && (
            <div className="input-group success-group">
              <label>Registration Fee</label>
              <input name="registrationFee" type="number" value={data.registrationFee} onChange={handleChange} />
            </div>
          )}
        </div>

        <button onClick={submit} className="submit-btn">Complete Deposit</button>
      </div>
    </div>
  );
}