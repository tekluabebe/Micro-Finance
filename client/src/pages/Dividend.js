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
      // የዚህን አባል ተቀማጭ ብር እና ዕጣ መለየት
      const memberDeposits = allDeposits.filter(
        (d) => String(d.employeeId?._id || d.employeeId) === String(member._id)
      );

      // 1. ቁጠባዎችን መደመር
      const normalSum = memberDeposits.reduce((s, d) => s + (parseFloat(d.normalSaving) || 0), 0);
      const voluntarySum = memberDeposits.reduce((s, d) => s + (parseFloat(d.voluntarySaving) || 0), 0);
      
      // 2. ዕጣዎችን መደመር (በምስሉ መሠረት ስሙ 'sharedPurchase' ነው)
      const sharesSum = memberDeposits.reduce((s, d) => s + (parseFloat(d.sharedPurchase) || 0), 0);

      return {
        ...member,
        fullName: `${member.firstName} ${member.lastName}`,
        normalSaving: normalSum,
        voluntarySaving: voluntarySum,
        sharesPurchased: sharesSum, // ድምሩን እዚህ እናስቀምጠዋለን
      };
    });

    // ጠቅላላ ድምርን ማስላት
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
    <div style={styles.container}>
      <div style={styles.headerBox}>
        <h2 style={{ color: "#2c3e50" }}>የትርፍ ክፍፍል ማጠቃለያ (Dividend Summary)</h2>
        <div style={styles.summaryGrid}>
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
            <strong style={{ fontSize: "20px" }}>{totals.totalProfit.toLocaleString()} ETB</strong>
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
  );
}

const styles = {
  container: { marginLeft: "270px", padding: "30px", backgroundColor: "#f8f9fa", minHeight: "100vh" },
  headerBox: { background: "#fff", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", marginBottom: "20px" },
  summaryGrid: { display: "flex", gap: "20px", marginTop: "15px" },
  statCard: { flex: 1, padding: "20px", background: "#f1f3f5", borderRadius: "10px" },
  label: { fontSize: "14px", color: "#6c757d" },
  value: { fontSize: "20px", display: "block", marginTop: "5px" },
  searchInput: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "20px", outline: "none" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "8px", overflow: "hidden" },
  thRow: { background: "#34495e", color: "#fff" },
  th: { padding: "15px", textAlign: "left" },
  td: { padding: "15px", borderBottom: "1px solid #eee" },
};