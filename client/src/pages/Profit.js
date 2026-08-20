// filepath: d:\micro-finance\client\src\pages\Profit.js
import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./ProfitDistribution.css";

export default function ProfitDistribution({ isSidebarOpen = true }) {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [dividendHistory, setDividendHistory] = useState([]);
  const [distribution, setDistribution] = useState({
    savingAmount: "",
    shareAmount: "",
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [netProfit, setNetProfit] = useState(0);
  const [totalShares, setTotalShares] = useState(0);
  const [availableYears, setAvailableYears] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth <= 768);

    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    fetchDividendCalculationData();
  }, [selectedYear]);

  const getArray = (response) => {
    if (Array.isArray(response)) return response;
    return response?.data || response?.reports || [];
  };

const findDividendHistory = (member, history = dividendHistory) => {
  return history
    .filter((item) => {
      const sameYear =
        Number(item.year) === Number(selectedYear);

      const sameMember =
        String(item.memberId || "") ===
          String(member.memberId || "") ||
        String(item.employeeId?._id || item.employeeId || "") ===
          String(member._id || "");

      return sameYear && sameMember;
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    )[0];
};

  const calculateMemberData = (
    member,
    deposits,
    sharesTotal = totalShares,
    profitTotal = netProfit,
    history = dividendHistory
  ) => {
    const yearDeposits = deposits.filter(
      (deposit) => String(deposit.year) === String(selectedYear)
    );

    const memberDeposits = yearDeposits.filter((deposit) => {
      const depositEmployeeId = String(
        deposit.employeeId?._id || deposit.employeeId || ""
      );

      const depositMemberId = String(
        deposit.memberId || deposit.employeeId?.memberId || ""
      );

      return (
        depositEmployeeId === String(member._id) ||
        (member.memberId &&
          depositMemberId === String(member.memberId))
      );
    });

    const memberShares = memberDeposits.reduce(
      (sum, deposit) => sum + Number(deposit.sharedPurchase || 0),
      0
    );

    const calculatedDividend =
      sharesTotal > 0
        ? (memberShares / sharesTotal) * Number(profitTotal || 0)
        : 0;

    const historyItem = findDividendHistory(member, history);

    return {
      ...member,
      fullName:
        member.fullName ||
        `${member.firstName || ""} ${member.lastName || ""}`.trim(),
      employeeShares: memberShares,
      ownershipPercent:
        sharesTotal > 0 ? (memberShares / sharesTotal) * 100 : 0,
      calculatedDividend,
      historyItem,
    };
  };

  const fetchDividendCalculationData = async () => {
    try {
      const [employeesRes, depositsRes, financialRes, dividendRes] =
        await Promise.all([
          API.get("/employees"),
          API.get("/deposits"),
          API.get(`/financial-reports?year=${selectedYear}`),
          API.get(`/dividends?year=${selectedYear}`),
        ]);

      const allEmployees = getArray(employeesRes.data);
      const allDeposits = getArray(depositsRes.data);
      const financialReports = getArray(financialRes.data);
      const history = getArray(dividendRes.data);

      const yearDeposits = allDeposits.filter(
        (deposit) => String(deposit.year) === String(selectedYear)
      );

      const shares = yearDeposits.reduce(
        (sum, deposit) => sum + Number(deposit.sharedPurchase || 0),
        0
      );

      const profit = financialReports
        .filter(
          (report) => Number(report.year) === Number(selectedYear)
        )
        .reduce(
          (sum, report) => sum + Number(report.netProfit || 0),
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
      setFilteredEmployees(allEmployees);
      setDividendHistory(history);
      setTotalShares(shares);
      setNetProfit(profit);
      setAvailableYears(years);

      if (selectedMember) {
        const updatedMember = allEmployees.find(
          (employee) =>
            String(employee.memberId) ===
            String(selectedMember.memberId)
        );

        if (updatedMember) {
          setSelectedMember(
            calculateMemberData(
              updatedMember,
              allDeposits,
              shares,
              profit,
              history
            )
          );
        }
      }
    } catch (err) {
      console.error("Profit data error:", err);
      setNetProfit(0);
      setTotalShares(0);
      setDividendHistory([]);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;

    setSearchTerm(value);
    setShowDropdown(true);

    setFilteredEmployees(
      employees.filter((employee) => {
        const name =
          `${employee.firstName || ""} ${
            employee.lastName || ""
          }`.toLowerCase();

        return (
          String(employee.memberId || "").includes(value) ||
          name.includes(value.toLowerCase())
        );
      })
    );
  };

  const handleSelect = async (member) => {
    try {
      const depositsRes = await API.get("/deposits");
      const deposits = getArray(depositsRes.data);

      setSelectedMember(
        calculateMemberData(member, deposits)
      );

      setShowDropdown(false);
      setSearchTerm("");
    } catch (err) {
      console.error("Member selection error:", err);
    }
  };

const historyItem = selectedMember
  ? findDividendHistory(selectedMember)
  : null;

const originalDividend = historyItem
  ? Number(
      historyItem.dividendAmount ??
        selectedMember?.calculatedDividend ??
        0
    )
  : Number(selectedMember?.calculatedDividend || 0);

const dividend = historyItem
  ? Number(historyItem.remainingAmount ?? 0)
  : originalDividend;

const saving = Number(distribution.savingAmount || 0);
const shareMoney = Number(distribution.shareAmount || 0);
const extraShares = shareMoney / 500;
const totalDistributed = saving + shareMoney;

const remaining = Math.max(
  0,
  dividend - totalDistributed
);

// filepath: d:\micro-finance\client\src\pages\Profit.js

const isFullyDistributed =
  Boolean(historyItem) &&
  Number(historyItem.remainingAmount || 0) <= 0.01;

const handleApprove = async () => {
  if (!selectedMember) {
    alert("Please select a member.");
    return;
  }

 // filepath: d:\micro-finance\client\src\pages\Profit.js

if (isFullyDistributed) {
  alert("This member's dividend is already fully distributed.");
  return;
}

  if (totalDistributed <= 0) {
    alert("Enter saving amount or share amount.");
    return;
  }

  if (totalDistributed > dividend) {
    alert(`Distribution cannot exceed ${dividend.toFixed(2)} ETB.`);
    return;
  }

  if (shareMoney > 0 && shareMoney % 500 !== 0) {
    alert("Share money must be a multiple of 500 ETB.");
    return;
  }

  try {
    // Save distribution first.
    const distributionResponse = await API.post(
      "/profit-distributions",
      {
        employeeId: selectedMember._id,
        memberId: selectedMember.memberId,
        year: Number(selectedYear),
        dividendAmount: dividend,
        savingAmount: saving,
        shareAmount: shareMoney,
        distributedAmount: totalDistributed,
        remainingAmount: remaining,
        status: "approved",
      }
    );

    // Save saving as a deposit.
    if (saving > 0) {
      await API.post("/deposits", {
        employeeId: selectedMember._id,
        memberId: selectedMember.memberId,
        month: `Dividend-${Date.now()}`,
        year: String(selectedYear),
        normalSaving: saving,
        voluntarySaving: 0,
        sharedPurchase: 0,
        registrationFee: 0,
        latePenalty: 0,
        depositForPurchase: 0,
      });
    }

    // Save shares as a deposit.
    if (extraShares > 0) {
      await API.post("/deposits", {
        employeeId: selectedMember._id,
        memberId: selectedMember.memberId,
        month: `Dividend-Shares-${Date.now()}`,
        year: String(selectedYear),
        normalSaving: 0,
        voluntarySaving: 0,
        sharedPurchase: extraShares,
        registrationFee: 0,
        latePenalty: 0,
        depositForPurchase: shareMoney,
      });
    }

    console.log(
      "Saved distribution:",
      distributionResponse.data
    );

    alert(
      `✅ Distribution saved.\nRemaining: ${remaining.toFixed(2)} ETB`
    );

    setDistribution({
      savingAmount: "",
      shareAmount: "",
    });

    const updatedDividendRes = await API.get(
  `/dividends?year=${selectedYear}`
);

setDividendHistory(getArray(updatedDividendRes.data));

await fetchDividendCalculationData();
  } catch (err) {
    console.error(
      "Distribution save error:",
      err.response?.data || err.message
    );

    alert(
      err.response?.data?.message ||
        "Failed to save distribution ❌"
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
        width: isMobile
          ? "100%"
          : `calc(100% - ${currentLeftMargin})`,
      }}
    >
      <div className="pd-top-bar">
        <h2>የትርፍ ክፍፍል</h2>
        <p>
          Search and select a member to distribute annual dividends.
        </p>

        <div className="member-search-wrapper">
          <div className="search-container">
            <div className="search-box">
              <span className="search-icon">🔍</span>

              <input
                type="text"
                placeholder="Search member by Name or Member ID..."
                value={searchTerm}
                onChange={handleSearch}
                onFocus={() => setShowDropdown(true)}
              />
            </div>

            {showDropdown && searchTerm && (
              <div className="dropdown">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <button
                      key={employee._id}
                      type="button"
                      className="dropdown-member"
                      onClick={() => handleSelect(employee)}
                    >
                      <span className="dropdown-avatar">
                        {employee.firstName?.charAt(0)}
                        {employee.lastName?.charAt(0)}
                      </span>

                      <span className="dropdown-member-info">
                        <strong>
                          {employee.firstName}{" "}
                          {employee.lastName}
                        </strong>

                        <small>
                          Member ID: {employee.memberId}
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
              onChange={(e) =>
                setSelectedYear(Number(e.target.value))
              }
              className="year-select"
            >
              {(availableYears.length
                ? availableYears
                : [selectedYear]
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
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
            <h3>
              ሊከፋፈል የሚገባው ትርፍ ({selectedYear})
            </h3>

            <h2>
              {dividend.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              ETB
            </h2>

            <p>
              Shares: {selectedMember.employeeShares} (
              {selectedMember.ownershipPercent.toFixed(2)}%)
            </p>

            <p>
              Net Profit: {netProfit.toLocaleString()} ETB
            </p>

            <p>Total Shares: {totalShares}</p>
          </div>

          <div>
            <h3>የክፍፍል ስርጭት</h3>

            <input
              type="number"
              min="0"
              placeholder="Saving"
              value={distribution.savingAmount}
              disabled={isFullyDistributed}
              onChange={(e) =>
                setDistribution((prev) => ({
                  ...prev,
                  savingAmount: e.target.value,
                }))
              }
            />

            <input
              type="number"
              min="0"
              step="500"
              placeholder="Share money (500 = 1 share)"
              value={distribution.shareAmount}
              disabled={isFullyDistributed}
              onChange={(e) =>
                setDistribution((prev) => ({
                  ...prev,
                  shareAmount: e.target.value,
                }))
              }
            />

            <div className="distribution-summary">
              <p>
                <strong>Dividend:</strong>{" "}
                {dividend.toFixed(2)} ETB
              </p>

              <p>
                <strong>Saving:</strong>{" "}
                {saving.toFixed(2)} ETB
              </p>

              <p>
                <strong>Share Purchase:</strong>{" "}
                {shareMoney.toFixed(2)} ETB
              </p>

              <p>
                <strong>New Shares:</strong>{" "}
                {extraShares}
              </p>
            </div>
          </div>

          <div>
            <h3>ማጠቃለያ</h3>

            <p>
              Remaining: {remaining.toFixed(2)} ETB
            </p>

        

<button
  type="button"
  onClick={handleApprove}
  disabled={isFullyDistributed}
>
  {isFullyDistributed
    ? "Already distributed"
    : "አጽድቅ"}
</button>
          </div>
        </div>
      ) : (
        <p>Select a member</p>
      )}
    </div>
  );
}