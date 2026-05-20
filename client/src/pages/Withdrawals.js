import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { FaUserMinus, FaListUl, FaMoneyCheckAlt } from "react-icons/fa";

export default function Withdrawals() {
  const [employees, setEmployees] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loans, setLoans] = useState([]); 
  const navigate = useNavigate();

  const [data, setData] = useState({
    employeeId: "",
    fullName: "",
    totalSaving: "",
    reason: "",
  });

  // =======================
  // LOAD DATA
  // =======================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await API.get("/employees");
        const depRes = await API.get("/deposits");
        const loanRes = await API.get("/loans"); 

        setEmployees(empRes.data || []);
        setDeposits(depRes.data || []);
        setLoans(loanRes.data || []);
      } catch (err) {
        console.error("Load error:", err);
      }
    };

    fetchData();
  }, []);

  // =======================
  // CHECK ACTIVE LOAN
  // =======================
  const hasActiveLoan = (employeeId) => {
    return loans.some(
      (l) =>
        String(l.employeeId?._id || l.employeeId) === String(employeeId) &&
        l.status === "approved" &&
        l.remainingAmount > 0
    );
  };

  // =======================
  // CALCULATE SAVING
  // =======================
  const calculateSaving = (employeeId) => {
    const total = deposits
      .filter(
        (d) =>
          String(d.employeeId?._id || d.employeeId) === String(employeeId)
      )
      .reduce((sum, d) => {
        const normal = parseFloat(d.normalSaving) || 0;
        const voluntary = parseFloat(d.voluntarySaving) || 0;
        return sum + normal + voluntary;
      }, 0);

    return total;
  };

  // =======================
  // HANDLE CHANGE
  // =======================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "employeeId") {
      const selectedEmp = employees.find((emp) => emp._id === value);
      const total = calculateSaving(value);

      setData({
        ...data,
        employeeId: value,
        fullName: selectedEmp
          ? `${selectedEmp.firstName} ${selectedEmp.lastName}`
          : "",
        totalSaving: total,
      });
    } else {
      setData({
        ...data,
        [name]: value,
      });
    }
  };

  // =======================
  // SUBMIT
  // =======================
  const submit = async () => {
    if (!data.employeeId || !data.reason) {
      alert("Please fill all required fields");
      return;
    }

    if (hasActiveLoan(data.employeeId)) {
      alert("Please finish your loan before proceeding withdrawals ❌");
      return;
    }

    try {
      const emp = employees.find((e) => e._id === data.employeeId);

      await API.post("/terminated", {
        employeeData: emp,
        totalSaving: data.totalSaving,
        reason: data.reason,
      });

      await API.post("/withdrawals", {
        employeeId: data.employeeId,
        fullName: data.fullName,
        totalSaving: data.totalSaving,
        reason: data.reason,
        isRead: false,
      });

      await API.delete(`/employees/${data.employeeId}`);

      alert("Employee moved to terminated list ✅");

      setEmployees((prev) =>
        prev.filter((e) => e._id !== data.employeeId)
      );

      setData({
        employeeId: "",
        fullName: "",
        totalSaving: "",
        reason: "",
      });

    } catch (err) {
      console.error("FRONT ERROR:", err.response?.data || err.message);
      alert("Error processing withdrawal ❌");
    }
  };

  return (
    <div className="withdraw-container">
      <div className="withdraw-card">
        
        <div className="top-bar">
          <button
            onClick={() => (window.location.href = "/Micro-Finance/#/terminated")}
            className="view-btn"
          >
            <FaListUl /> View Terminated
          </button>
        </div>

        <h2 className="withdraw-title">
          <FaUserMinus color="#8e44ad" /> Member Withdrawal
        </h2>

        {/* EMPLOYEE */}
        <div className="input-field-group">
          <label className="field-label">Select Employee *</label>
          <select
            name="employeeId"
            value={data.employeeId}
            onChange={handleChange}
            className="modern-select"
          >
            <option value="">Choose an employee...</option>
            {employees.map((emp) => (
              <option
                key={emp._id}
                value={emp._id}
              >
                {emp.memberId} - {emp.firstName} {emp.lastName}
                {hasActiveLoan(emp._id) ? " (Active Loan ❌)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* FULL NAME */}
        <div className="input-field-group">
          <label className="field-label">Employee Full Name</label>
          <input
            value={data.fullName}
            placeholder="Full Name (Auto-filled)"
            readOnly
            className="readonly modern-input"
          />
        </div>

        {/* SAVING */}
        <div className="info success">
          <div className="info-icon-title">
            <FaMoneyCheckAlt size={18} />
            <span>Total Saving:</span>
          </div>
          <strong className="amount-highlight">{data.totalSaving || 0} ETB</strong>
        </div>

        {/* REASON */}
        <div className="input-field-group">
          <label className="field-label">Reason for Withdrawal *</label>
          <textarea
            name="reason"
            placeholder="Please specify the clear reason for leaving or withdrawal..."
            value={data.reason}
            onChange={handleChange}
            className="modern-textarea"
          />
        </div>

        {/* BUTTON */}
        <button onClick={submit} className="withdraw-btn">
          Save & Terminate Member
        </button>

      </div>

      <style>
        {`
          .withdraw-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f4f7fb;
            padding: 20px;
            box-sizing: border-box;
            padding-top: 10px; /* ወደ ላይ ስፋቱ እንዲጨምር እና ከቶፕባር ጋር እንዳይጋጭ */
            padding-bottom: 40px;
          }

          /* 🛠️ እዚህ ጋ ነው ሳጥኑ ሰፊ የተደረገው እና የውስጥ ፓዲንጉ የቀነሰው */
          .withdraw-card {
            background: #fff;
            padding: 20px 25px; /* የውስጥ ክፍተት (Padding) አነስ ተደርጓል */
            width: 100%;
            max-width: 800px; /* ወደ ጎን በደንብ እንዲሰፋ (ከ 540px ወደ 680px አድጓል) */
            min-height: 700px; /* ወደ ላይ ቁመቱ እንዲጨምር ተደርጓል */
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.06);
            border: 1px solid rgba(128,128,128,0.08);
            box-sizing: border-box;
          }

          .withdraw-title {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 20px;
            color: #2c3e50;
            font-size: 24px;
            margin-top: 0;
          }

          .top-bar {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
          }

          .view-btn {
            padding: 10px 16px;
            background: #2ecc71;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
          }

          .view-btn:hover {
            background: #27ae60;
            transform: translateY(-1px);
          }

          .input-field-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 14px;
            width: 100%;
          }

          .field-label {
            font-size: 13px;
            font-weight: 600;
            color: #64748b;
          }

          .modern-input,
          .modern-select,
          .modern-textarea {
            width: 100%;
            padding: 11px 14px;
            border-radius: 10px;
            border: 1.5px solid #e2e8f0;
            font-size: 14px;
            color: #334155;
            background-color: #fff;
            outline: none;
            box-sizing: border-box;
            transition: all 0.2s ease;
          }

          .modern-input:focus,
          .modern-select:focus,
          .modern-textarea:focus {
            border-color: #8e44ad;
            box-shadow: 0 0 0 3px rgba(142,68,173,0.15);
          }

          .readonly {
            background-color: #f8fafc;
            color: #64748b;
            cursor: not-allowed;
          }

          .info.success {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #f5f3ff;
            border: 1px solid #ddd6fe;
            border-radius: 10px;
            margin-bottom: 16px;
            box-sizing: border-box;
          }

          .info-icon-title {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #6d28d9;
            font-size: 14px;
            font-weight: 500;
          }

          .amount-highlight {
            font-size: 16px;
            color: #5b21b6;
          }

          .modern-textarea {
            min-height: 100px; /* ቴክስት ኤሪያው ወደ ላይ ሰፋ እንዲል */
            resize: vertical;
          }

          .withdraw-btn {
            width: 100%;
            padding: 14px;
            background: #8e44ad;
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 10px;
            box-shadow: 0 4px 12px rgba(142, 68, 173, 0.2);
          }

          .withdraw-btn:hover {
            background: #732d91;
            transform: translateY(-1px);
          }

          /* ==========================================================================
             MOBILE RESPONSIVE QUERIES
             ========================================================================== */
          @media (max-width: 768px) {
            .withdraw-container {
              padding: 12px;
              padding-top: 85px;
            }

            .withdraw-card {
              padding: 20px 15px;
              max-width: 100%;
              min-height: auto;
            }

            .top-bar {
              margin-bottom: 12px;
            }

            .view-btn {
              width: 100%;
              justify-content: center;
              padding: 12px;
            }

            .info.success {
              flex-direction: column;
              align-items: flex-start;
              gap: 6px;
            }

            .amount-highlight {
              align-self: flex-end;
            }
          }
        `}
      </style>
    </div>
  );
}