import React, { useEffect, useState } from "react";
import API from "../services/api";
import { FaTrashAlt, FaUserTimes } from "react-icons/fa";

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
    <div className="terminated-page-container">
      <h2 className="terminated-title">
        <FaUserTimes /> Terminated Employees
      </h2>

      {data.length === 0 ? (
        <p className="no-data-text">No terminated employees found.</p>
      ) : (
        <div className="table-responsive-wrapper">
          <table className="modern-terminated-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Total Saving</th>
                <th>Reason</th>
                <th>Date</th>
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {data.map((item) => (
                <tr key={item._id}>
                  <td>
                    <span className="mobile-label">Member ID:</span>
                    <span className="cell-value font-mono">{item.employeeData?.memberId || "N/A"}</span>
                  </td>

                  <td>
                    <span className="mobile-label">Name:</span>
                    <span className="cell-value">
                      {item.employeeData?.firstName} {item.employeeData?.lastName}
                    </span>
                  </td>

                  <td>
                    <span className="mobile-label">Total Saving:</span>
                    <span className="cell-value amount-badge">{item.totalSaving} ETB</span>
                  </td>

                  <td>
                    <span className="mobile-label">Reason:</span>
                    <span className="cell-value reason-text">{item.reason || "Not specified"}</span>
                  </td>

                  <td>
                    <span className="mobile-label">Date:</span>
                    <span className="cell-value">
                      {item.terminatedAt ? new Date(item.terminatedAt).toLocaleDateString() : "N/A"}
                    </span>
                  </td>

                  {/* ✅ DELETE BUTTON */}
                  <td className="action-cell">
                    <span className="mobile-label">Action:</span>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="delete-action-btn"
                    >
                      <FaTrashAlt /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>
        {`
          .terminated-page-container {
            padding: 30px;
            max-width: 1200px;
            margin: 0 auto;
            box-sizing: border-box;
            padding-top: 90px; /* ከቶፕ ባር ጋር እንዳይጋጭ */
          }

          .terminated-title {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #2c3e50;
            font-size: 26px;
            margin-bottom: 25px;
            margin-top: 0;
          }

          .no-data-text {
            text-align: center;
            padding: 40px;
            background: #fff;
            border-radius: 12px;
            color: #7f8c8d;
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
            font-size: 16px;
          }

          /* Desktop Table Styling */
          .table-responsive-wrapper {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            overflow: hidden;
            border: 1px solid rgba(128,128,128,0.1);
          }

          .modern-terminated-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 15px;
          }

          .modern-terminated-table th {
            background-color: #f8fafc;
            color: #475569;
            padding: 16px 20px;
            font-weight: 600;
            border-bottom: 2px solid #e2e8f0;
          }

          .modern-terminated-table td {
            padding: 16px 20px;
            color: #334155;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
          }

          .modern-terminated-table tbody tr:last-child td {
            border-bottom: none;
          }

          .modern-terminated-table tbody tr:hover {
            background-color: #f8fafc;
          }

          .font-mono {
            font-family: monospace;
            font-weight: bold;
            color: #64748b;
          }

          .amount-badge {
            font-weight: 600;
            color: #0f172a;
          }

          .reason-text {
            color: #64748b;
            font-style: italic;
          }

          .delete-action-btn {
            background: #fee2e2;
            color: #ef4444;
            border: none;
            padding: 8px 14px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            transition: all 0.2s ease;
          }

          .delete-action-btn:hover {
            background: #ef4444;
            color: #fff;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
          }

          /* የሞባይል ሌብሎች በዴስክቶፕ ላይ እንዲደበቁ */
          .mobile-label {
            display: none;
          }

          /* ==========================================================================
             MOBILE RESPONSIVE BREAKPOINT (ለስልኮች የሚሆን ፍጹም ማስተካከያ)
             ========================================================================== */
          @media (max-width: 768px) {
            .terminated-page-container {
              padding: 15px;
              padding-top: 85px;
            }

            .terminated-title {
              font-size: 21px;
              margin-bottom: 18px;
            }

            /* ጠረጴዛውን ወደ ካርድ መዋቅር (Card Layout) መቀየር */
            .modern-terminated-table, 
            .modern-terminated-table thead, 
            .modern-terminated-table tbody, 
            .modern-terminated-table th, 
            .modern-terminated-table tr, 
            .modern-terminated-table td {
              display: block;
              width: 100%;
            }

            .table-responsive-wrapper {
              background: transparent;
              box-shadow: none;
              border: none;
            }

            /* የላይኛውን ሄደር መደበቅ */
            .modern-terminated-table thead {
              display: none;
            }

            /* እያንዳንዱ ረድፍ ራሱን የቻለ ካርድ ይሆናል */
            .modern-terminated-table tr {
              background: #fff;
              border-radius: 14px;
              padding: 15px;
              margin-bottom: 15px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.04);
              border: 1px solid rgba(128,128,128,0.08);
              box-sizing: border-box;
            }

            .modern-terminated-table td {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0 !important;
              border-bottom: 1px solid #f1f5f9;
              text-align: right;
            }

            .modern-terminated-table td:last-child {
              border-bottom: none;
              padding-bottom: 5px !important;
              margin-top: 5px;
            }

            /* የሞባይል ሌብሎችን በግራ በኩል ማሳየት */
            .mobile-label {
              display: block;
              font-weight: 600;
              color: #64748b;
              font-size: 13px;
              text-align: left;
            }

            .cell-value {
              font-size: 14px;
            }

            .action-cell {
              flex-direction: row !important;
              justify-content: space-between !important;
              align-items: center !important;
            }

            .delete-action-btn {
              width: auto;
              padding: 10px 16px;
              font-size: 14px;
            }
          }
        `}
      </style>
    </div>
  );
}