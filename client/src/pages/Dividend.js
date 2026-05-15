import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function Dividend() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [totalSaving, setTotalSaving] = useState(0);
  const [normalSaving, setNormalSaving] = useState(0);
  const [voluntarySaving, setVoluntarySaving] = useState(0);
  const [totalShares, setTotalShares] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Fetch all members and their savings/shares
    API.get("/members").then((res) => {
      const data = res.data || [];
      setMembers(data);
      setFilteredMembers(data);

      // Calculate totals
      let totalSavingSum = 0;
      let normalSavingSum = 0;
      let voluntarySavingSum = 0;
      let totalSharesSum = 0;

      data.forEach((member) => {
        totalSavingSum += member.totalSaving || 0;
        normalSavingSum += member.normalSaving || 0;
        voluntarySavingSum += member.voluntarySaving || 0;
        totalSharesSum += member.sharesPurchased || 0;
      });

      setTotalSaving(totalSavingSum);
      setNormalSaving(normalSavingSum);
      setVoluntarySaving(voluntarySavingSum);
      setTotalShares(totalSharesSum);

      // Total profit
      setTotalProfit(
        totalSavingSum - (normalSavingSum + voluntarySavingSum + totalSharesSum)
      );
    });
  }, []);

  // Handle search input
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
      <h2>Dividend Calculation</h2>

      <div style={styles.summary}>
        <p>Total Saving: {totalSaving} ETB</p>
        <p>Normal Saving: {normalSaving} ETB</p>
        <p>Voluntary Saving: {voluntarySaving} ETB</p>
        <p>Total Shares Purchased: {totalShares}</p>
        <h3>Total Profit: {totalProfit} ETB</h3>
      </div>

      {/* Search Field */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search member by name"
          value={searchQuery}
          onChange={handleSearch}
          style={styles.searchInput}
        />
      </div>

      <h3>Member Dividend Distribution</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Member Name</th>
            <th>Shares Purchased</th>
            <th>Dividend Amount (ETB)</th>
          </tr>
        </thead>
        <tbody>
          {filteredMembers.map((member) => {
            const dividendAmount =
              totalShares > 0
                ? ((member.sharesPurchased || 0) / totalShares) * totalProfit
                : 0;
            return (
              <tr key={member._id}>
                <td>{member.fullName}</td>
                <td>{member.sharesPurchased || 0}</td>
                <td>{dividendAmount.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    marginLeft: "260px",
    padding: "20px",
  },
  summary: {
    marginBottom: "20px",
    background: "#ecf0f1",
    padding: "15px",
    borderRadius: "8px",
  },
  searchContainer: {
    marginBottom: "20px",
  },
  searchInput: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },
  th: {
    borderBottom: "1px solid #ddd",
    padding: "8px",
    textAlign: "left",
  },
  td: {
    borderBottom: "1px solid #ddd",
    padding: "8px",
  },
};