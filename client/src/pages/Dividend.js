import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function Dividend() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [totals, setTotals] = useState({
    totalSaving: 0,
    totalShares: 0,
    totalProfit: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDividendData();
  }, []);

  const fetchDividendData = async () => {
    try {
      const [memRes, depRes] = await Promise.all([
        API.get("/employees"), 
        API.get("/deposits"),
      ]);

      const allMembers = memRes.data || [];
      const allDeposits = depRes.data || [];

      const processedMembers = allMembers.map((member) => {
        const memberDeposits = allDeposits.filter(
          (d) => String(d.employeeId?._id || d.employeeId) === String(member._id)
        );

        const normalSum = memberDeposits.reduce((s, d) => s + (parseFloat(d.normalSaving) || 0), 0);
        const voluntarySum = memberDeposits.reduce((s, d) => s + (parseFloat(d.voluntarySaving) || 0), 0);
        const sharesSum = memberDeposits.reduce((s, d) => s + (parseFloat(d.sharedPurchase) || 0), 0);

        return {
          ...member,
          fullName: `${member.firstName} ${member.lastName}`,
          normalSaving: normalSum,
          voluntarySaving: voluntarySum,
          sharesPurchased: sharesSum,
        };
      });

      const totalS = processedMembers.reduce((s, m) => s + m.normalSaving + m.voluntarySaving, 0);
      const totalSh = processedMembers.reduce((s, m) => s + m.sharesPurchased, 0);
      
      const mockProfit = 50000; 

      setTotals({
        totalSaving: totalS,
        totalShares: totalSh,
        totalProfit: mockProfit,
      });

      setMembers(processedMembers);
      setFilteredMembers(processedMembers);

    } catch (err) {
      console.error("Dividend fetch error:", err);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = members.filter((m) =>
      m.fullName.toLowerCase().includes(query)
    );
    setFilteredMembers(filtered);
  };

  return (
    /* 💡 ፔጅ መያዣው አሁን ሙሉ በሙሉ በ App.js ማርጅን ስለሚመራ እዚህ ላይ width: 100% ብቻ ይሆናል */
    <div className="dividend-page-container" style={{ width: "100%", boxSizing: "border-box" }}>
      
      <div style={styles.headerBox}>
        <h2 style={{ color: "#2c3e50", margin: "0 0 15px 0", fontSize: "22px", fontWeight: "700" }}>
          የትርፍ ክፍፍል ማጠቃለያ (Dividend Summary)
        </h2>
        
        {/* 💡 ክላስ ስም ብቻ ሰጥተን ስታይሉን ወደ ታችኛው የ CSS @media አዛውረነዋል (ስልክ ላይ እንዲታጠፍ) */}
        <div className="summary-cards-grid">
          <div style={styles.statCard}>
            <span style={styles.label}>ጠቅላላ ቁጠባ</span>
            <strong style={styles.value}>{totals.totalSaving.toLocaleString()} ETB</strong>
          </div>
          <div style={styles.statCard}>
            <span style={styles.label}>ጠቅላላ ዕጣ (Shares)</span>
            <strong style={styles.value}>{totals.totalShares.toLocaleString()}</strong>
          </div>
          <div style={{ ...styles.statCard, background: "#2ecc71", color: "#fff" }}>
            <span style={{ color: "#fff", fontSize: "14px" }}>ሊከፋፈል የሚገባው ትርፍ</span>
            <strong style={{ fontSize: "20px", display: "block", marginTop: "5px" }}>{totals.totalProfit.toLocaleString()} ETB</strong>
          </div>
        </div>
      </div>

      <input
        type="text"
        placeholder="አባል በስም ይፈልጉ..."
        value={searchQuery}
        onChange={handleSearch}
        style={styles.searchInput}
      />

      {/* የሰንጠረዥ መያዣ (Responsive Table Wrapper) */}
      <div className="table-responsive-wrapper" style={{ width: "100%", overflowX: "auto", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", background: "#fff" }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>የአባሉ ስም</th>
              <th style={styles.th}>ያለው ዕጣ (Shares)</th>
              <th style={styles.th}>የድርሻ መጠን (%)</th>
              <th style={styles.th}>የትርፍ ክፍፍል (Dividend)</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => {
                const shareRatio = totals.totalShares > 0 ? (member.sharesPurchased / totals.totalShares) : 0;
                const dividendAmount = shareRatio * totals.totalProfit;

                return (
                  <tr key={member._id} style={styles.tr}>
                    <td style={styles.td}>{member.fullName}</td>
                    <td style={styles.td}>{member.sharesPurchased}</td>
                    <td style={styles.td}>{(shareRatio * 100).toFixed(2)}%</td>
                    <td style={{ ...styles.td, fontWeight: "bold", color: "#27ae60" }}>
                      {dividendAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" style={{ padding: "25px", textAlign: "center", color: "#7f8c8d" }}>
                  ምንም ዳታ አልተገኘም
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🛠️ ፍጹም የሆነ የሞባይል ተኳኋኝነትን የሚያረጋግጥ ማጠናከሪያ CSS */}
      <style>
        {`
          .summary-cards-grid {
            display: flex;
            gap: 20px;
            width: 100%;
          }

          @media (max-width: 768px) {
            .summary-cards-grid {
              flex-direction: column !important;
              gap: 12px !important;
            }
            
            th, td {
              padding: 12px 10px !important;
              font-size: 14px !important;
            }
            
            h2 {
              font-size: 18px !important;
            }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  headerBox: { 
    background: "#fff", 
    padding: "20px", 
    borderRadius: "12px", 
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)", 
    marginBottom: "20px" 
  },
  statCard: { 
    flex: 1, 
    padding: "18px", 
    background: "#f8f9fa", 
    borderRadius: "10px", 
    border: "1px solid #e9ecef"
  },
  label: { fontSize: "14px", color: "#6c757d", fontWeight: "500" },
  value: { fontSize: "20px", display: "block", marginTop: "5px", color: "#2c3e50", fontWeight: "600" },
  searchInput: { 
    width: "100%", 
    padding: "12px", 
    borderRadius: "8px", 
    border: "1px solid #ced4da", 
    marginBottom: "20px", 
    outline: "none", 
    boxSizing: "border-box",
    fontSize: "15px"
  },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", minWidth: "600px" }, 
  thRow: { background: "#34495e", color: "#fff" },
  th: { padding: "14px 16px", textAlign: "left", fontWeight: "600" },
  td: { padding: "14px 16px", borderBottom: "1px solid #f1f3f5", color: "#495057" },
};