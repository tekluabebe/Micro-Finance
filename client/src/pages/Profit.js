import React, { useEffect, useState } from "react";
import { useAppContext } from "./context";
import { translate } from "../utils/translations";
import API from "../services/api";
import "./ProfitDistribution.css";

export default function ProfitDistribution() {
  const { language, isMobile } = useAppContext();
  const t = (text) => translate(language, text);
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

  const getArray = (response) => {
    if (Array.isArray(response)) return response;
    return response?.data || response?.reports || [];
  };

  const findDividendHistory = (member, history = dividendHistory) =>
    history
      .filter((item) => {
        const sameYear = Number(item.year) === Number(selectedYear);
        const sameMember =
          String(item.memberId || "") === String(member.memberId || "") ||
          String(item.employeeId?._id || item.employeeId || "") ===
            String(member._id || "");
        return sameYear && sameMember;
      })
      .sort(
        (first, second) =>
          new Date(second.updatedAt || second.createdAt || 0) -
          new Date(first.updatedAt || first.createdAt || 0)
      )[0];

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
      const employeeId = String(
        deposit.employeeId?._id || deposit.employeeId || ""
      );
      const memberId = String(
        deposit.memberId || deposit.employeeId?.memberId || ""
      );
      return (
        employeeId === String(member._id) ||
        (member.memberId && memberId === String(member.memberId))
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

    return {
      ...member,
      fullName:
        member.fullName ||
        `${member.firstName || ""} ${member.lastName || ""}`.trim(),
      employeeShares: memberShares,
      ownershipPercent:
        sharesTotal > 0 ? (memberShares / sharesTotal) * 100 : 0,
      calculatedDividend,
      historyItem: findDividendHistory(member, history),
    };
  };

  const fetchDividendCalculationData = async () => {
    try {
      const [employeesResponse, depositsResponse, reportsResponse, historyResponse] =
        await Promise.all([
          API.get("/employees"),
          API.get("/deposits"),
          API.get(`/financial-reports?year=${selectedYear}`),
          API.get(`/dividends?year=${selectedYear}`),
        ]);
      const allEmployees = getArray(employeesResponse.data);
      const allDeposits = getArray(depositsResponse.data);
      const reports = getArray(reportsResponse.data);
      const history = getArray(historyResponse.data);
      const yearDeposits = allDeposits.filter(
        (deposit) => String(deposit.year) === String(selectedYear)
      );
      const shares = yearDeposits.reduce(
        (sum, deposit) => sum + Number(deposit.sharedPurchase || 0),
        0
      );
      const profit = reports
        .filter((report) => Number(report.year) === Number(selectedYear))
        .reduce((sum, report) => sum + Number(report.netProfit || 0), 0);
      const years = [
        ...new Set(reports.map((report) => Number(report.year)).filter(Boolean)),
      ].sort((first, second) => second - first);

      setEmployees(allEmployees);
      setFilteredEmployees(allEmployees);
      setDividendHistory(history);
      setTotalShares(shares);
      setNetProfit(profit);
      setAvailableYears(years);

      if (selectedMember) {
        const updatedMember = allEmployees.find(
          (employee) =>
            String(employee.memberId) === String(selectedMember.memberId)
        );
        if (updatedMember) {
          setSelectedMember(
            calculateMemberData(updatedMember, allDeposits, shares, profit, history)
          );
        }
      }
    } catch (error) {
      console.error("Profit data error:", error);
      setNetProfit(0);
      setTotalShares(0);
      setDividendHistory([]);
    }
  };

  useEffect(() => {
    fetchDividendCalculationData();
  }, [selectedYear]);

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    setFilteredEmployees(
      employees.filter((employee) => {
        const fullName = `${employee.firstName || ""} ${
          employee.lastName || ""
        }`.toLowerCase();
        return (
          String(employee.memberId || "").includes(value) ||
          fullName.includes(value.toLowerCase())
        );
      })
    );
  };

  const handleSelect = async (member) => {
    try {
      const response = await API.get("/deposits");
      setSelectedMember(calculateMemberData(member, getArray(response.data)));
      setShowDropdown(false);
      setSearchTerm("");
    } catch (error) {
      console.error("Member selection error:", error);
    }
  };

  const historyItem = selectedMember
    ? findDividendHistory(selectedMember)
    : null;
  const dividend = historyItem
    ? Number(historyItem.remainingAmount ?? 0)
    : Number(selectedMember?.calculatedDividend || 0);
  const saving = Number(distribution.savingAmount || 0);
  const shareMoney = Number(distribution.shareAmount || 0);
  const extraShares = shareMoney / 500;
  const totalDistributed = saving + shareMoney;
  const remaining = Math.max(0, dividend - totalDistributed);
  const isFullyDistributed =
    Boolean(historyItem) && Number(historyItem.remainingAmount || 0) <= 0.01;

  const handleApprove = async () => {
    if (!selectedMember) {
      alert(t("Please select a member."));
      return;
    }
    if (isFullyDistributed) {
      alert(t("This member's dividend is already fully distributed."));
      return;
    }
    if (totalDistributed <= 0) {
      alert(t("Enter saving amount or share amount."));
      return;
    }
    if (totalDistributed > dividend) {
      alert(`Distribution cannot exceed ${dividend.toFixed(2)} ETB.`);
      return;
    }
    if (shareMoney > 0 && shareMoney % 500 !== 0) {
      alert(t("Share money must be a multiple of 500 ETB."));
      return;
    }

    try {
      await API.post("/profit-distributions", {
        employeeId: selectedMember._id,
        memberId: selectedMember.memberId,
        year: Number(selectedYear),
        dividendAmount: dividend,
        savingAmount: saving,
        shareAmount: shareMoney,
        distributedAmount: totalDistributed,
        remainingAmount: remaining,
        status: "approved",
      });

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

      alert(`✅ Distribution saved.\n${t("Remaining")}: ${remaining.toFixed(2)} ETB`);
      setDistribution({ savingAmount: "", shareAmount: "" });
      const historyResponse = await API.get(`/dividends?year=${selectedYear}`);
      setDividendHistory(getArray(historyResponse.data));
      await fetchDividendCalculationData();
    } catch (error) {
      console.error("Distribution save error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Failed to save distribution ❌");
    }
  };

  const currentLeftMargin = isMobile ? "0px" : "35px";

  return (
    <div
      className="pd-main-wrapper"
      style={{
        marginLeft: currentLeftMargin,
        width: isMobile ? "100%" : `calc(100% - ${currentLeftMargin})`,
      }}
    >
      <div className="pd-top-bar">
        <h2>{t("Dividend Distribution")}</h2>
        <p>{t("Search and select a member to distribute annual dividends.")}</p>
        <div className="member-search-wrapper">
          <div className="search-container">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder={t("Search member by Name or Member ID...")}
                value={searchTerm}
                onChange={handleSearch}
                onFocus={() => setShowDropdown(true)}
              />
            </div>
            {showDropdown && searchTerm && (
              <div className="dropdown">
                {filteredEmployees.length ? (
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
                        <strong>{employee.firstName} {employee.lastName}</strong>
                        <small>{t("Member ID")}: {employee.memberId}</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="dropdown-empty">{t("No member found")}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedMember ? (
        <div className="cards">
          <div className="year-card">
            <h3>{t("Select a year")}</h3>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="year-select"
            >
              {(availableYears.length ? availableYears : [selectedYear]).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="member-card">
            <h3>{t("Member Information")}</h3>
            <h2 className="member-name">{selectedMember.fullName}</h2>
            <p className="member-id">{t("Member ID")}: {selectedMember.memberId}</p>
          </div>
          <div>
            <h3>{t("Profit to be distributed")} ({selectedYear})</h3>
            <h2>{dividend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</h2>
            <p>{t("Shares")}: {selectedMember.employeeShares} ({selectedMember.ownershipPercent.toFixed(2)}%)</p>
            <p>{t("Net Profit")}: {netProfit.toLocaleString()} ETB</p>
            <p>{t("Total Shares")}: {totalShares}</p>
          </div>
          <div>
            <h3>{t("Dividend Distribution")}</h3>
            <input
              type="number"
              min="0"
              placeholder={t("Saving")}
              value={distribution.savingAmount}
              disabled={isFullyDistributed}
              onChange={(event) => setDistribution((previous) => ({ ...previous, savingAmount: event.target.value }))}
            />
            <input
              type="number"
              min="0"
              step="500"
              placeholder={t("Share money (500 = 1 share)")}
              value={distribution.shareAmount}
              disabled={isFullyDistributed}
              onChange={(event) => setDistribution((previous) => ({ ...previous, shareAmount: event.target.value }))}
            />
            <div className="distribution-summary">
              <p><strong>{t("Dividend")}:</strong> {dividend.toFixed(2)} ETB</p>
              <p><strong>{t("Saving:")}</strong> {saving.toFixed(2)} ETB</p>
              <p><strong>{t("Share Purchase:")}</strong> {shareMoney.toFixed(2)} ETB</p>
              <p><strong>{t("New Shares:")}</strong> {extraShares}</p>
            </div>
          </div>
          <div>
            <h3>{t("Summary")}</h3>
            <p>{t("Remaining")}: {remaining.toFixed(2)} ETB</p>
            <button type="button" onClick={handleApprove} disabled={isFullyDistributed}>
              {isFullyDistributed ? t("Already distributed") : t("Approve")}
            </button>
          </div>
        </div>
      ) : (
        <p>{t("Select a member")}</p>
      )}
    </div>
  );
}