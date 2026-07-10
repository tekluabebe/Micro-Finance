import React, { useEffect, useState } from "react";
import DashboardCard from "../components/DashboardCard";
import API from "../services/api";


export default function Dashboard() {
const userRole = localStorage.getItem("userRole")?.toLowerCase() || "member";
const isMember = userRole === "member";
const [passwordRequests, setPasswordRequests] = useState([]);
const [openPasswordRequests, setOpenPasswordRequests] = useState(false);

  const [withdrawals, setWithdrawals] = useState([]);
  const [loans, setLoans] = useState([]);

  const [openWithdrawals, setOpenWithdrawals] = useState(false);
  const [openLoans, setOpenLoans] = useState(false);
  const [notifFilter, setNotifFilter] = useState("all"); 
  const [darkMode, setDarkMode] = useState(true);
const user = JSON.parse(localStorage.getItem("user"));

console.log(user.fullName);

const fullName =
  `${user.firstName || ""} ${user.lastName || ""}`;



  // =========================
  // FILTERS
  // =========================
  const currentMonth = new Date().toLocaleString("en-US", {
    month: "long",
  });

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear())
  );

  // =========================
  // STATS
  // =========================
  const [stats, setStats] = useState({
    employees: 0,
    totalSavings: 0,
    activeLoans: 0,
    monthlyDeposits: 0,
    totalRegistrationFees: 0,
    totalLatePenalties: 0,
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  
  // =========================
  // LOAD NOTIFICATIONS
  // =========================
useEffect(() => {
  API.get("/withdrawals")
    .then((res) => setWithdrawals(res.data || []))
    .catch(() => setWithdrawals([]));

  API.get("/loans")
    .then((res) => setLoans(res.data || []))
    .catch(() => setLoans([]));

  API.get("/password-reset-request")
    .then((res) => setPasswordRequests(res.data || []))
    .catch(() => setPasswordRequests([]));

},  []);


  // =========================
  // FETCH DASHBOARD STATS
  // =========================
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, depRes, loanRes, registrationRes, penaltyRes] = await Promise.all([
          API.get("/employees"),
          API.get("/deposits"),
          API.get("/loans"),
          API.get("/registration-fees"),
          API.get("/late-penalties"),
        ]);

        const deposits = depRes.data || [];
        const registrationFees = registrationRes.data || [];
        const latePenalties = penaltyRes.data || [];

        const employeesCount = empRes.data?.length || 0;

        const totalSavings = deposits.reduce((sum, d) => sum + (parseFloat(d.normalSaving) || 0) + (parseFloat(d.voluntarySaving) || 0), 0);

        const monthlyDeposits = deposits
          .filter((d) => d.month === selectedMonth && String(d.year) === selectedYear)
          .reduce((sum, d) => sum + (parseFloat(d.normalSaving) || 0) + (parseFloat(d.voluntarySaving) || 0), 0);

        const totalRegistrationFees = registrationFees
          .filter((r) => r.month === selectedMonth && String(r.year) === selectedYear)
          .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

        const totalLatePenalties = latePenalties
          .filter((p) => p.month === selectedMonth && String(p.year) === selectedYear)
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        const activeLoans = (loanRes.data || []).filter((l) => l.status === "approved" && l.remainingAmount > 0).length;

        setStats({
          employees: employeesCount,
          totalSavings,
          activeLoans,
          monthlyDeposits,
          totalRegistrationFees,
          totalLatePenalties,
        });
      } catch (err) {
        console.log("Dashboard stats error:", err);
      }
    };
    fetchStats();
  }, [selectedMonth, selectedYear]);

  // =========================
  // NOTIFICATION COUNTS
  // =========================
 const unreadWithdrawals = withdrawals.filter(
  (w) =>
    w.isRead !== true &&
    w.status !== "approved" &&
    w.status !== "rejected"
).length;

const unreadLoans = loans.filter(
  (l) =>
    l.isRead !== true &&
    l.status !== "approved" &&
    l.status !== "rejected"
).length;

