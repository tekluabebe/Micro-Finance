import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./Dividend.css";

export default function Dividend() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
    const [selectedYear, setSelectedYear] = useState(
  new Date().getFullYear()
);

const [availableYears, setAvailableYears] = useState([]);
  const [totals, setTotals] = useState({
    totalSaving: 0,
    totalShares: 0,
    totalProfit: 0,
  });



  const [searchQuery, setSearchQuery] = useState("");

useEffect(() => {
  fetchDividendData();
}, [selectedYear]);


// function to fetch dividend
const fetchDividendData = async () => {
  try {
    const [memRes, depRes, financialRes] = await Promise.all([
      API.get("/employees"),
      API.get("/deposits"),
      API.get(`/financial-reports?year=${selectedYear}`)
    ]);

    const allMembers = memRes.data || [];
    const allDeposits = depRes.data || [];

    const processedMembers = allMembers.map((member) => {
      // 🔥 FILTER DEPOSITS BY BOTH employeeId AND memberId FOR THIS MEMBER
      const memberDeposits = allDeposits.filter((d) => {
        const depositEmployeeId = String(d.employeeId?._id || d.employeeId);
        const depositMemberId = String(d.memberId || d.employeeId?.memberId || "");
        const memberMemberId = String(member.memberId || "");
        
        // Match by employeeId OR memberId (for restored members)
        const isThisMember = (
          depositEmployeeId === String(member._id) ||
          (depositMemberId === memberMemberId && memberMemberId !== "")
        );

        // 🔥 ONLY include deposits from selected year
        const isSelectedYear = String(d.year) === String(selectedYear);

        return isThisMember && isSelectedYear;
      });

      console.log(`Member ${member.firstName}: ${memberDeposits.length} deposits in ${selectedYear}`);

      // 🔥 SUM ONLY normal + voluntary savings (NOT sharedPurchase, registrationFee, latePenalty)
      const normalSum = memberDeposits.reduce((s, d) => {
        const amount = parseFloat(d.normalSaving) || 0;
        console.log(`  Normal: ${amount}`);
        return s + amount;
      }, 0);

      const voluntarySum = memberDeposits.reduce((s, d) => {
        const amount = parseFloat(d.voluntarySaving) || 0;
        console.log(`  Voluntary: ${amount}`);
        return s + amount;
      }, 0);
      
      // 🔥 Shares = sharedPurchase quantity (not amount)
      const sharesSum = memberDeposits.reduce((s, d) => s + (parseFloat(d.sharedPurchase) || 0), 0);

      const totalSaving = normalSum + voluntarySum;

      console.log(`Member ${member.firstName} Total: ${totalSaving} (Normal: ${normalSum} + Voluntary: ${voluntarySum})`);

      return {
        ...member,
        fullName: `${member.firstName} ${member.lastName}`,
        normalSaving: normalSum,
        voluntarySaving: voluntarySum,
        totalSaving: totalSaving,  // 🔥 Only normal + voluntary
        sharesPurchased: sharesSum,
      };
    });

    // 🔥 CALCULATE TOTALS - SUM FROM PROCESSED MEMBERS
    const totalS = processedMembers.reduce((s, m) => {
      console.log(`Adding ${m.fullName}: ${m.totalSaving}`);
      return s + m.totalSaving;
    }, 0);

    const totalSh = processedMembers.reduce((s, m) => s + m.sharesPurchased, 0);

    console.log(`Total Saving Calculated: ${totalS}`);
    console.log(`Total Shares Calculated: ${totalSh}`);

    // ===============================
    // FINANCIAL REPORTS
    // ===============================
    console.log("Financial Reports Response:", financialRes.data);

    // Handle different API response structures
    const financialReports = Array.isArray(financialRes.data)
      ? financialRes.data
      : financialRes.data?.data
      ? financialRes.data.data
      : financialRes.data?.reports
      ? financialRes.data.reports
      : [];

    console.log("Reports:", financialReports);

    // Build year dropdown
    const years = [
      ...new Set(
        financialReports
          .map((report) => Number(report.year))
          .filter(Boolean)
      ),
    ].sort((a, b) => b - a);

    setAvailableYears(years.length > 0 ? years : [new Date().getFullYear()]);

    // Calculate total net profit for selected year
    console.log("Selected Year:", selectedYear);
    console.log("Financial Reports:", financialReports);

    const yearlyReports = financialReports.filter(
      (report) => Number(report.year) === Number(selectedYear)
    );

    console.log("Yearly Reports:", yearlyReports);

    // 🔥 SUM net profit for selected year
    const netProfit = yearlyReports.reduce(
      (sum, report) => sum + (Number(report.netProfit) || 0),
      0
    );

    console.log(`Net Profit for ${selectedYear}:`, netProfit);

    setTotals({
      totalSaving: totalS,  // 🔥 Sum of normal + voluntary only
      totalShares: totalSh,
      totalProfit: netProfit > 0 ? netProfit : 0,
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

const selectedYearExists =
  availableYears.includes(Number(selectedYear));

  return (
  <div className="dividend-page-container">
    <div className="dividend-header-box">
      <h2 className="dividend-title">
        የትርፍ ክፍፍል ማጠቃለያ (Dividend Summary)
      </h2>

      <div className="summary-cards-grid">
        <div className="dividend-stat-card">
          <span className="dividend-label">ጠቅላላ ቁጠባ</span>
          <strong className="dividend-value">
            {totals.totalSaving.toLocaleString()} ETB
          </strong>
        </div>

        <div className="dividend-stat-card shares-card">
          <span className="dividend-label">ጠቅላላ ዕጣ (Shares)</span>
          <strong className="dividend-value">
            {totals.totalShares.toLocaleString()}
          </strong>
        </div>

        <div className="dividend-stat-card profit-card">
          <span className="dividend-label">
            {selectedYear} ዓ.ም ሊከፋፈል የሚገባው ትርፍ
          </span>

          <strong className="dividend-value">
            {totals.totalProfit.toLocaleString()} ETB
          </strong>
        </div>
      </div>
    </div>

    <div className="dividend-controls">
      <div className="year-filter-box">
        <label>Select Year:</label>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {availableYears.length > 0 ? (
            availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))
          ) : (
            <option value="">No Financial Reports Found</option>
          )}
        </select>
      </div>

<div className="search-box">
  <svg
    className="search-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>

  <input
    type="text"
    placeholder="Search members..."
    value={searchQuery}
    onChange={handleSearch}
    className="dividend-search-input"
  />
</div>
    </div>

    <div className="table-responsive-wrapper">
      <table className="dividend-table">
        <thead>
          <tr>
            <th>የአባሉ ስም</th>
            <th>ያለው ዕጣ (Shares)</th>
            <th>የድርሻ መጠን (%)</th>
            <th>የትርፍ ክፍፍል (Dividend)</th>
          </tr>
        </thead>

<tbody>
  {filteredMembers.length > 0 ? (
    filteredMembers.map((member) => {
      // 🔥 Calculate share ratio based on total shares
      const shareRatio =
        totals.totalShares > 0
          ? member.sharesPurchased / totals.totalShares
          : 0;

      // 🔥 Dividend = (member shares / total shares) * total profit
      const dividendAmount =
        totals.totalProfit > 0 ? shareRatio * totals.totalProfit : 0;

      return (
        <tr key={member._id}>
          <td className="member-name-cell">
            {member.fullName}
          </td>

          <td>
            {Number(member.sharesPurchased).toLocaleString()}
          </td>

          <td>
            {(shareRatio * 100).toFixed(2)}%
          </td>

          <td className="dividend-amount-cell">
            <strong>
              {dividendAmount > 0 
                ? dividendAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })
                : "0.00"
              }
            </strong>
            {" "} ETB
          </td>
        </tr>
      );
    })
  ) : (
    <tr className="empty-dividend-row">
      <td colSpan="4">ምንም ዳታ አልተገኘም</td>
    </tr>
  )}
</tbody>
      </table>
    </div>
  </div>
);
}

