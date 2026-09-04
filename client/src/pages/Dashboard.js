import React, { useEffect, useState } from "react";
import DashboardCard from "../components/DashboardCard";
import API from "../services/api";
import "./Dashboard.css"

export default function Dashboard() {
const userRole = localStorage.getItem("userRole")?.toLowerCase() || "member";
const isMember = userRole === "member";
const withdrawalNotificationEnabled =
  localStorage.getItem("withdrawalNotification") !== "false";

const loanNotificationEnabled =
  localStorage.getItem("loanNotification") !== "false";

const passwordNotificationEnabled =
  localStorage.getItem("passwordNotification") !== "false";
const [passwordRequests, setPasswordRequests] = useState([]);
const [openPasswordRequests, setOpenPasswordRequests] = useState(false);

  const [withdrawals, setWithdrawals] = useState([]);
  const [loans, setLoans] = useState([]);
  const [deposits, setDeposits] = useState([]);

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

  const [savingsData, setSavingsData] = useState([]);
  const [loanDistribution, setLoanDistribution] = useState({});

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

  API.get("/deposits")
    .then((res) => setDeposits(res.data || []))
    .catch(() => setDeposits([]));

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
        const [empRes, depRes, loanRes] = await Promise.all([
          API.get("/employees"),
          API.get("/deposits"),
          API.get("/loans"),
        ]);

        const depositsData = depRes.data || [];
        const loansData = loanRes.data || [];

        const employeesCount = empRes.data?.length || 0;

        // ===== TOTAL SAVINGS (All time) =====
        const totalSavings = depositsData.reduce((sum, d) => {
          const normalSaving = parseFloat(d.normalSaving) || 0;
          const voluntarySaving = parseFloat(d.voluntarySaving) || 0;
          return sum + normalSaving + voluntarySaving;
        }, 0);

        // ===== MONTHLY DEPOSITS =====
        const monthlyDeposits = depositsData
          .filter((d) => d.month === selectedMonth && String(d.year) === selectedYear)
          .reduce((sum, d) => {
            const normalSaving = parseFloat(d.normalSaving) || 0;
            const voluntarySaving = parseFloat(d.voluntarySaving) || 0;
            return sum + normalSaving + voluntarySaving;
          }, 0);

        // ===== REGISTRATION FEES (From deposits collection) =====
        const totalRegistrationFees = depositsData
          .filter((d) => d.month === selectedMonth && String(d.year) === selectedYear)
          .reduce((sum, d) => sum + (parseFloat(d.registrationFee) || 0), 0);

        // ===== LATE PENALTIES (From deposits collection) =====
        const totalLatePenalties = depositsData
          .filter((d) => d.month === selectedMonth && String(d.year) === selectedYear)
          .reduce((sum, d) => sum + (parseFloat(d.latePenalty) || 0), 0);

        // ===== ACTIVE LOANS =====
        const activeLoans = loansData.filter((l) => l.status === "approved" && l.remainingAmount > 0).length;

        setStats({
          employees: employeesCount,
          totalSavings,
          activeLoans,
          monthlyDeposits,
          totalRegistrationFees,
          totalLatePenalties,
        });

        // ===== SAVINGS ANALYTICS BY MONTH =====
        const monthlySavings = {};
        depositsData
          .filter((d) => String(d.year) === selectedYear)
          .forEach((d) => {
            const monthIndex = months.indexOf(d.month);
            if (!monthlySavings[monthIndex]) {
              monthlySavings[monthIndex] = 0;
            }
            const normalSaving = parseFloat(d.normalSaving) || 0;
            const voluntarySaving = parseFloat(d.voluntarySaving) || 0;
            monthlySavings[monthIndex] += normalSaving + voluntarySaving;
          });

        const savingsArray = months.map((_, index) => monthlySavings[index] || 0);
        setSavingsData(savingsArray);

        // ===== LOAN DISTRIBUTION BY STATUS =====
        const distribution = {
          approved: loansData.filter((l) => l.status === "approved").length,
          pending: loansData.filter((l) => l.status === "pending").length,
          rejected: loansData.filter((l) => l.status === "rejected").length,
        };
        setLoanDistribution(distribution);

      } catch (err) {
        console.log("Dashboard stats error:", err);
      }
    };
    fetchStats();
  }, [selectedMonth, selectedYear]);

  // =========================
  // NOTIFICATION COUNTS
  // =========================
