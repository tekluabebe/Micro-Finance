import React, { useEffect, useRef, useState } from "react";
import DashboardCard from "../components/DashboardCard";
import API from "../services/api";

export default function Dashboard() {

  const [withdrawals, setWithdrawals] = useState([]);
  const [loans, setLoans] = useState([]);

  const [openWithdrawals, setOpenWithdrawals] = useState(false);
  const [openLoans, setOpenLoans] = useState(false);

  //const audioRef = useRef(null);

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

  // =========================
  // MONTHS
  // =========================
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
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

        const [
          empRes,
          depRes,
          loanRes,
          registrationRes,
          penaltyRes,
        ] = await Promise.all([
          API.get("/employees"),
          API.get("/deposits"),
          API.get("/loans"),
          API.get("/registration-fees"),
          API.get("/late-penalties"),
        ]);

        const deposits = depRes.data || [];
        const registrationFees = registrationRes.data || [];
        const latePenalties = penaltyRes.data || [];

        // =========================
        // EMPLOYEES
        // =========================
        const employeesCount = empRes.data?.length || 0;

        // =========================
        // TOTAL SAVINGS
        // =========================
        const totalSavings = deposits.reduce((sum, d) => {

          return (
            sum +
            (parseFloat(d.normalSaving) || 0) +
            (parseFloat(d.voluntarySaving) || 0)
          );

        }, 0);

        // =========================
        // MONTHLY DEPOSITS FILTER
        // =========================
        const monthlyDeposits = deposits
          .filter(
            (d) =>
              d.month === selectedMonth &&
              String(d.year) === selectedYear
          )
          .reduce((sum, d) => {

            return (
              sum +
              (parseFloat(d.normalSaving) || 0) +
              (parseFloat(d.voluntarySaving) || 0)
            );

          }, 0);

        // =========================
        // REGISTRATION FEES
        // =========================
        const totalRegistrationFees = registrationFees
          .filter(
            (r) =>
              r.month === selectedMonth &&
              String(r.year) === selectedYear
          )
          .reduce((sum, r) => {

            return sum + (parseFloat(r.amount) || 0);

          }, 0);

        // =========================
        // LATE PENALTIES
        // =========================
        const totalLatePenalties = latePenalties
          .filter(
            (p) =>
              p.month === selectedMonth &&
              String(p.year) === selectedYear
          )
          .reduce((sum, p) => {

            return sum + (parseFloat(p.amount) || 0);

          }, 0);

        // =========================
        // ACTIVE LOANS
        // =========================
        const activeLoans = (loanRes.data || []).filter(
          (l) =>
            l.status === "approved" &&
            l.remainingAmount > 0
        ).length;

        // =========================
        // UPDATE STATS
        // =========================
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
    (w) => w.isRead !== true
  ).length;

  const unreadLoans = loans.filter(
    (l) => l.isRead !== true
  ).length;

  // =========================
  // MARK AS READ
  // =========================
  const markAsRead = async (type, id) => {

    await API.put(`/${type}/${id}/read`);

    if (type === "withdrawals") {

      setWithdrawals((prev) =>
        prev.map((w) =>
          w._id === id
            ? { ...w, isRead: true }
            : w
        )
      );

    } else {

      setLoans((prev) =>
        prev.map((l) =>
          l._id === id
            ? { ...l, isRead: true }
            : l
        )
      );
    }
  };

  // =========================
  // APPROVE
  // =========================
  const handleApprove = async (type, id) => {

    try {

      await API.put(`/${type}/${id}/approve`);

      if (type === "loans") {

        setLoans((prev) =>
          prev.filter((l) => l._id !== id)
        );

        setStats((prev) => ({
          ...prev,
          activeLoans: prev.activeLoans + 1,
        }));
      }

    } catch (err) {

      console.error("Approve error:", err);

    }
  };

  // =========================
  // REJECT
  // =========================
  const handleReject = async (type, id) => {

    try {

      await API.put(`/${type}/${id}/reject`);

      if (type === "loans") {

        setLoans((prev) =>
          prev.filter((l) => l._id !== id)
        );
      }

    } catch (err) {

      console.error("Reject error:", err);

    }
  };

  // =========================
  // RENDER NOTIFICATIONS
  // =========================
  const renderNotifications = (items, type) => {

    const unreadItems = items.filter(
      (i) =>
        i.isRead !== true &&
        i.status !== "Rejected"
    );

    if (!unreadItems.length) {
      return (
        <p style={styles.empty}>
          No notifications
        </p>
      );
    }

    return unreadItems.map((item) => (

      <div
        key={item._id}
        style={{
          ...styles.item,
          background: "#eaf7ff",
        }}
      >

        <div>

          {type === "withdrawals" && (
            <>
              <strong>{item.fullName}</strong>

              <p>
                Reason: {item.reason}
              </p>

              <p>
                Amount: {item.totalSaving} ETB
              </p>
            </>
          )}


{type === "loans" && (
  <>
    <p style={styles.text}><strong>Employee ID:</strong> {item.employeeId?.memberId || "N/A"}</p>
    <p style={styles.text}><strong>Borrower:</strong> {item.employeeId?.firstName} {item.employeeId?.lastName}</p>
    <p style={styles.text}><strong>Amount:</strong> {item.principalAmount} ETB</p>
    
    {/* --- የዋሶች ስም ዝርዝር እዚህ ጋር ተጨምሯል --- */}
    <div style={{ marginTop: "5px", padding: "5px", background: "#fff", borderRadius: "5px", border: "1px solid #ddd" }}>
      <strong style={{ fontSize: "12px", color: "#555" }}>Guarantors (ዋሶች):</strong>
      <ul style={{ margin: "3px 0", paddingLeft: "15px", listStyleType: "square" }}>
        {item.guarantors && item.guarantors.length > 0 ? (
          item.guarantors.map((g, index) => (
            <li key={index} style={{ fontSize: "12px", color: "#333" }}>
              {g.firstName} {g.lastName}
            </li>
          ))
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

          <button
            onClick={() =>
              markAsRead(type, item._id)
            }
            style={styles.readBtn}
          >
            ✔
          </button>

          <button
            onClick={() =>
              handleApprove(type, item._id)
            }
            style={styles.approve}
          >
            ✔
          </button>

          <button
            onClick={() =>
              handleReject(type, item._id)
            }
            style={styles.reject}
          >
            ✖
          </button>

        </div>
      </div>
    ));
  };

  // =========================
  // UI
  // =========================
  return (

    <div style={{ padding: 20 }}>

     

      {/* ================= HEADER ================= */}
      <div style={styles.headerRight}>

        {/* NOTIFICATIONS */}
        <div style={styles.topBar}>

          <div
            style={styles.notifItem}
            onClick={() =>
              setOpenWithdrawals(!openWithdrawals)
            }
          >
            🔔 Withdrawals

            {unreadWithdrawals > 0 && (
              <span style={styles.badge}>
                {unreadWithdrawals}
              </span>
            )}
          </div>

          <div
            style={styles.notifItem}
            onClick={() =>
              setOpenLoans(!openLoans)
            }
          >
            💰 Loans

            {unreadLoans > 0 && (
              <span style={styles.badge}>
                {unreadLoans}
              </span>
            )}
          </div>
        </div>

        {/* ================= FILTERS ================= */}
        <div style={styles.filterBar}>

          {/* MONTH */}
          <select
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(e.target.value)
            }
          >
            {months.map((m) => (
              <option key={m}>
                {m}
              </option>
            ))}
          </select>

          {/* YEAR */}
          <select
            value={selectedYear}
            onChange={(e) =>
              setSelectedYear(e.target.value)
            }
          >
            {Array.from({ length: 10 }, (_, i) => {

              const y =
                new Date().getFullYear() - i;

              return (
                <option key={y}>
                  {y}
                </option>
              );
            })}
          </select>

        </div>
      </div>

      {/* ================= DROPDOWNS ================= */}
      {openWithdrawals && (
        <div style={styles.dropdown}>
          {renderNotifications(
            withdrawals,
            "withdrawals"
          )}
        </div>
      )}

      {openLoans && (
        <div
          style={{
            ...styles.dropdown,
            right: 180,
          }}
        >
          {renderNotifications(
            loans,
            "loans"
          )}
        </div>
      )}

      {/* ================= TITLE ================= */}
      <h2 style={styles.title}>
        Micro-finance Dashboard
      </h2>

      {/* ================= CARDS ================= */}
      <div style={styles.cardContainer}>

        <DashboardCard
          title="Employees"
          value={stats.employees}
        />

        <DashboardCard
          title="Total Savings"
          value={`${stats.totalSavings} ETB`}
        />

        <DashboardCard
          title="Active Loans"
          value={stats.activeLoans}
        />

        <DashboardCard
          title={`Deposits (${selectedMonth})`}
          value={`${stats.monthlyDeposits} ETB`}
        />

        <DashboardCard
          title="Registration Fees"
          value={`${stats.totalRegistrationFees} ETB`}
        />

        <DashboardCard
          title="Late Penalties"
          value={`${stats.totalLatePenalties} ETB`}
        />

      </div>
    </div>
  );
}

// =========================
// STYLES
// =========================
const styles = {

  headerRight: {
    position: "absolute",
    top: 20,
    right: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 10,
  },

  topBar: {
    display: "flex",
    gap: 15,
  },

  notifItem: {
    position: "relative",
    cursor: "pointer",
    padding: "6px 10px",
    background: "#f4f4f4",
    borderRadius: 8,
    fontWeight: "bold",
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    background: "red",
    color: "#fff",
    borderRadius: "50%",
    padding: "2px 6px",
    fontSize: 11,
    fontWeight: "bold",
  },

  filterBar: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  dropdown: {
    position: "absolute",
    top: 70,
    right: 20,
    width: 320,
    background: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    padding: 10,
    borderRadius: 10,
    zIndex: 1000,
  },

  item: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    display: "flex",
    justifyContent: "space-between",
  },

  actions: {
    display: "flex",
    gap: 5,
  },

  approve: {
    background: "green",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },

  reject: {
    background: "red",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },

  readBtn: {
    background: "#3498db",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },

  title: {
    textAlign: "center",
    color: "#3498db",
    marginBottom: 30,
  },

  cardContainer: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  empty: {
    textAlign: "center",
    color: "#888",
  },

  text: {
    margin: "3px 0",
  },
};