const unreadPasswordRequests = passwordRequests.filter(
  (p) =>
    p.isRead !== true &&
    p.status !== "approved" &&
    p.status !== "rejected"
).length;

  const markAsRead = async (type, id) => {
    await API.put(`/${type}/${id}/read`);
    if (type === "withdrawals") {
      setWithdrawals((prev) => prev.map((w) => w._id === id ? { ...w, isRead: true } : w));
    } else {
      setLoans((prev) => prev.map((l) => l._id === id ? { ...l, isRead: true } : l));
    }
  };

  const markAllPasswordRequestsRead = async () => {
  try {

    await Promise.all(
      passwordRequests
        .filter((p) => !p.isRead)
        .map((p) =>
          API.put(
            `/password-reset-request/${p._id}/read`
          )
        )
    );

setPasswordRequests([]);

  } catch (err) {
    console.error(err);
  }
};


const handleApprove = async (type, id) => {
  try {
    await API.put(`/${type}/${id}/approve`);

    if (type === "withdrawals") {
      const withdrawal = withdrawals.find(
        (w) => w._id === id
      );

      if (!withdrawal) return;

      const employeeId =
        withdrawal.employeeId?._id ||
        withdrawal.employeeId;

      console.log(
        "Terminate URL:",
        `/employees/${employeeId}/terminate`
      );

      await API.put(
        `/employees/${employeeId}/terminate`
      );

      setWithdrawals((prev) =>
        prev.filter((w) => w._id !== id)
      );
    }

    if (type === "loans") {
      setLoans((prev) =>
        prev.filter((l) => l._id !== id)
      );
    }

  } catch (err) {
    console.error(
      "Approve Error:",
      err.response?.data || err.message
    );
  }
};
    // =========================
    // LOANS
    // =========================
  

const handleReject = async (type, id) => {
  try {
    await API.put(`/${type}/${id}/reject`);

    if (type === "withdrawals") {
      setWithdrawals(prev => prev.filter(w => w._id !== id));
    }

    if (type === "loans") {
      setLoans(prev => prev.filter(l => l._id !== id));
    }

  } catch (err) {
    console.error(err);
  }
};

  const markPasswordResetRead = async (id) => {
  try {
    await API.put(
      `/password-reset-request/${id}/read`
    );

    setPasswordRequests(prev =>
  prev.filter(
    p => p._id !== id
  )
);

  } catch (err) {
    console.error(err);
  }
};

const approvePasswordReset = async (id) => {
  const newPassword = prompt(
    "Enter temporary password"
  );

  if (!newPassword) return;

  try {
    await API.put(
      `/password-reset-request/${id}/approve`,
      { newPassword }
    );

    setPasswordRequests((prev) =>
      prev.filter((p) => p._id !== id)
    );

    alert("Password reset successful");

  } catch (err) {
    alert(
      err.response?.data?.message ||
      "Password reset failed"
    );
  }
};
const rejectPasswordReset = async (id) => {
  try {
    await API.put(
      `/password-reset-request/${id}/reject`
    );

    setPasswordRequests((prev) =>
      prev.filter((p) => p._id !== id)
    );

  } catch (err) {
    alert(
      err.response?.data?.message ||
      "Reject failed"
    );
  }
};

