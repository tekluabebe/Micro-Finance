import React, { useEffect, useState } from "react";
import DashboardCard from "../components/DashboardCard";
import API from "../services/api";
import { useAppContext } from "./context";
import { translate } from "../utils/translations";
import "./Dashboard.css"

export default function Dashboard() {
  const { language } = useAppContext();
  const amharic = language === "Amharic";
  const tr = (text) => amharic ? ({
    "No notifications": "ምንም ማሳወቂያ የለም",
    "No password reset requests": "የይለፍ ቃል ዳግም ማስጀመር ጥያቄ የለም",
    "Password Reset Request": "የይለፍ ቃል ዳግም ማስጀመር ጥያቄ",
    "Member ID": "የአባል መለያ",
    "Password reset requested": "የይለፍ ቃል ዳግም ማስጀመር ተጠይቋል",
    "Reason": "ምክንያት",
    "Amount": "መጠን",
    "Employee ID:": "የሰራተኛ መለያ:",
    "Borrower:": "ተበዳሪ:",
    "Guarantors (ዋሶች):": "ዋሶች:",
    "No guarantors listed!": "ምንም ዋስ አልተዘረዘረም!",
    "Status:": "ሁኔታ:",
    "approved": "ጸድቋል",
    "rejected": "ውድቅ ተደርጓል",
    "pending": "በመጠባበቅ ላይ",
    "Welcome to Micro-finance Dashboard": "ወደ ማይክሮፋይናንስ ዳሽቦርድ እንኳን በደህና መጡ",
    "User Avatar": "የተጠቃሚ ምስል",
    "Withdrawals": "ገንዘብ ማውጣት",
    "Loans": "ብድሮች",
    "Password Reset": "የይለፍ ቃል ዳግም ማስጀመር",
    "Filter by month": "በወር አጣራ",
    "Filter by year": "በዓመት አጣራ",
    "Switch to light theme": "ወደ ብርሃን ገጽታ ቀይር",
    "Switch to dark theme": "ወደ ጨለማ ገጽታ ቀይር",
    "Light": "ብርሃን",
    "Dark": "ጨለማ",
    "Notifications disabled": "ማሳወቂያዎች ተሰናክለዋል",
    "Notifications": "ማሳወቂያዎች",
    "Mark all as read": "ሁሉንም እንደተነበቡ ምልክት አድርግ",
    "All": "ሁሉም",
    "Unread": "ያልተነበቡ",
    "Seen": "የታዩ",
    "Password reset notifications are disabled": "የይለፍ ቃል ዳግም ማስጀመር ማሳወቂያዎች ተሰናክለዋል",
    "Members": "አባላት",
    "Total Savings": "ጠቅላላ ቁጠባ",
    "Active Loans": "ንቁ ብድሮች",
    "Deposits": "ተቀማጭ ገንዘብ",
    "Registration Fees": "የምዝገባ ክፍያ",
    "Late Penalties": "የዘገየ ክፍያ ቅጣቶች",
    "Savings Analytics": "የቁጠባ ትንተና",
    "Loading...": "በመጫን ላይ...",
    "Unavailable": "አይገኝም",
    "Monthly Savings (ETB)": "ወርሃዊ ቁጠባ (ብር)",
    "Loan Distribution": "የብድር ስርጭት",
    "Total": "ጠቅላላ",
    "Loading savings data...": "የቁጠባ መረጃ በመጫን ላይ...",
    "Savings data is unavailable.": "የቁጠባ መረጃ አይገኝም።",
    "No savings recorded for this year.": "ለዚህ ዓመት ቁጠባ አልተመዘገበም።",
    "Max:": "ከፍተኛ:",
    "Loading loan data...": "የብድር መረጃ በመጫን ላይ...",
    "Loan data is unavailable.": "የብድር መረጃ አይገኝም።",
    "No loan requests to display.": "የሚታይ የብድር ጥያቄ የለም።",
    "Approved": "የጸደቀ",
    "Pending": "በመጠባበቅ ላይ",
    "Rejected": "ውድቅ የተደረገ",
    "Dashboard data could not be loaded. Please try again.": "የዳሽቦርድ መረጃ መጫን አልተቻለም። እንደገና ይሞክሩ።",
    "User": "ተጠቃሚ",
    "member": "አባል",
    "admin": "አስተዳዳሪ",
  }[text] || text) : translate(language, text);
  const monthLabels = {
    January: "ጃንዋሪ", February: "ፌብሩዋሪ", March: "ማርች",
    April: "ኤፕሪል", May: "ሜይ", June: "ጁን",
    July: "ጁላይ", August: "ኦገስት", September: "ሴፕቴምበር",
    October: "ኦክቶበር", November: "ኖቬምበር", December: "ዲሴምበር",
  };
  const displayMonth = (month) => amharic ? monthLabels[month] || month : month;
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
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })() || {};

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.fullName ||
    user.name ||
    tr("User");

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
  const [isLoading, setIsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

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
      setIsLoading(true);
      setStatsError("");
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
        setIsLoading(false);

      } catch (err) {
        console.log("Dashboard stats error:", err);
        setStatsError("Dashboard data could not be loaded. Please try again.");
        setIsLoading(false);
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
        {tr("No password reset requests")}
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
          {tr("Password Reset Request")}
        </strong>

        <p style={styles.notificationText}>
          {tr("Member ID")}: {item.memberId}
        </p>

        <p style={styles.notificationText}>
          {item.fullName}
        </p>

        <p style={styles.notificationTime}>
          {tr("Password reset requested")}
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
    if (!unreadItems.length) return <p style={styles.empty}>{tr("No notifications")}</p>;

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
      {tr("Reason")}: {item.reason}
    </p>

    <p style={styles.text}>
      {tr("Amount")}: {item.totalSaving} ETB
    </p>
  </>
)}

          {type === "loans" && (
            <>
              <p style={styles.text}><strong>{tr("Employee ID:")}</strong> {item.employeeId?.memberId || "N/A"}</p>
              <p style={styles.text}><strong>{tr("Borrower:")}</strong> {item.employeeId?.firstName} {item.employeeId?.lastName}</p>
              <p style={styles.text}><strong>{tr("Amount")}:</strong> {item.principalAmount} ETB</p>
              <div style={{ marginTop: "5px", padding: "5px", background: "#fff", borderRadius: "5px", border: "1px solid #ddd" }}>
                <strong style={{ fontSize: "11px", color: "#555" }}>{tr("Guarantors (ዋሶች):")}</strong>
                <ul style={{ margin: "3px 0", paddingLeft: "15px", listStyleType: "square" }}>
                  {item.guarantors && item.guarantors.length > 0 ? (
                    item.guarantors.map((g, index) => <li key={index} style={{ fontSize: "11px", color: "#333" }}>{g.firstName} {g.lastName}</li>)
                  ) : (
                    <li style={{ fontSize: "11px", color: "red" }}>{tr("No guarantors listed!")}</li>
                  )}
                </ul>
              </div>
              <p style={styles.text}>
                <strong>{tr("Status:")}</strong>{" "}
                <span style={{ color: item.status === "approved" ? "green" : item.status === "rejected" ? "red" : "orange", fontWeight: "bold" }}>
                  {tr(item.status || "pending")}
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

  const maxSavings = Math.max(...savingsData, 0);
  const totalLoans = Object.values(loanDistribution).reduce((a, b) => a + b, 0);

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
      👋 {tr("Welcome to Micro-finance Dashboard")}
    </h1>
  </div>

  <div className="user-profile-box">
  <img
    src="/avator.jpg"
    alt={tr("User Avatar")}
    className="user-avatar"
  />

  <div>
    <h3>{fullName}</h3>
    <span>{tr(userRole)}</span>
  </div>
</div>
</div>

        <div className="dashboard-right-controls" style={styles.headerRightSection}>
{!isMember && (
  <div style={styles.topBar}>
    <button
      type="button"
      className="notifItem"
      aria-expanded={openWithdrawals}
      aria-controls="withdrawal-notifications"
      onClick={() => setOpenWithdrawals(!openWithdrawals)}
    >
      🔔 {tr("Withdrawals")}
      {withdrawalNotificationEnabled && unreadWithdrawals > 0 && (
        <span className="badge">{unreadWithdrawals}</span>
      )}
    </button>

    <button
      type="button"
      className="notifItem"
      aria-expanded={openLoans}
      aria-controls="loan-notifications"
      onClick={() => setOpenLoans(!openLoans)}
    >
      💰 {tr("Loans")}
      {loanNotificationEnabled && unreadLoans > 0 && (
        <span className="badge">{unreadLoans}</span>
      )}
    </button>

    <button
      type="button"
      className="notifItem"
      aria-expanded={openPasswordRequests}
      aria-controls="password-reset-notifications"
      onClick={() => setOpenPasswordRequests(!openPasswordRequests)}
    >
      🔑 {tr("Password Reset")}
      {passwordNotificationEnabled && unreadPasswordRequests > 0 && (
        <span className="badge">{unreadPasswordRequests}</span>
      )}
    </button>
  </div>
)}
          <div style={styles.filterBar}>
            <select aria-label={tr("Filter by month")} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="selectInput">
              {months.map((m) => <option key={m} value={m}>{displayMonth(m)}</option>)}
            </select>

            <select aria-label={tr("Filter by year")} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="selectInput">
              {Array.from({ length: 10 }, (_, i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y}>{y}</option>;
              })}
            </select>
             <div className={darkMode ? "dark-dashboard" : "light-dashboard"}>
            <button
  type="button"
  aria-label={tr(darkMode ? "Switch to light theme" : "Switch to dark theme")}
  onClick={() => setDarkMode(!darkMode)}
  className="theme-toggle"
>
  {darkMode ? `☀️ ${tr("Light")}` : `🌙 ${tr("Dark")}`}
</button> </div>
          </div>
        </div>
      </div>

      {/* ================= DROPDOWNS ================= */}
{!isMember && openWithdrawals && (
  <div id="withdrawal-notifications" className="dashboard-notif-dropdown" style={styles.dropdown}>
    {withdrawalNotificationEnabled ? (
      renderNotifications(withdrawals, "withdrawals")
    ) : (
      <p style={styles.empty}>{tr("Notifications disabled")}</p>
    )}
  </div>
)}

{!isMember && openLoans && (
  <div id="loan-notifications" className="dashboard-notif-dropdown" style={styles.dropdown}>
    {loanNotificationEnabled ? (
      renderNotifications(loans, "loans")
    ) : (
      <p style={styles.empty}>{tr("Notifications disabled")}</p>
    )}
  </div>
)}

{!isMember && openPasswordRequests && (
  <div id="password-reset-notifications" className="notification-panel" style={styles.notificationPanel}>
    {passwordNotificationEnabled ? (
      <>
        <div
          className="notification-header"
          style={styles.notificationHeader}
        >
          <h4 style={{ margin: 0 }}>{tr("Notifications")}</h4>

          <span
            style={styles.markAll}
            onClick={markAllPasswordRequestsRead}
          >
            {tr("Mark all as read")}
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
            {tr("All")}
          </button>

          <button
            onClick={() => setNotifFilter("unread")}
            style={
              notifFilter === "unread"
                ? styles.activeTab
                : styles.tab
            }
          >
            {tr("Unread")}
          </button>

          <button
            onClick={() => setNotifFilter("seen")}
            style={
              notifFilter === "seen"
                ? styles.activeTab
                : styles.tab
            }
          >
            {tr("Seen")}
          </button>
        </div>

        <div style={styles.notificationList}>
          {renderPasswordRequests()}
        </div>
      </>
    ) : (
      <p style={styles.empty}>
        {tr("Password reset notifications are disabled")}
      </p>
    )}
  </div>
)}

      {/* ================= CARDS ================= */}
      {/* ================= DASHBOARD STATS ================= */}

      {statsError && (
        <p className="dashboard-error" role="alert">
          {tr(statsError)}
        </p>
      )}

<div className="stats-grid">

  <DashboardCard
    title={tr("Members")}
    value={isLoading ? tr("Loading...") : statsError ? tr("Unavailable") : stats.employees}
    icon="👥"
  />

  <DashboardCard
    title={tr("Total Savings")}
    value={isLoading ? tr("Loading...") : statsError ? tr("Unavailable") : `${stats.totalSavings.toFixed(2)} ETB`}
    icon="💰"
  />

  <DashboardCard
    title={tr("Active Loans")}
    value={isLoading ? tr("Loading...") : statsError ? tr("Unavailable") : stats.activeLoans}
    icon="🏦"
  />

  <DashboardCard
    title={`${tr("Deposits")} (${selectedMonth})`}
    value={isLoading ? tr("Loading...") : statsError ? tr("Unavailable") : `${stats.monthlyDeposits.toFixed(2)} ETB`}
    icon="📈"
  />

  <DashboardCard
    title={tr("Registration Fees")}
    value={isLoading ? tr("Loading...") : statsError ? tr("Unavailable") : `${stats.totalRegistrationFees.toFixed(2)} ETB`}
    icon="📝"
  />

  <DashboardCard
    title={tr("Late Penalties")}
    value={isLoading ? tr("Loading...") : statsError ? tr("Unavailable") : `${stats.totalLatePenalties.toFixed(2)} ETB`}
    icon="⚠️"
  />

</div>

{/* ================= ANALYTICS ================= */}

<div className="analytics-grid">

  <div className="analytics-card analytics-large">
    <div className="card-header">
      <h3>{tr("Savings Analytics")}</h3>
      <span>{selectedYear}</span>
    </div>

    <div className="line-chart-container" style={styles.chartContainer}>
      <div style={styles.chartBars}>
        {!isLoading && !statsError && savingsData.some((value) => value > 0) ? savingsData.map((value, index) => (
          <div key={index} style={styles.barWrapper}>
            <div
              style={{
                ...styles.bar,
                height: `${maxSavings ? (value / maxSavings) * 150 : 0}px`,
                backgroundColor: '#4f46e5'
              }}
              title={`${displayMonth(months[index])}: ${value.toFixed(2)} ETB`}
            >
              {value > 0 && (
                <span style={styles.barLabel}>
                  {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(0)}
                </span>
              )}
            </div>
            <span style={styles.monthLabel}>{displayMonth(months[index]).slice(0, 3)}</span>
          </div>
        )) : (
          <p className="chart-state" role={statsError ? "alert" : undefined}>
            {isLoading ? tr("Loading savings data...") : statsError ? tr("Savings data is unavailable.") : tr("No savings recorded for this year.")}
          </p>
        )}
      </div>
      <div className="chartLegend" style={styles.chartLegend}>
        <p>{tr("Monthly Savings (ETB)")}</p>
        <small style={{ color: '#888' }}>{tr("Max:")} {(maxSavings / 1000).toFixed(1)}K ETB</small>
      </div>
    </div>
  </div>

  <div className="analytics-card">
    <div className="card-header">
      <h3>{tr("Loan Distribution")}</h3>
      <span>{totalLoans} {tr("Total")}</span>
    </div>

    <div className="distribution-container" style={styles.distributionContainer}>
      {isLoading || statsError ? (
        <p className="chart-state" role={statsError ? "alert" : undefined}>
          {isLoading ? tr("Loading loan data...") : tr("Loan data is unavailable.")}
        </p>
      ) : totalLoans === 0 ? (
        <p className="chart-state">{tr("No loan requests to display.")}</p>
      ) : <>
      <div style={styles.distributionItem}>
        <div
          style={{
            ...styles.distributionBar,
            height: `${(loanDistribution.approved / totalLoans) * 150}px`,
            backgroundColor: '#10b981'
          }}
          title={`${tr("Approved")}: ${loanDistribution.approved}`}
        ></div>
        <span style={styles.distributionLabel}>{tr("Approved")}</span>
        <strong style={{ color: '#10b981', marginTop: '4px' }}>{loanDistribution.approved}</strong>
      </div>

      <div style={styles.distributionItem}>
        <div
          style={{
            ...styles.distributionBar,
            height: `${(loanDistribution.pending / totalLoans) * 150}px`,
            backgroundColor: '#f59e0b'
          }}
          title={`${tr("Pending")}: ${loanDistribution.pending}`}
        ></div>
        <span style={styles.distributionLabel}>{tr("Pending")}</span>
        <strong style={{ color: '#f59e0b', marginTop: '4px' }}>{loanDistribution.pending}</strong>
      </div>

      <div style={styles.distributionItem}>
        <div
          style={{
            ...styles.distributionBar,
            height: `${(loanDistribution.rejected / totalLoans) * 150}px`,
            backgroundColor: '#ef4444'
          }}
          title={`${tr("Rejected")}: ${loanDistribution.rejected}`}
        ></div>
        <span style={styles.distributionLabel}>{tr("Rejected")}</span>
        <strong style={{ color: '#ef4444', marginTop: '4px' }}>{loanDistribution.rejected}</strong>
      </div>
      </>}
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