const unreadWithdrawals = withdrawalNotificationEnabled
  ? withdrawals.filter(
      (w) =>
        w.isRead !== true &&
        w.status !== "approved" &&
        w.status !== "rejected"
    ).length
  : 0;

const unreadLoans = loanNotificationEnabled
  ? loans.filter(
      (l) =>
        l.isRead !== true &&
        l.status !== "approved" &&
        l.status !== "rejected"
    ).length
  : 0;

const unreadPasswordRequests = passwordNotificationEnabled
  ? passwordRequests.filter(
      (p) =>
        p.isRead !== true &&
        p.status !== "approved" &&
        p.status !== "rejected"
    ).length
  : 0;

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

  if (!withdrawal) {
    console.error("Withdrawal request not found");
    return;
  }

  const employeeId =
    withdrawal.employeeId?._id ||
    withdrawal.employeeId;

  console.log("Termination Payload:", {
    employeeId,
    totalSaving: withdrawal.totalSaving,
    reason: withdrawal.reason
  });

  await API.put(
    `/employees/${employeeId}/terminate`,
    {
      totalSaving: withdrawal.totalSaving,
      reason: withdrawal.reason
    }
  );

  setWithdrawals((prev) =>
    prev.filter(
      (w) => w._id !== id
    )
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
  className="notification-card"
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

      <div
  className="notification-actions"
  style={styles.actions}
>

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
    <strong
      style={{
        color: "#000",
        fontSize: "14px",
        fontWeight: "700",
        display: "block",
        marginBottom: "4px",
      }}
    >
    fullName: {item.fullName}
    </strong>

    <p style={styles.text}>
      Reason: {item.reason}
    </p>

    <p style={styles.text}>
      Amount: {item.totalSaving} ETB
    </p>
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
        <div
  className="notification-actions"
  style={styles.actions}
>
          <button onClick={() => handleApprove(type, item._id)} style={styles.approve}>✔</button>
          <button onClick={() => handleReject(type, item._id)} style={styles.reject}>✖</button>
        </div>
      </div>
    ));
  };

  const maxSavings = Math.max(...savingsData, 1);
  const totalLoans = Object.values(loanDistribution).reduce((a, b) => a + b, 1);

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
      {withdrawalNotificationEnabled && unreadWithdrawals > 0 && (
        <span className="badge">{unreadWithdrawals}</span>
      )}
    </div>

    <div
      className="notifItem"
      onClick={() => setOpenLoans(!openLoans)}
    >
      💰 Loans
      {loanNotificationEnabled && unreadLoans > 0 && (
        <span className="badge">{unreadLoans}</span>
      )}
    </div>

    <div
      className="notifItem"
      onClick={() => setOpenPasswordRequests(!openPasswordRequests)}
    >
      🔑 Password Reset
      {passwordNotificationEnabled && unreadPasswordRequests > 0 && (
        <span className="badge">{unreadPasswordRequests}</span>
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
    {withdrawalNotificationEnabled ? (
      renderNotifications(withdrawals, "withdrawals")
    ) : (
      <p style={styles.empty}>Notifications disabled</p>
    )}
  </div>
)}

{!isMember && openLoans && (
  <div className="dashboard-notif-dropdown" style={styles.dropdown}>
    {loanNotificationEnabled ? (
      renderNotifications(loans, "loans")
    ) : (
      <p style={styles.empty}>Notifications disabled</p>
    )}
  </div>
)}