const renderPasswordRequests = () => {

  const pending = passwordRequests.filter(
    p =>
      p.status !== "approved" &&
      p.status !== "rejected"
  );

  if (!pending.length) {
    return (
      <p style={styles.empty}>
        No password reset requests
      </p>
    );
  }

  return pending.map(item => (

    <div
      key={item._id}
      style={styles.notificationCard}
    >
      <div style={styles.notificationIcon}>
        🔑
      </div>

      <div style={{ flex: 1 }}>
        <strong>
          Password Reset Request
        </strong>

        <p style={styles.notificationText}>
          Member ID: {item.memberId}
        </p>

        <p style={styles.notificationText}>
          {item.fullName}
        </p>

        <p style={styles.notificationTime}>
          Password reset requested
        </p>
      </div>

      <div style={styles.actions}>

        <button
          style={styles.readBtn}
          onClick={() =>
            markPasswordResetRead(item._id)
          }
        >
          👁
        </button>

        <button
          style={styles.approve}
          onClick={() =>
            approvePasswordReset(item._id)
          }
        >
          ✔
        </button>

        <button
          style={styles.reject}
          onClick={() =>
            rejectPasswordReset(item._id)
          }
        >
          ✖
        </button>

      </div>
    </div>
  ));
};
  const renderNotifications = (items, type) => {
    const unreadItems = items.filter((i) => i.isRead !== true && i.status !== "Rejected");
    if (!unreadItems.length) return <p style={styles.empty}>No notifications</p>;

    return unreadItems.map((item) => (
      <div key={item._id} style={{ ...styles.item, background: "#eaf7ff" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {type === "withdrawals" && (
            <>
              <strong>{item.fullName}</strong>
              <p style={styles.text}>Reason: {item.reason}</p>
              <p style={styles.text}>Amount: {item.totalSaving} ETB</p>
            </>
          )}

          {type === "loans" && (
            <>
              <p style={styles.text}><strong>Employee ID:</strong> {item.employeeId?.memberId || "N/A"}</p>
              <p style={styles.text}><strong>Borrower:</strong> {item.employeeId?.firstName} {item.employeeId?.lastName}</p>
              <p style={styles.text}><strong>Amount:</strong> {item.principalAmount} ETB</p>
              <div style={{ marginTop: "5px", padding: "5px", background: "#fff", borderRadius: "5px", border: "1px solid #ddd" }}>
                <strong style={{ fontSize: "11px", color: "#555" }}>Guarantors (ዋሶች):</strong>
                <ul style={{ margin: "3px 0", paddingLeft: "15px", listStyleType: "square" }}>
                  {item.guarantors && item.guarantors.length > 0 ? (
                    item.guarantors.map((g, index) => <li key={index} style={{ fontSize: "11px", color: "#333" }}>{g.firstName} {g.lastName}</li>)
                  ) : (
                    <li style={{ fontSize: "11px", color: "red" }}>No guarantors listed!</li>
                  )}
                </ul>
              </div>
              <p style={styles.text}>
                <strong>Status:</strong>{" "}
                <span style={{ color: item.status === "approved" ? "green" : item.status === "rejected" ? "red" : "orange", fontWeight: "bold" }}>
                  {item.status || "pending"}
                </span>
              </p>
            </>
          )}
        </div>
        <div style={styles.actions}>
          <button onClick={() => handleApprove(type, item._id)} style={styles.approve}>✔</button>
          <button onClick={() => handleReject(type, item._id)} style={styles.reject}>✖</button>
        </div>
      </div>
    ));
  };

  return (
<div
  className={`dashboard-main-container ${
    darkMode ? "dark-dashboard" : "light-dashboard"
  }`}
>     
      {/* ================= 🛠️ ራስጌ (Header) ================= */}
      <div className="dashboard-header-block" style={styles.dashboardHeader}>
<div className="welcome-section">
  <div className="welcome-left">
    <h1 className="welcome-title">
      👋 Welcome to Micro-finance Dashboard
    </h1>

    
  </div>

  <div className="user-profile-box">
  <img
    src="/avator.jpg"
    alt="User Avatar"
    className="user-avatar"
  />

  <div>
   
    <h3>{fullName}</h3>
    <span>{userRole}</span>
  </div>
</div>
</div>

        <div className="dashboard-right-controls" style={styles.headerRightSection}>
        
       {!isMember && (
  <div style={styles.topBar}>
    <div
  className="notifItem"
  onClick={() => setOpenWithdrawals(!openWithdrawals)}
>
      🔔 Withdrawals
      {unreadWithdrawals > 0 && (
       <span className="badge">
          {unreadWithdrawals}
        </span>
      )}
    </div>

    <div
      className="notifItem"
      onClick={() => setOpenLoans(!openLoans)}
    >
      💰 Loans
      {unreadLoans > 0 && (
        <span className="badge">
          {unreadLoans}
        </span>
      )}
    </div>

    <div
      className="notifItem"
      onClick={() =>
        setOpenPasswordRequests(!openPasswordRequests)
      }
    >
      🔑 Password Reset

      {unreadPasswordRequests > 0 && (
        <span className="badge">
          {unreadPasswordRequests}
        </span>
      )}
    </div>
     
  </div>
)}


          <div style={styles.filterBar}>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="selectInput">
              {months.map((m) => <option key={m}>{m}</option>)}
            </select>

            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="selectInput">
              {Array.from({ length: 10 }, (_, i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y}>{y}</option>;
              })}
            </select>
             <div className={darkMode ? "dark-dashboard" : "light-dashboard"}>
            <button
  onClick={() => setDarkMode(!darkMode)}
  className="theme-toggle"
>
  {darkMode ? "☀️ Light" : "🌙 Dark"}
</button> </div>
          </div>
        </div>
      </div>

      {/* ================= DROPDOWNS ================= */}
      {!isMember && openWithdrawals && (
        <div className="dashboard-notif-dropdown" style={styles.dropdown}>
          {renderNotifications(withdrawals, "withdrawals")}
        </div>
      )}

      {!isMember && openLoans && (
        <div className="dashboard-notif-dropdown" style={{ ...styles.dropdown, right: openWithdrawals ? 20 : "auto" }}>
          {renderNotifications(loans, "loans")}
        </div>
      )}
  {!isMember && openPasswordRequests && (
  <div style={styles.notificationPanel}>
    <div style={styles.notificationHeader}>
      <h4 style={{ margin: 0 }}>Notifications</h4>

      <span
        style={styles.markAll}
        onClick={markAllPasswordRequestsRead}
      >
        Mark all as read
      </span>
    </div>

    <div style={styles.notificationTabs}>
  <button
    onClick={() => setNotifFilter("all")}
    style={notifFilter === "all" ? styles.activeTab : styles.tab}
  >
    All
  </button>

  <button
    onClick={() => setNotifFilter("unread")}
    style={notifFilter === "unread" ? styles.activeTab : styles.tab}
  >
    Unread
  </button>

  <button
    onClick={() => setNotifFilter("seen")}
    style={notifFilter === "seen" ? styles.activeTab : styles.tab}
  >
    Seen
  </button>
</div>

    <div style={styles.notificationList}>
      {renderPasswordRequests()}
    </div>
  </div>
)}
      {/* ================= CARDS ================= */}
      {/* ================= DASHBOARD STATS ================= */}

<div className="stats-grid">

  <DashboardCard
    title="Employees"
    value={stats.employees}
    icon="👥"
  />

  <DashboardCard
    title="Total Savings"
    value={`${stats.totalSavings} ETB`}
    icon="💰"
  />

  <DashboardCard
    title="Active Loans"
    value={stats.activeLoans}
    icon="🏦"
  />

  <DashboardCard
    title={`Deposits (${selectedMonth})`}
    value={`${stats.monthlyDeposits} ETB`}
    icon="📈"
  />

  <DashboardCard
    title="Registration Fees"
    value={`${stats.totalRegistrationFees} ETB`}
    icon="📝"
  />

  <DashboardCard
    title="Late Penalties"
    value={`${stats.totalLatePenalties} ETB`}
    icon="⚠️"
  />

</div>

{/* ================= ANALYTICS ================= */}

<div className="analytics-grid">

  <div className="analytics-card analytics-large">
    <div className="card-header">
      <h3>Savings Analytics</h3>
      <span>Current Year</span>
    </div>

    <div className="fake-chart">
      <div className="line-chart"></div>
    </div>
  </div>

  <div className="analytics-card">
    <div className="card-header">
      <h3>Loan Distribution</h3>
    </div>

    <div className="bars">
      <span style={{height:"70%"}}></span>
      <span style={{height:"90%"}}></span>
      <span style={{height:"60%"}}></span>
      <span style={{height:"95%"}}></span>
      <span style={{height:"80%"}}></span>
      <span style={{height:"100%"}}></span>
    </div>
  </div>

</div>
      {/* ================= 📱 የሞባይል ማስተካከያ (CSS Media Queries) ================= */}
    
    </div>
  );
}

