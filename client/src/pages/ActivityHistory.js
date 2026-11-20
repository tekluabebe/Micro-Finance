import React, { useEffect, useState } from "react";
import API from "../services/api";

const pageSize = 50;

export default function ActivityHistory() {
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState({ logs: [], total: 0 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    API.get(`/audit-logs?page=${page}&limit=${pageSize}`)
      .then(({ data }) => {
        if (!active) return;
        setHistory({
          logs: Array.isArray(data.logs) ? data.logs : [],
          total: Number(data.total) || 0,
        });
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.response?.data?.message || "Could not load activity history.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(history.total / pageSize));

  return (
    <section style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Activity History</h1>
          <p style={styles.description}>
            Recent account and system changes recorded by the shared application.
          </p>
        </div>
        <span style={styles.count}>{history.total} activities</span>
      </header>

      {error ? <p role="alert" style={styles.error}>{error}</p> : null}
      {loading ? <p>Loading activity history…</p> : null}
      {!loading && !error && history.logs.length === 0 ? (
        <p style={styles.empty}>No activity recorded yet.</p>
      ) : null}

      {!loading && !error && history.logs.length > 0 ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.cell}>Date</th>
                <th style={styles.cell}>User</th>
                <th style={styles.cell}>Action</th>
                <th style={styles.cell}>Result</th>
              </tr>
            </thead>
            <tbody>
              {history.logs.map((entry) => (
                <tr key={entry._id}>
                  <td style={styles.cell}>{new Date(entry.createdAt).toLocaleString()}</td>
                  <td style={styles.cell}>
                    {entry.actorMemberId || "System"} · {entry.actorRole || "unknown"}
                  </td>
                  <td style={{ ...styles.cell, overflowWrap: "anywhere" }}>
                    {entry.method} {entry.path}
                  </td>
                  <td style={styles.cell}>{entry.statusCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <nav aria-label="Activity history pages" style={styles.pagination}>
        <button type="button" disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)}>
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((value) => value + 1)}>
          Next
        </button>
      </nav>
    </section>
  );
}

const styles = {
  container: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 8px 24px rgba(15, 23, 42, .08)",
    color: "#243247",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  title: { margin: 0, fontSize: 24 },
  description: { margin: "8px 0 0", color: "#64748b" },
  count: { color: "#475569", fontWeight: 600 },
  error: { color: "#b42318" },
  empty: { padding: 24, textAlign: "center", color: "#64748b" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 620, textAlign: "left" },
  cell: { borderBottom: "1px solid #e2e8f0", padding: "12px 10px", verticalAlign: "top" },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginTop: 20,
  },
};
