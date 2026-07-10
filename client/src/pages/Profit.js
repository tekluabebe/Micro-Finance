import React, { useState, useEffect } from "react";
import API from "../services/api";
import "./ProfitDistribution.css";

export default function ProfitDistribution({ isSidebarOpen = true }) {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedMember, setSelectedMember] = useState(null);

  const [distribution, setDistribution] = useState({
    savingAmount: "",
    shareAmount: "",
  });

  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  const [distributedMemberIds, setDistributedMemberIds] = useState(new Set());
  const [netProfit, setNetProfit] = useState(0);
  const [totalShares, setTotalShares] = useState(0);
  const [availableYears, setAvailableYears] = useState([]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Safe dividend calculation:
  // dividend = employeeShares / totalShares * netProfit
  const calculateDividend = (employeeShares) => {
    const shares = Number(employeeShares || 0);
    const total = Number(totalShares || 0);
    const profit = Number(netProfit || 0);

    if (shares <= 0 || total <= 0 || profit <= 0) {
      return 0;
    }

    return (shares / total) * profit;
  };

  // ======================
  // RESPONSIVE
  // ======================
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  

  // ======================
  // LOAD DATA FOR SELECTED YEAR
  // Same approach as Dividend.js
  // ======================
  useEffect(() => {
    fetchDividendCalculationData();
  }, [selectedYear]);

  const fetchDividendCalculationData = async () => {
    try {
     const [employeesRes, depositsRes, financialRes, distributionsRes] =
  await Promise.all([
    API.get("/employees"),
    API.get("/deposits"),
    API.get(`/financial-reports?year=${selectedYear}`),
    API.get(`/profit-distributions?year=${selectedYear}`),
  ]);

      const allEmployees = employeesRes.data || [];
      const allDeposits = depositsRes.data || [];
      const distributions = distributionsRes.data || [];

const alreadyDistributedIds = new Set(
  distributions
    .filter(
      (item) => Number(item.year) === Number(selectedYear)
    )
    .map((item) =>
      String(item.employeeId?._id || item.employeeId)
    )
);

setDistributedMemberIds(alreadyDistributedIds);

      // Supports:
      // [ ...reports ]
      // { data: [ ...reports ] }
      // { reports: [ ...reports ] }
      const financialReports = Array.isArray(financialRes.data)
        ? financialRes.data
        : financialRes.data?.data
        ? financialRes.data.data
        : financialRes.data?.reports
        ? financialRes.data.reports
        : [];

      console.log("Financial reports response:", financialRes.data);
      console.log("Financial reports array:", financialReports);

      // Get only the selected year's financial report(s)
      const selectedYearReports = financialReports.filter(
        (report) => Number(report.year) === Number(selectedYear)
      );

      // If there is one report for 2026:
      // [{ year: 2026, netProfit: 2334 }]
      // result = 2334
      const selectedYearNetProfit = selectedYearReports.reduce(
        (sum, report) => sum + Number(report.netProfit || 0),
        0
      );

      // Total shares from ALL deposits, exactly like Dividend.js
      const calculatedTotalShares = allDeposits.reduce(
        (sum, deposit) => sum + Number(deposit.sharedPurchase || 0),
        0
      );

      const years = [
        ...new Set(
          financialReports
            .map((report) => Number(report.year))
            .filter(Boolean)
        ),
      ].sort((a, b) => b - a);

      setEmployees(allEmployees);
      setNetProfit(selectedYearNetProfit);
      setTotalShares(calculatedTotalShares);
      setAvailableYears(years);

      console.log("Dividend calculation data:", {
        selectedYear,
        netProfit: selectedYearNetProfit,
        totalShares: calculatedTotalShares,
      });

      // Recalculate selected member's shares after data reload/year change.
      if (selectedMember) {
        updateSelectedMemberShares(selectedMember, allDeposits);
      }
    } catch (err) {
      console.error("Profit distribution data error:", err);
      setNetProfit(0);
      setTotalShares(0);
    }
  };

  // ======================
  // UPDATE SELECTED MEMBER
  // ======================
  const updateSelectedMemberShares = (member, deposits) => {
    const memberDeposits = deposits.filter(
      (deposit) =>
        String(deposit.employeeId?._id || deposit.employeeId) ===
        String(member._id)
    );

    const employeeShares = memberDeposits.reduce(
      (sum, deposit) => sum + Number(deposit.sharedPurchase || 0),
      0
    );

    const allShares = deposits.reduce(
      (sum, deposit) => sum + Number(deposit.sharedPurchase || 0),
      0
    );

    const ownershipPercent =
      allShares > 0 ? (employeeShares / allShares) * 100 : 0;

    setSelectedMember({
      ...member,
      fullName:
        member.fullName || `${member.firstName} ${member.lastName}`,
      employeeShares,
      ownershipPercent,
    });
  };

  // ======================
  // DEBUG CONSOLE OUTPUT
  // ======================
  useEffect(() => {
    if (!selectedMember) return;

    const dividend = calculateDividend(selectedMember.employeeShares);

    console.log("=== DIVIDEND CALCULATION ===");
    console.log({
      year: selectedYear,
      netProfit,
      employeeShares: selectedMember.employeeShares,
      totalShares,
      formula: `(${selectedMember.employeeShares} / ${totalShares}) * ${netProfit}`,
      dividend,
    });
  }, [selectedMember, selectedYear, netProfit, totalShares]);

  // ======================
  // SEARCH EMPLOYEE
  // ======================
  const handleSearch = (e) => {
    const value = e.target.value;

    setSearchTerm(value);
    setShowDropdown(true);

    const filtered = employees.filter(
      (employee) =>
        employee.memberId?.toString().includes(value) ||
        `${employee.firstName} ${employee.lastName}`
          .toLowerCase()
          .includes(value.toLowerCase())
    );

    setFilteredEmployees(filtered);
  };

  // ======================
  // SELECT MEMBER
  // ======================
  const handleSelect = async (member) => {
    try {
      const depositsRes = await API.get("/deposits");
      const deposits = depositsRes.data || [];

      updateSelectedMemberShares(member, deposits);

      setShowDropdown(false);
      setSearchTerm("");
    } catch (err) {
      console.error("Member selection error:", err);
    }
  };

  // Calculate once for rendering and approval
const isAlreadyDistributed =
  selectedMember &&
  distributedMemberIds.has(String(selectedMember._id));

const dividend = selectedMember
  ? isAlreadyDistributed
    ? 0
    : calculateDividend(selectedMember.employeeShares)
  : 0;

  // ======================
  // APPROVE
  // ======================
  const handleApprove = async () => {
    if (!selectedMember) {
      alert("Please select a member.");
      return;
    }
    if (isAlreadyDistributed) {
  alert(
    `Profit distribution has already been completed for ${selectedMember.fullName} in ${selectedYear}.`
  );
  return;
}

    const saving = Number(distribution.savingAmount || 0);
    const shareMoney = Number(distribution.shareAmount || 0);
    const totalDistributed = saving + shareMoney;

    if (totalDistributed <= 0) {
      alert("Please enter an amount to distribute.");
      return;
    }

    if (totalDistributed > dividend) {
      alert(
        `Distribution cannot exceed dividend amount (${dividend.toFixed(
          2
        )} ETB)`
      );
      return;
    }

    if (shareMoney > 0 && shareMoney % 500 !== 0) {
      alert(
        "Share amount must be 500, 1000, 1500, 2000 ETB, etc. (multiples of 500)"
      );
      return;
    }

    if (shareMoney > 0 && dividend < 500) {
      alert(
        "This member's dividend is less than 500 ETB. Shares cannot be purchased."
      );
      return;
    }

    const extraShares = shareMoney / 500;

    try {
      if (saving > 0) {
        await API.post("/deposits", {
          employeeId: selectedMember._id,
          normalSaving: saving,
          voluntarySaving: 0,
          sharedPurchase: 0,
          year: selectedYear,
        });
      }

      if (extraShares > 0) {
        await API.post("/deposits", {
          employeeId: selectedMember._id,
          normalSaving: 0,
          voluntarySaving: 0,
          sharedPurchase: extraShares,
          year: selectedYear,
        });
      }

      await API.post("/profit-distributions", {
        employeeId: selectedMember._id,
        year: selectedYear,
        dividendAmount: dividend,
        savingAmount: saving,
        shareAmount: shareMoney,
      });

      alert("Profit distributed successfully!");

      setDistribution({
        savingAmount: "",
        shareAmount: "",
      });

      await fetchDividendCalculationData();
    } catch (err) {
      console.error("Approve error:", err);

      alert(
        err.response?.data?.message ||
          "Failed to save profit distribution."
      );
    }
  };

  const currentLeftMargin = isMobile
    ? "0px"
    : isSidebarOpen
    ? "35px"
    : "30px";

  return (
    <div
      className="pd-main-wrapper"
      style={{
        marginLeft: currentLeftMargin,
        width: isMobile ? "100%" : `calc(100% - ${currentLeftMargin})`,
      }}
    >
      <div className="pd-top-bar">
        <h2>የትርፍ ክፍፍል</h2>

        <p>
          Search and select a member to calculate and distribute annual
          dividends.
        </p>

<div className="member-search-wrapper">
  <div className="search-container">

    <div className="search-box">

      <span className="search-icon">
        🔍
      </span>

      <input
        type="text"
        placeholder="Search member by Name or Member ID..."
        value={searchTerm}
        onChange={handleSearch}
        onFocus={() => setShowDropdown(true)}
      />

      <span className="search-glow"></span>

    </div>

    {showDropdown && searchTerm && (
      <div className="dropdown">

        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee) => (
            <button
              key={employee._id}
              type="button"
              className="dropdown-member"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(employee)}
            >
              <span className="dropdown-avatar">
                {employee.firstName?.charAt(0)}
                {employee.lastName?.charAt(0)}
              </span>

              <span className="dropdown-member-info">
                <strong>
                  {employee.firstName} {employee.lastName}
                </strong>

                <small>
                  Member ID : {employee.memberId}
                </small>
              </span>
            </button>
          ))
        ) : (
          <div className="dropdown-empty">
            No member found
          </div>
        )}

      </div>
    )}

  </div>
