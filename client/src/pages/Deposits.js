import React, { useEffect, useState } from "react";
import API from "../services/api";
import { FaPiggyBank, FaInfoCircle, FaCalendarAlt, FaMoneyBillWave } from "react-icons/fa";

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
        
        const alreadyPaid = deposits.some(d => {
          const isSameEmp = String(d.employeeId?._id || d.employeeId) === String(updatedData.employeeId);
          const isSameMonth = d.month === updatedData.month && String(d.year) === String(updatedData.year);
          return isSameEmp && isSameMonth;
        });

        if (alreadyPaid) {
          setErrorMessage(`⚠️ ስህተት፡ ${updatedData.month} ${updatedData.year} ቀድሞ ተከፍሏል!`);
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
          <FaPiggyBank color="#3498db" /> Member Deposit Portal
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
              <label>SELECT MEMBER</label>
              <select name="employeeId" value={data.employeeId} onChange={handleChange} className="modern-select">
                <option value="">-- Choose Member --</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.memberId} - {emp.firstName} {emp.lastName}</option>
                ))}
              </select>
            </div>
            
            <div className="input-row">
              <div className="input-group">
                <label><FaCalendarAlt /> Month</label>
                <select name="month" value={data.month} onChange={handleChange} className="modern-select">
                  <option value="">Month</option>
                  {months.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label><FaCalendarAlt /> Year</label>
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
              <div className="status-info-content">
                <h4>Active Member Status</h4>
                <p><strong>Name:</strong> {selectedEmployeeData.firstName} {selectedEmployeeData.lastName}</p>
                <p><strong>Member ID:</strong> {selectedEmployeeData.memberId}</p>
                {missingMonthsCount > 0 ? (
                  <span className="status-badge danger-badge">⚠️ {missingMonthsCount} Months Overdue</span>
                ) : (
                  <span className="status-badge success-badge">✅ Up to Date</span>
                )}
              </div>
            ) : (
              <div className="status-placeholder">
                <div className="info-icon-wrapper">
                  <FaInfoCircle size={24} color="#3498db" />
                </div>
                <p>Please select a member and date to view current status.</p>
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
        <div className="deposit-grid">
          <div className="input-group field-large">
            <label>AMOUNT TO PAY / NORMAL SAVING (ETB)</label>
            <input name="normalSaving" type="number" value={data.normalSaving} onChange={handleChange} className="modern-input green-glow" placeholder="Enter amount..." />
          </div>
          <div className="input-group field-large">
            <label>VOLUNTARY SAVING (ETB)</label>
            <input name="voluntarySaving" type="number" value={data.voluntarySaving} onChange={handleChange} className="modern-input" placeholder="0" />
          </div>
          <div className="input-group field-large highlight">
            <label>SHARED PURCHASE</label>
            <input name="sharedPurchase" type="number" value={data.sharedPurchase} onChange={handleChange} className="modern-input" placeholder="0" />
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
          <FaMoneyBillWave /> Confirm & Complete Deposit
        </button>
      </div>

      <style>
        {`
          *, *::before, *::after {
            box-sizing: border-box;
          }

          .deposit-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f4f7fb;
            padding: 30px 20px;
            padding-top: 10px; /* ከቶፕባር ጋር እንዳይጋጭ */
          }

          /* 🛠️ እዚህ ጋ ነው ፎርሙ ልክ እንደ ምስሉ ሰፊና ቁመቱ ከፍ የተደረገው (Padding የቀነሰው) */
          .deposit-card {
            background: #ffffff;
            padding: 25px 35px; /* የውስጥ ክፍተቱ አነስ ተደርጓል */
            border-radius: 20px;
            box-shadow: 0 12px 35px rgba(0,0,0,0.06);
            width: 100%;
            max-width: 920px; /* ወደ ጎን በደንብ እንዲሰፋ ከ 650px ወደ 920px ከፍ ብሏል */
            border: 1px solid rgba(128,128,128,0.08);
          }

          .form-title {
            color: #1e3a8a;
            margin-bottom: 25px;
            text-align: center;
            font-size: 26px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }

          /* የላይኛው የኢንፑት እና የሰረዝ ሳጥኑ መደርደሪያ */
          .selection-row-container {
            display: flex;
            gap: 25px;
            margin-bottom: 25px;
          }

          .selection-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 14px;
            flex: 1.2;
            border: 1px solid #e2e8f0;
          }

          /* 💡 ልክ በላከልኸው ምስል ላይ ያለው አይነት የሰረዝ ሳጥን ስታይል */
          .status-display-box {
            flex: 1;
            border: 2px dashed #cbd5e1;
            border-radius: 16px;
            background: #fafafa;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            min-height: 160px;
          }

          .status-placeholder {
            text-align: center;
            color: #64748b;
            font-size: 14px;
            max-width: 220px;
          }

          .info-icon-wrapper {
            background: #e0f2fe;
            width: 45px;
            height: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 12px auto;
          }

          .status-info-content {
            width: 100%;
          }

          .status-info-content h4 {
            margin-top: 0;
            color: #1e3a8a;
            margin-bottom: 12px;
            font-size: 16px;
          }

          .status-info-content p {
            margin: 6px 0;
            font-size: 14px;
            color: #334155;
          }

          .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 8px;
          }

          .danger-badge { background: #fee2e2; color: #ef4444; }
          .success-badge { background: #dcfce7; color: #22c55e; }

          .input-row {
            display: flex;
            gap: 15px;
            margin-top: 15px;
          }

          .input-group {
            display: flex;
            flex-direction: column;
            margin-bottom: 15px;
          }

          .input-group label {
            font-size: 12px;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          /* 🛠️ የኢንፑት ማሳያ ሳጥኖቹ ቁመት (Height) እንዲጨምር ተደርጓል */
          .modern-input, .modern-select {
            padding: 13px 16px; /* ከ 12px ወደ 13px ቁመቱ ከፍ ብሏል */
            border: 1.5px solid #cbd5e1;
            border-radius: 10px;
            font-size: 15px;
            color: #334155;
            background-color: #fff;
            outline: none;
            width: 100%;
            transition: all 0.2s ease;
          }

          .modern-input:focus, .modern-select:focus {
            border-color: #3498db;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.15);
          }

          /* ልክ በምስሉ ላይ እንዳለው የአረንጓዴ ቦርደር ግሎው ማድረጊያ */
          .green-glow {
            background-color: #f0fdf4 !important;
            border-color: #bbf7d0 !important;
          }
          
          .green-glow:focus {
            border-color: #22c55e !important;
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15) !important;
          }

          /* የታችኛው ፎርም ሳጥኖች መደርደሪያ */
          .deposit-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 10px;
          }

          .highlight input {
            background-color: #fffbeb;
            border-color: #fde047;
          }

          .alert-box {
            padding: 14px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
          }

          .warning {
            background: #fffbeb;
            color: #b45309;
            border-left: 5px solid #f59e0b;
          }

          .submit-btn {
            width: 100%;
            padding: 15px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
          }

          .submit-btn:hover {
            background: #1d4ed8;
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(37, 99, 235, 0.3);
          }

          .error-banner {
            background-color: #ef4444;
            color: white;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: bold;
          }

          .error-border {
            border: 2px solid #ef4444 !important;
          }

          /* ==========================================================================
             MOBILE RESPONSIVE BREAKPOINT (ለሞባይል ስልኮች ፍጹም ማስተካከያ)
             ========================================================================== */
          @media (max-width: 768px) {
            .deposit-container {
              padding: 12px; 
              padding-top: 85px;
            }

            .deposit-card {
              padding: 20px 15px; 
              border-radius: 14px;
            }

            .selection-row-container {
              flex-direction: column;
              gap: 15px;
            }

            .input-row {
              flex-direction: column;
              gap: 12px;
            }

            .deposit-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }

            .status-display-box {
              min-height: auto;
              padding: 15px;
            }

            .form-title {
              font-size: 20px; 
            }
          }
        `}
      </style>
    </div>
  );
}