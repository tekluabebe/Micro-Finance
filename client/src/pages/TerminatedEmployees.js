import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function TerminatedEmployees() {
  const [data, setData] = useState([]);

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await API.get("/terminated");
      console.log("TERMINATED DATA:", res.data);
      setData(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // DELETE FUNCTION
  // =========================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete permanently?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/terminated/${id}`);

      // remove from UI instantly
      setData((prev) => prev.filter((item) => item._id !== id));

      alert("Deleted permanently ✅");
    } catch (err) {
      console.error(err);
      alert("Delete failed ❌");
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Terminated Employees</h2>

      {data.length === 0 ? (
        <p style={{ textAlign: "center" }}>No terminated employees</p>
      ) : (
        <table
          border="1"
          cellPadding="10"
          style={{ width: "100%", marginTop: "20px" }}
        >
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Name</th>
              <th>Total Saving</th>
              <th>Reason</th>
              <th>Date</th>
              <th>Action</th> {/* ✅ NEW */}
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item._id}>
                <td>{item.employeeData?.memberId}</td>

                <td>
                  {item.employeeData?.firstName}{" "}
                  {item.employeeData?.lastName}
                </td>

                <td>{item.totalSaving} ETB</td>

                <td>{item.reason}</td>

                <td>
                  {new Date(item.terminatedAt).toLocaleDateString()}
                </td>

                {/* ✅ DELETE BUTTON */}
                <td>
                  <button
                    onClick={() => handleDelete(item._id)}
                    style={{
                      background: "red",
                      color: "#fff",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}