import React, { useEffect, useState } from "react";
import DashboardCard from "../components/DashboardCard";
import API from "../services/api";

export default function Dashboard() {

  const [withdrawals, setWithdrawals] = useState([]);
  const [loans, setLoans] = useState([]);

  const [openWithdrawals, setOpenWithdrawals] = useState(false);
  const [openLoans, setOpenLoans] = useState(false);

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
  }, []);

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
  const unreadWithdrawals = withdrawals.filter((w) => w.isRead !== true).length;
  const unreadLoans = loans.filter((l) => l.isRead !== true).length;

  const markAsRead = async (type, id) => {
    await API.put(`/${type}/${id}/read`);
    if (type === "withdrawals") {
      setWithdrawals((prev) => prev.map((w) => w._id === id ? { ...w, isRead: true } : w));
    } else {
      setLoans((prev) => prev.map((l) => l._id === id ? { ...l, isRead: true } : l));
    }
  };

  const handleApprove = async (type, id) => {
    try {
      await API.put(`/${type}/${id}/approve`);
      if (type === "loans") {
        setLoans((prev) => prev.filter((l) => l._id !== id));
        setStats((prev) => ({ ...prev, activeLoans: prev.activeLoans + 1 }));
      }
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  const handleReject = async (type, id) => {
    try {
      await API.put(`/${type}/${id}/reject`);
      if (type === "loans") {
        setLoans((prev) => prev.filter((l) => l._id !== id));
      }
    } catch (err) {
      console.error("Reject error:", err);
    }
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
          <button onClick={() => markAsRead(type, item._id)} style={styles.readBtn}>✔</button>
          <button onClick={() => handleApprove(type, item._id)} style={styles.approve}>✔</button>
          <button onClick={() => handleReject(type, item._id)} style={styles.reject}>✖</button>
        </div>
      </div>
    ));
  };

  return (
    <div className="dashboard-main-container" style={styles.container}>

      {/* ================= 🛠️ ራስጌ (Header) ================= */}
      <div className="dashboard-header-block" style={styles.dashboardHeader}>
        <h2 className="dashboard-title-text" style={styles.title}>Micro-finance Dashboard</h2>

        <div className="dashboard-right-controls" style={styles.headerRightSection}>
          <div style={styles.topBar}>
            <div style={styles.notifItem} onClick={() => setOpenWithdrawals(!openWithdrawals)}>
              🔔 Withdrawals {unreadWithdrawals > 0 && <span style={styles.badge}>{unreadWithdrawals}</span>}
            </div>
            <div style={styles.notifItem} onClick={() => setOpenLoans(!openLoans)}>
              💰 Loans {unreadLoans > 0 && <span style={styles.badge}>{unreadLoans}</span>}
            </div>
          </div>

          <div style={styles.filterBar}>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={styles.selectInput}>
              {months.map((m) => <option key={m}>{m}</option>)}
            </select>

            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={styles.selectInput}>
              {Array.from({ length: 10 }, (_, i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y}>{y}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      {/* ================= DROPDOWNS ================= */}
      {openWithdrawals && (
        <div className="dashboard-notif-dropdown" style={styles.dropdown}>
          {renderNotifications(withdrawals, "withdrawals")}
        </div>
      )}

      {openLoans && (
        <div className="dashboard-notif-dropdown" style={{ ...styles.dropdown, right: openWithdrawals ? 20 : "auto" }}>
          {renderNotifications(loans, "loans")}
        </div>
      )}

      {/* ================= CARDS ================= */}
      <div className="dashboard-cards-grid" style={styles.cardContainer}>
        <DashboardCard title="Employees" value={stats.employees} />
        <DashboardCard title="Total Savings" value={`${stats.totalSavings} ETB`} />
        <DashboardCard title="Active Loans" value={stats.activeLoans} />
        <DashboardCard title={`Deposits (${selectedMonth})`} value={`${stats.monthlyDeposits} ETB`} />
        <DashboardCard title="Registration Fees" value={`${stats.totalRegistrationFees} ETB`} />
        <DashboardCard title="Late Penalties" value={`${stats.totalLatePenalties} ETB`} />
      </div>

      {/* ================= 📱 የሞባይል ማስተካከያ (CSS Media Queries) ================= */}
      <style>
        {`
          @media (max-width: 768px) {
            .dashboard-main-container {
              padding: 10px 15px !important;
            }
            .dashboard-header-block {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 15px !important;
              margin-bottom: 20px !important;
            }
            .dashboard-title-text {
              font-size: 20px !important;
              text-align: left !important;
              width: 100%;
            }
            .dashboard-right-controls {
              align-items: flex-start !important;
              width: 100%;
              gap: 10px !important;
            }
            .dashboard-cards-grid {
              grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) !important;
              gap: 15px !important;
            }
            .dashboard-notif-dropdown {
              width: calc(100% - 30px) !important;
              right: 15px !important;
              left: 15px !important;
              box-sizing: border-box !important;
              top: 145px !important;
            }
          }
          @media (max-width: 480px) {
            .dashboard-cards-grid {
              grid-template-columns: 1fr !important; /* በጣም ጠባብ ስክሪን ላይ 1 ረድፍ ብቻ ይሆናሉ */
            }
          }
        `}
      </style>
    </div>
  );
}

// =========================
// 🛠️ ቋሚ ስታይሎች
// =========================
const styles = {
  container: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 20px",
    position: "relative"
  },
  dashboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "15px",
    flexWrap: "wrap",
    gap: "15px"
  },
  title: { 
    color: "#3498db", 
    margin: 0,
    fontWeight: "bold",
    fontSize: "26px"
  },
  headerRightSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px"
  },
  topBar: { display: "flex", gap: 15 },
  notifItem: { position: "relative", cursor: "pointer", padding: "8px 12px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, fontWeight: "bold", fontSize: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  badge: { position: "absolute", top: -6, right: -10, background: "red", color: "#fff", borderRadius: "50%", padding: "2px 6px", fontSize: 11, fontWeight: "bold" },
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
};