// =========================
// 🛠️ ቋሚ ስታይሎች
// =========================
const styles = {

  

 dashboardHeader: {
  background:
    "linear-gradient(135deg,#1e3a8a,#4f46e5)",
  padding: "25px 30px",
  borderRadius: "24px",
  boxShadow:
    "0 15px 40px rgba(79,70,229,.25)",
  marginBottom: "30px"
},
 title: {
  color: "#fff",
  fontSize: "32px",
  fontWeight: "800",
  letterSpacing: ".5px"
},
  headerRightSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px"
  },
  topBar: { display: "flex", gap: 15 },

  filterBar: { display: "flex", gap: 10, alignItems: "center" },
  selectInput: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    outline: "none",
    fontSize: "14px",
    cursor: "pointer"
  },
  dropdown: {
    position: "absolute",
    top: 85,
    right: 20,
    width: 320,
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
    border: "1px solid #e2e8f0"
  },
  item: { padding: 10, marginBottom: 10, borderRadius: 8, display: "flex", justifyContent: "space-between", fontSize: "13px", gap: "10px" },
  actions: { display: "flex", gap: 5, alignItems: "center" },
  approve: { background: "green", color: "#fff", border: "none", cursor: "pointer", borderRadius: "4px", padding: "4px 8px" },
  reject: { background: "red", color: "#fff", border: "none", cursor: "pointer", borderRadius: "4px", padding: "4px 8px" },
  readBtn: { background: "#3498db", color: "#fff", border: "none", cursor: "pointer", borderRadius: "4px", padding: "4px 8px" },
  cardContainer: { 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
    gap: "20px",
    width: "100%",
    marginTop: "10px",
    boxSizing: "border-box"
  },
  empty: { textAlign: "center", color: "#888", fontSize: "13px" },
  text: { margin: "2px 0", fontSize: "12px", color: "#666" },

  

 notificationPanel: {
  position: "absolute",
  top: 90,
  right: 20,
  width: 430,
  maxHeight: 600,
  overflowY: "auto",

  backdropFilter: "blur(20px)",

  background:
    "rgba(255,255,255,.85)",

  border:
    "1px solid rgba(255,255,255,.4)",

  borderRadius: "24px",

  boxShadow:
    "0 25px 50px rgba(0,0,0,.15)",

  zIndex: 9999
},

notificationHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "15px",
  borderBottom: "1px solid #eee"
},

markAll: {
  color: "#4f46e5",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600
},

notificationTabs: {
  padding: "10px 15px"
},

activeTab: {
  background: "#4f46e5",
  color: "#fff",
  border: "none",
  padding: "8px 18px",
  borderRadius: "8px",
  cursor: "pointer"
},

notificationList: {
  padding: "10px"
},

notificationCard: {
  display: "flex",
  gap: "12px",
  padding: "15px",
  borderBottom: "1px solid #eee",
  alignItems: "flex-start"
},

notificationIcon: {
  width: "45px",
  height: "45px",
  borderRadius: "50%",
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px"
},



notificationText: {
  margin: "4px 0",
  fontSize: "13px",
  color: "#555"
},

notificationTime: {
  marginTop: "6px",
  fontSize: "12px",
  color: "#999"
},
tab: {
  background: "#f1f5f9",
  color: "#333",
  border: "none",
  padding: "8px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  marginRight: "8px"
},
};