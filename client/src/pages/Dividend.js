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

  // በስልክ እና በኮምፒውተር ላይ ተለዋዋጭ ክፍተት ለመስጠት የስክሪን ስፋት መቆጣጠሪያ
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    fetchDividendData();

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  // የናቭባር እና የሳይድባር ለውጥን ያማከለ ተለዋዋጭ ስታይል
// የናቭባር እና የሳይድባር ለውጥን ያማከለ ተለዋዋጭ ስታይል
  const containerStyle = {
    ...styles.container,
    marginLeft: isMobile ? "0" : "240px", // ከ 270px ወደ 240px ቀነስነው (ወደ ግራ እንዲጠጋ)
    padding: isMobile ? "10px" : "15px 25px 15px 10px", // የግራ ክፍተቱን 10px ብቻ አደረግነው
    paddingTop: isMobile ? "75px" : "85px", 
  };

  return (
    <div className="dividend-page-container" style={containerStyle}>
      <div style={styles.headerBox}>
        <h2 style={{ color: "#2c3e50", margin: 0, fontSize: "22px" }}>የትርፍ ክፍፍል ማጠቃለያ (Dividend Summary)</h2>
        <div className="summary-cards-grid" style={styles.summaryGrid}>
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

      <div className="table-responsive-wrapper" style={{ width: "100%", overflowX: "auto", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
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
              <tr><td colSpan="4" style={{ padding: "20px", textAlign: "center" }}>ምንም ዳታ አልተገኘም</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <style>
        {`
          @media (max-width: 768px) {
            .dividend-page-container {
              padding: 15px !important;
              padding-top: 75px !important; /* በስልክ ላይ የላይኛው ክፍተት መኖሩን ማረጋገጫ */
            }
            .summary-cards-grid {
              flex-direction: column !important;
              gap: 12px !important;
            }
            .table-responsive-wrapper {
              margin-top: 10px;
            }
            th, td {
              padding: 12px 10px !important;
              font-size: 14px !important;
            }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  container: { 
    padding: "30px", 
    backgroundColor: "#f8f9fa", 
    minHeight: "100vh", 
    transition: "margin-left 0.3s ease", 
    boxSizing: "border-box" 
  },
  headerBox: { background: "#fff", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", marginBottom: "20px" },
  summaryGrid: { display: "flex", gap: "20px", marginTop: "15px" },
  statCard: { flex: 1, padding: "20px", background: "#f1f3f5", borderRadius: "10px", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.02)" },
  label: { fontSize: "14px", color: "#6c757d" },
  value: { fontSize: "20px", display: "block", marginTop: "5px" },
  searchInput: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "20px", outline: "none", boxSizing: "border-box" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", minWidth: "600px" }, 
  thRow: { background: "#34495e", color: "#fff" },
  th: { padding: "15px", textAlign: "left" },
  td: { padding: "15px", borderBottom: "1px solid #eee" },
};