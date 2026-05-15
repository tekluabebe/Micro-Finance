import React, { useState } from "react";
import API from "../services/api";

export default function ProfitDistribution() {
  const [searchQuery, setSearchQuery] = useState("");
  const [member, setMember] = useState(null);
  const [savingAmount, setSavingAmount] = useState("");
  const [shareAmount, setShareAmount] = useState("");

  // Search member by name or ID
  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await API.get(`/members/search?query=${searchQuery}`);
      if (res.data) {
        setMember(res.data);

        // Calculate total dividend for this member
        const dividendAmount =
          ((res.data.sharesPurchased || 0) /
            (res.data.totalShares || 1)) *
          (res.data.totalProfit || 0);

        setMember((prev) => ({ ...prev, dividendAmount }));
        setSavingAmount("");
        setShareAmount("");
      } else {
        alert("Member not found");
        setMember(null);
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching member");
    }
  };

  const handleDistribute = async () => {
    if (!member) return;

    const dividendAmount = member.dividendAmount;
    const saving = parseFloat(savingAmount || 0);
    const share = parseFloat(shareAmount || 0);

    if (share > 0 && share < 500) {
      alert("Amount to save in share purchased must be ≥ 500 ETB");
      return;
    }

    if (saving + share > dividendAmount) {
      alert(`Total distribution cannot exceed dividend (${dividendAmount.toFixed(2)} ETB)`);
      return;
    }

    try {
      await API.post("/profit/distribute", {
        memberId: member._id,
        savingAmount: saving,
        shareAmount: share,
      });
      alert("Profit distributed successfully!");
      setMember(null);
      setSearchQuery("");
    } catch (err) {
      console.error(err);
      alert("Error distributing profit");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Profit Distribution</h2>

      {/* Search */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search member by name or ID"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleSearch} style={styles.button}>
          Search
        </button>
      </div>

      {member && (
        <div style={styles.distributionContainer}>
          <h3>{member.fullName}</h3>
          <p>Total Dividend: {member.dividendAmount.toFixed(2)} ETB</p>

          <div style={styles.formRow}>
            <label>Save to Saving Account:</label>
            <input
              type="number"
              min="0"
              max={member.dividendAmount}
              value={savingAmount}
              onChange={(e) => setSavingAmount(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formRow}>
            <label>Save to Share Purchased (≥500 ETB if any):</label>
            <input
              type="number"
              min="0"
              max={member.dividendAmount}
              value={shareAmount}
              onChange={(e) => setShareAmount(e.target.value)}
              style={styles.input}
            />
          </div>

          <button onClick={handleDistribute} style={styles.button}>
            Distribute Profit
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginLeft: "260px",
    padding: "20px",
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    gap: "10px",
  },
  distributionContainer: {
    background: "#ecf0f1",
    padding: "20px",
    borderRadius: "8px",
    maxWidth: "500px",
  },
  formRow: {
    marginBottom: "15px",
  },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "12px 20px",
    background: "#1abc9c",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
  },
};