import React, { useState, useEffect } from "react";
import API from "../services/api";
import "./ProfitDistribution.css";

// 💡 ሳይድባሩ ሲዘጋና ሲከፈት ገጹ አብሮ እንዲለጠጥ ፕሮፕስ ተቀብለናል
export default function ProfitDistribution({ isSidebarOpen = true }) {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [distribution, setDistribution] = useState({ savingAmount: "", shareAmount: "" });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // የስክሪን መጠን መለወጫ ማዳመጫ (Responsive Listener)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    API.get("/employees").then(res => setEmployees(res.data || []));
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    const filtered = employees.filter(emp => 
      emp.memberId?.toString().toLowerCase().includes(value.toLowerCase()) ||
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  const handleSelect = (member) => {
    const dividend = ((member.sharedPurchase || 0) / 1000) * 50000; 
    setSelectedMember({ ...member, fullName: `${member.firstName} ${member.lastName}`, dividend });
    setShowDropdown(false);
    setSearchTerm("");
  };

  // 🛠️ ከሳይድባር አቀማመጥ ጋር ማጣበቂያ ተለዋዋጭ ማርጅን
  const currentLeftMargin = isMobile ? "0px" : (isSidebarOpen ? "130px" : "65px");

  const dynamicWrapperStyle = {
    marginLeft: currentLeftMargin,
    width: isMobile ? "100%" : `calc(100% - ${currentLeftMargin})`,
  };

  return (
    <div className="pd-main-wrapper" style={dynamicWrapperStyle}>
      <div className="pd-top-bar">
        <h1>የትርፍ ክፍፍል ማዕከል</h1>
        <div className="pd-search-container">
          <input 
            type="text" 
            className="pd-search-input"
            placeholder="መታወቂያ ወይም ስም ይጻፉ..." 
            value={searchTerm}
            onChange={handleSearch}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && searchTerm && (
            <div className="pd-modern-dropdown">
              {filteredEmployees.map(emp => (
                <div key={emp._id} className="pd-dropdown-option" onClick={() => handleSelect(emp)}>
                  <div className="pd-opt-avatar">{emp.firstName[0]}</div>
                  <div className="pd-opt-info">
                    <span className="pd-opt-name">{emp.firstName} {emp.lastName}</span>
                    <span className="pd-opt-id">ID: #{emp.memberId}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedMember ? (
        <div className="pd-card-grid">
          {/* ካርድ 1: Profile (ትንሽ መጠን) */}
          <div className="pd-card pd-card-small">
            <div className="pd-card-icon">👤</div>
            <h3>የአባል መረጃ</h3>
            <p className="pd-emp-name">{selectedMember.fullName}</p>
            <p className="pd-emp-id">መታወቂያ: #{selectedMember.memberId}</p>
          </div>

          {/* ካርድ 2: Dividend (ትልቅ መጠን) */}
          <div className="pd-card pd-card-large">
            <div className="pd-card-icon">💰</div>
            <h3>ሊከፋፈል የሚገባው ትርፍ</h3>
            <h2 className="pd-amount-text">{selectedMember.dividend.toLocaleString()} <span>ETB</span></h2>
            <div className="pd-progress-container">
              <div className="pd-progress-bar" style={{width: '75%'}}></div>
            </div>
            <p className="pd-hint">ይህ መጠን የተሰላው ካለዎት {selectedMember.sharedPurchase} ዕጣ አንጻር ነው</p>
          </div>

          {/* ካርድ 3: Input Form (መካከለኛ መጠን) */}
          <div className="pd-card pd-card-medium">
            <div className="pd-card-icon">📝</div>
            <h3>የክፍፍል ስርጭት</h3>
            <div className="pd-input-group">
              <label>ወደ ቁጠባ (Saving)</label>
              <input type="number" placeholder="0.00" value={distribution.savingAmount} onChange={(e) => setDistribution({...distribution, savingAmount: e.target.value})} />
            </div>
            <div className="pd-input-group">
              <label>ለዕጣ ግዢ (Share ≥ 500)</label>
              <input type="number" placeholder="500" value={distribution.shareAmount} onChange={(e) => setDistribution({...distribution, shareAmount: e.target.value})} />
            </div>
          </div>

          {/* ካርድ 4: Summary (ትንሽ መጠን) */}
          <div className="pd-card pd-card-small pd-summary-card">
            <div className="pd-card-icon">📊</div>
            <h3>ማጠቃለያ</h3>
            <div className="pd-summary-row">
              <span>ቀሪ:</span>
              <strong>{(selectedMember.dividend - (parseFloat(distribution.savingAmount || 0) + parseFloat(distribution.shareAmount || 0))).toFixed(2)} ETB</strong>
            </div>
            <button className="pd-confirm-btn">አጽድቅ</button>
          </div>
        </div>
      ) : (
        /* 💡 አባል ሳይመረጥ ሲቀር የሚታይ የሚያምር መረጃ ሰጭ ሳጥን (Placeholder) */
        <div className="pd-placeholder-container">
          <div className="pd-placeholder-icon">ℹ️</div>
          <p>የትርፍ ክፍፍል ዝርዝር ሁኔታን ለማየት እባክዎ ከላይ አባል በስም ወይም በመታወቂያ ይፈልጉ::</p>
        </div>
      )}
    </div>
  );
}