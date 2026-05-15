import React, { useEffect, useRef, useState } from "react";
import DashboardCard from "../components/DashboardCard";
import API from "../services/api";

export default function Dashboard() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loans, setLoans] = useState([]);
  const [openWithdrawals, setOpenWithdrawals] = useState(false);
  const [openLoans, setOpenLoans] = useState(false);
  const audioRef = useRef(null);

  const [stats, setStats] = useState({
    employees: 0,
    totalSavings: 0,
    activeLoans: 0,
    monthlyDeposits: 0,
  });

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
  // DASHBOARD STATS
  // =========================
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, depRes, loanRes] = await Promise.all([
          API.get("/employees"),
          API.get("/deposits"),
          API.get("/loans"),
        ]);

        const employeesCount = empRes.data?.length || 0;

        const totalSavings = (depRes.data || []).reduce((sum, d) => {
          const normal = parseFloat(d.normalSaving) || 0;
          const voluntary = parseFloat(d.voluntarySaving) || 0;
          const regFee = parseFloat(d.registrationFee) || 0;
          const lateFee = parseFloat(d.latePenalty) || 0;

          return sum + normal + voluntary + regFee + lateFee;
        }, 0);

        const activeLoans = (loanRes.data || []).length;

        const now = new Date();
        const currentMonth = now.toLocaleString("en-US", { month: "long" });
        const currentYear = now.getFullYear().toString();

        const monthlyDeposits = (depRes.data || [])
          .filter((d) => d.month === currentMonth && d.year === currentYear)
          .reduce((sum, d) => {
            const normal = parseFloat(d.normalSaving) || 0;
            const voluntary = parseFloat(d.voluntarySaving) || 0;
            const regFee = parseFloat(d.registrationFee) || 0;
            const lateFee = parseFloat(d.latePenalty) || 0;

            return sum + normal + voluntary + regFee + lateFee;
          }, 0);

        setStats({
          employees: employeesCount,
          totalSavings,
          activeLoans,
          monthlyDeposits,
        });
      } catch (err) {
        console.log("Dashboard stats error:", err);
      }
    };

    fetchStats();
  }, []);

  // =========================
  // NOTIFICATIONS
  // =========================
  const unreadWithdrawals = withdrawals.filter((w) => !w.isRead).length;
  const unreadLoans = loans.filter((l) => !l.isRead).length;

  const markAsRead = async (type, id) => {
    await API.put(`/${type}/${id}/read`);

    if (type === "withdrawals") {
      setWithdrawals((prev) =>
        prev.map((w) =>
          w._id === id ? { ...w, isRead: true } : w
        )
      );
    } else {
      setLoans((prev) =>
        prev.map((l) =>
          l._id === id ? { ...l, isRead: true } : l
        )
      );
    }
  };

  const handleApprove = async (type, id) => {
    if (type === "withdrawals") {
      setWithdrawals((prev) => prev.filter((w) => w._id !== id));
    } else {
      setLoans((prev) => prev.filter((l) => l._id !== id));
    }

    try {
      await API.put(`/${type}/${id}/approve`);
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  const handleReject = async (type, id) => {
    await API.put(`/${type}/${id}/reject`);

    if (type === "withdrawals") {
      setWithdrawals((prev) =>
        prev.map((w) =>
          w._id === id ? { ...w, status: "Rejected" } : w
        )
      );
    } else {
      setLoans((prev) =>
        prev.map((l) =>
          l._id === id ? { ...l, status: "Rejected" } : l
        )
      );
    }
  };

  // =========================
  // RENDER NOTIFICATIONS
  // =========================
  const renderNotifications = (items, type) => {
    const unreadItems = items.filter((item) => !item.isRead);

    if (!unreadItems.length)
      return <p style={styles.empty}>No notifications</p>;

    return unreadItems.map((item) => (
      <div key={item._id} style={{ ...styles.item, background: "#eaf7ff" }}>
        <div>
          {type === "withdrawals" && (
            <>
              <strong>{item.fullName}</strong>
              <p style={styles.text}>Reason: {item.reason}</p>
              <p style={styles.text}>
                Amount: {item.totalSaving} ETB
              </p>
              <small style={styles.status}>
                Status: {item.status || "Pending"}
              </small>
            </>
          )}

          {type === "loans" && (
            <>
              <p style={styles.text}>
                Employee ID: {item.employeeId?.memberId || "N/A"}
              </p>
              <p style={styles.text}>
                Name: {item.employeeId?.firstName} {item.employeeId?.lastName}
              </p>
              <p style={styles.text}>
                Amount: {item.principalAmount || 0} ETB
              </p>
              <p style={styles.text}>
                Status:{" "}
                <span
                  style={{
                    color:
                      item.status === "active"
                        ? "green"
                        : item.status === "Rejected"
                        ? "red"
                        : "orange",
                    fontWeight: "bold",
                  }}
                >
                  {item.status || "active"}
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
    <div style={{ padding: "20px", position: "relative" }}>
      <audio ref={audioRef} src="/notification.mp3" />

      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div onClick={() => setOpenWithdrawals(!openWithdrawals)} style={{ cursor: "pointer", position: "relative" }}>
          🔔 Withdrawals
          {unreadWithdrawals > 0 && <span style={styles.badge}>{unreadWithdrawals}</span>}
        </div>

        <div onClick={() => setOpenLoans(!openLoans)} style={{ cursor: "pointer", position: "relative" }}>
          💰 Loans
          {unreadLoans > 0 && <span style={styles.badge}>{unreadLoans}</span>}
        </div>
      </div>

      {openWithdrawals && <div style={styles.dropdown}>{renderNotifications(withdrawals, "withdrawals")}</div>}
      {openLoans && <div style={{ ...styles.dropdown, right: "150px" }}>{renderNotifications(loans, "loans")}</div>}

      {/* TITLE */}
      <h2 style={styles.title}>Welcome To Micro-finance Saving System</h2>

      {/* CARDS */}
      <div style={styles.cardContainer}>
        <DashboardCard title="Employees" value={stats.employees} />
        <DashboardCard title="Total Savings" value={stats.totalSavings} />
        <DashboardCard title="Active Loans" value={stats.activeLoans} />
        <DashboardCard title="Monthly Deposits" value={stats.monthlyDeposits} />
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  topBar: { position: "absolute", top: 20, right: 20, display: "flex", gap: 20 },

  badge: {
    position: "absolute",
    top: -5,
    right: -10,
    background: "red",
    color: "#fff",
    borderRadius: "50%",
    padding: "3px 7px",
    fontSize: 12,
  },

  dropdown: {
    position: "absolute",
    right: 20,
    top: 60,
    width: 320,
    maxHeight: 400,
    overflowY: "auto",
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    padding: 10,
    zIndex: 999,
  },

  empty: { textAlign: "center", color: "#888" },

  item: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    display: "flex",
    justifyContent: "space-between",
  },

  text: { fontSize: 13 },

  status: { fontSize: 12, color: "#777" },

  actions: { display: "flex", gap: 5 },

  approve: { background: "green", color: "#fff", border: "none", padding: "4px 6px", borderRadius: 4, cursor: "pointer" },

  reject: { background: "red", color: "#fff", border: "none", padding: "4px 6px", borderRadius: 4, cursor: "pointer" },

  readBtn: { background: "#3498db", color: "#fff", border: "none", padding: "4px 6px", borderRadius: 4, cursor: "pointer" },

  title: { textAlign: "center", color: "#3498db", marginBottom: 30 },

  cardContainer: { display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" },
};