</div>
      </div>

      {selectedMember ? (
        <div className="cards">
          <div className="year-card">
            <h3>ዓመት ይምረጡ</h3>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="year-select"
            >
              {availableYears.length > 0 ? (
                availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))
              ) : (
                <option value={selectedYear}>{selectedYear}</option>
              )}
            </select>
          </div>

          <div className="member-card">
            <h3>የአባል መረጃ</h3>

            <div className="member-profile">
              <img
                src={
                  selectedMember.photo ||
                  selectedMember.profileImage ||
                  selectedMember.image ||
                  "/avator.jpg"
                }
                alt={selectedMember.fullName}
                className="member-photo"
              />

              <div className="member-details">
                <h2 className="member-name">
                  {selectedMember.fullName}
                </h2>

                <p className="member-id">
                  Member ID: {selectedMember.memberId}
                </p>
              </div>
            </div>
          </div>

             <div>
  <h3>ሊከፋፈል የሚገባው ትርፍ ({selectedYear})</h3>

  {isAlreadyDistributed && (
    <p className="already-distributed-message">
      Profit has already been distributed to this member for {selectedYear}.
      Dividend amount is now 0 ETB.
    </p>
  )}

  <h2>
    {dividend.toLocaleString(undefined, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })}{" "}
    ETB
  </h2>

            <p>
              Shares: {selectedMember.employeeShares} (
              {selectedMember.ownershipPercent?.toFixed(2)}%)
            </p>

            <p>Net Profit: {netProfit.toLocaleString()} ETB</p>

            <p>Total Shares: {totalShares}</p>
          </div>

          <div>
            <h3>የክፍፍል ስርጭት</h3>

           <input
  type="number"
  placeholder="Saving"
  value={distribution.savingAmount}
  disabled={isAlreadyDistributed}
  onChange={(e) =>
    setDistribution({
      ...distribution,
      savingAmount: e.target.value,
    })
  }