{!isMember && openPasswordRequests && (
  <div className="notification-panel" style={styles.notificationPanel}>
    {passwordNotificationEnabled ? (
      <>
        <div
          className="notification-header"
          style={styles.notificationHeader}
        >
          <h4 style={{ margin: 0 }}>Notifications</h4>

          <span
            style={styles.markAll}
            onClick={markAllPasswordRequestsRead}
          >
            Mark all as read
          </span>
        </div>

        <div
          className="notification-tabs"
          style={styles.notificationTabs}
        >
          <button
            onClick={() => setNotifFilter("all")}
            style={
              notifFilter === "all"
                ? styles.activeTab
                : styles.tab
            }
          >
            All
          </button>

          <button
            onClick={() => setNotifFilter("unread")}
            style={
              notifFilter === "unread"
                ? styles.activeTab
                : styles.tab
            }
          >
            Unread
          </button>

          <button
            onClick={() => setNotifFilter("seen")}
            style={
              notifFilter === "seen"
                ? styles.activeTab
                : styles.tab
            }
          >
            Seen
          </button>
        </div>

        <div style={styles.notificationList}>
          {renderPasswordRequests()}
        </div>
      </>
    ) : (
      <p style={styles.empty}>
        Password reset notifications are disabled
      </p>
    )}
  </div>
)}

      {/* ================= CARDS ================= */}
      {/* ================= DASHBOARD STATS ================= */}

<div className="stats-grid">

  <DashboardCard
    title="Members"
    value={stats.employees}
    icon="👥"
  />

  <DashboardCard
    title="Total Savings"
    value={`${stats.totalSavings.toFixed(2)} ETB`}
    icon="💰"
  />

  <DashboardCard
    title="Active Loans"
    value={stats.activeLoans}
    icon="🏦"
  />

  <DashboardCard
    title={`Deposits (${selectedMonth})`}
    value={`${stats.monthlyDeposits.toFixed(2)} ETB`}
    icon="📈"
  />

  <DashboardCard
    title="Registration Fees"
    value={`${stats.totalRegistrationFees.toFixed(2)} ETB`}
    icon="📝"
  />

  <DashboardCard
    title="Late Penalties"
    value={`${stats.totalLatePenalties.toFixed(2)} ETB`}
    icon="⚠️"
  />

</div>

{/* ================= ANALYTICS ================= */}

<div className="analytics-grid">

  <div className="analytics-card analytics-large">
    <div className="card-header">
      <h3>Savings Analytics</h3>
      <span>{selectedYear}</span>
    </div>

    <div className="line-chart-container" style={styles.chartContainer}>
      <div style={styles.chartBars}>
        {savingsData.map((value, index) => (
          <div key={index} style={styles.barWrapper}>
            <div
              style={{
                ...styles.bar,
                height: `${(value / maxSavings) * 150}px`,
                backgroundColor: '#4f46e5'
              }}
              title={`${months[index]}: ${value.toFixed(2)} ETB`}
            >
              {value > 0 && (
                <span style={styles.barLabel}>
                  {(value / 1000).toFixed(1)}K
                </span>
              )}
            </div>
            <span style={styles.monthLabel}>{months[index].slice(0, 3)}</span>
          </div>
        ))}
      </div>
      <div style={styles.chartLegend}>
        <p>Monthly Savings (ETB)</p>
        <small style={{ color: '#888' }}>Max: {(maxSavings / 1000).toFixed(1)}K ETB</small>
      </div>
    </div>
  </div>

  <div className="analytics-card">
    <div className="card-header">
      <h3>Loan Distribution</h3>
      <span>{totalLoans} Total</span>
    </div>

    <div className="distribution-container" style={styles.distributionContainer}>
      <div style={styles.distributionItem}>
        <div
          style={{
            ...styles.distributionBar,
            height: `${(loanDistribution.approved / totalLoans) * 150}px`,
            backgroundColor: '#10b981'
          }}
          title={`Approved: ${loanDistribution.approved}`}
        ></div>
        <span style={styles.distributionLabel}>Approved</span>
        <strong style={{ color: '#10b981', marginTop: '4px' }}>{loanDistribution.approved}</strong>
      </div>

      <div style={styles.distributionItem}>
        <div
          style={{
            ...styles.distributionBar,
            height: `${(loanDistribution.pending / totalLoans) * 150}px`,
            backgroundColor: '#f59e0b'
          }}
          title={`Pending: ${loanDistribution.pending}`}
        ></div>
        <span style={styles.distributionLabel}>Pending</span>
        <strong style={{ color: '#f59e0b', marginTop: '4px' }}>{loanDistribution.pending}</strong>
      </div>

      <div style={styles.distributionItem}>
        <div
          style={{
            ...styles.distributionBar,
            height: `${(loanDistribution.rejected / totalLoans) * 150}px`,
            backgroundColor: '#ef4444'
          }}
          title={`Rejected: ${loanDistribution.rejected}`}
        ></div>
        <span style={styles.distributionLabel}>Rejected</span>
        <strong style={{ color: '#ef4444', marginTop: '4px' }}>{loanDistribution.rejected}</strong>
      </div>
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
    background: "linear-gradient(135deg,#1e3a8a,#4f46e5)",
    padding: "25px 30px",
    borderRadius: "24px",
    boxShadow: "0 15px 40px rgba(79,70,229,.25)",
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
    alignItems: "center",
    width: "100%",
    gap: "10px"
  },
  topBar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%"
  },
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
    position:"absolute",
    top:85,
    right:20,
    width:"320px",
    maxWidth:"95vw",
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
    border: "1px solid #e2e8f0"
  },
  item: { padding: 10, marginBottom: 10, borderRadius: 8, display: "flex", justifyContent: "space-between", fontSize: "13px", gap: "10px" },
  actions: { display:"flex", gap:5, flexWrap:"wrap", alignItems: "center" },
  approve: { background: "green", color: "#fff", border: "none", cursor: "pointer", borderRadius: "4px", padding: "4px 8px" },
  reject: { background: "red", color: "#fff", border: "none", cursor: "pointer", borderRadius: "4px", padding: "4px 8px" },
  readBtn: { background: "#3498db", color: "#fff", border: "none", cursor: "pointer", borderRadius: "4px", padding: "4px 8px" },
  empty: { textAlign: "center", color: "#888", fontSize: "13px" },
  text: { margin: "2px 0", fontSize: "12px", color: "#666" },

  notificationPanel: {
    position: "absolute",
    top: 90,
    right: 20,
    width:"430px",
    maxWidth:"95vw",
    maxHeight: 600,
    overflowY: "auto",
    backdropFilter: "blur(20px)",
    background: "rgba(255,255,255,.85)",
    border: "1px solid rgba(255,255,255,.4)",
    borderRadius: "24px",
    boxShadow: "0 25px 50px rgba(0,0,0,.15)",
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
    display:"flex",
    gap:"12px",
    flexWrap:"wrap",
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

  chartContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    gap: "15px"
  },

  chartBars: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: "8px",
    height: "200px",
    width: "100%"
  },

  barWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
    flex: 1,
    maxWidth: "35px"
  },

  bar: {
    width: "100%",
    borderRadius: "4px 4px 0 0",
    transition: "all 0.3s ease",
    cursor: "pointer",
    minHeight: "4px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  barLabel: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "700",
    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
    whiteSpace: "nowrap",
    pointerEvents: "none"
  },

  monthLabel: {
    fontSize: "11px",
    color: "#666",
    fontWeight: "600"
  },

  chartLegend: {
    textAlign: "center",
    marginTop: "10px"
  },

  distributionContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: "30px",
    padding: "30px 20px",
    height: "220px"
  },

  distributionItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px"
  },

  distributionBar: {
    width: "50px",
    borderRadius: "8px 8px 0 0",
    transition: "all 0.3s ease",
    cursor: "pointer",
    minHeight: "4px"
  },

  distributionLabel: {
    fontSize: "12px",
    color: "#666",
    fontWeight: "600"
  }
};