/>

           <input
  type="number"
  min="0"
  step="500"
  placeholder="Share money (500 = 1 share)"
  value={distribution.shareAmount}
  disabled={isAlreadyDistributed}
  onChange={(e) =>
    setDistribution({
      ...distribution,
      shareAmount: e.target.value,
    })
  }
/>
              
            <div className="distribution-summary">
              <p>
                <strong>Dividend:</strong> {dividend.toFixed(2)} ETB
              </p>

              <p>
                <strong>Saving:</strong>{" "}
                {Number(distribution.savingAmount || 0).toFixed(2)} ETB
              </p>

              <p>
                <strong>Share Purchase:</strong>{" "}
                {Number(distribution.shareAmount || 0).toFixed(2)} ETB
              </p>

              <p>
                <strong>New Shares:</strong>{" "}
                {Number(distribution.shareAmount || 0) / 500}
              </p>
            </div>
          </div>

          <div>
            <h3>ማጠቃለያ</h3>

            <p>
              Remaining:{" "}
              {Math.max(
                0,
                dividend -
                  (Number(distribution.savingAmount || 0) +
                    Number(distribution.shareAmount || 0))
              ).toFixed(2)}{" "}
              ETB
            </p>

            <button
  onClick={handleApprove}
  disabled={isAlreadyDistributed}
>
  {isAlreadyDistributed ? "Already Distributed" : "አጽድቅ"}
</button>
          </div>
        </div>
      ) : (
        <p>Select a member</p>
      )}
    </div>
  );
}