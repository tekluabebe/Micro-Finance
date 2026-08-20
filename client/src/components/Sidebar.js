import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../pages/context";
import {
  FaTachometerAlt,
  FaUsers,
  FaPiggyBank,
  FaHandHoldingUsd,
  FaMoneyCheckAlt,
  FaWallet,
  FaChartBar,
  FaChevronLeft,
  FaChevronRight,
  FaQuestionCircle,
  FaCog,
  FaCaretDown,
  FaCaretRight,
  FaPercentage,
  FaChartLine,
  FaBars,
  FaTimes,
  FaFileInvoiceDollar,
  FaBalanceScale,
  FaFileAlt,
  FaExchangeAlt,
  FaUser,
} from "react-icons/fa";


export default function Sidebar({ isOpen, setIsSidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Only language is used from Settings/AppContext.
  // Dark mode is intentionally NOT used in Sidebar.
  const { language } = useAppContext();

  const userRole =
    localStorage.getItem("userRole")?.toLowerCase() || "member";

  const isMember = userRole === "member";

  const [openProfit, setOpenProfit] = useState(false);
  const [openFinancials, setOpenFinancials] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const texts = {
    Amharic: {
      logo: "ማይክሮፋይናንስ ዌብ",
      dashboard: "ዳሽቦርድ",
      employees: "አባላቶች",
      deposits: "ተቀማጭ ገንዘብ",
      loans: "ብድር",
      loanPayments: "የብድር ክፍያ",
      withdrawals: "ከማህበሩ መውጣት",
      reports: "ሪፖርቶች",
      profile: "መገለጫ",
      profitProduct: "ትርፍ እና ዲቪደንድ",
      dividend: "ዲቪደንድ",
      profit: "ትርፍ",
      financialReports: "የፋይናንስ ሪፖርቶች",
      incomeExpense: "ገቢና ወጪ",
      balanceSheet: "ሃብትና እዳ",
      cashFlow: "የገንዘብ እንቅስቃሴ",
      checkBalance: "ቼክ እና ባላንስ",
      help: "እገዛ",
      settings: "ቅንብሮች",
    },

    English: {
      logo: "Microfinance Web",
      dashboard: "Dashboard",
      employees: "Members",
      deposits: "Deposits",
      loans: "Loans",
      loanPayments: "Loan Payments",
      withdrawals: "Leave-from-association ",
      reports: "Reports",
      profile: "Profile",
      profitProduct: "Profit Product",
      dividend: "Dividend",
      profit: "Profit",
      financialReports: "Financial Reports",
      incomeExpense: "Income & Expense",
      balanceSheet: "Balance Sheet",
      cashFlow: "Cash Flow",
      checkBalance: "Check and Balance",
      help: "Help",
      settings: "Settings",
    },

    Oromiffa: {
      logo: "Maayikiroo Faayinaansii",
      dashboard: "Daashboordii",
      employees: "Hojjettoota",
      deposits: "Qusannoo",
      loans: "Liqii",
      loanPayments: "Kaffaltii Liqii",
      withdrawals: "Baasiin Maallaqaa",
      reports: "Gabaasota",
      profile: "Piroofaayilii",
      profitProduct: "Bu'aa fi Dividandii",
      dividend: "Dividandii",
      profit: "Bu'aa",
      financialReports: "Gabaasota Faayinaansii",
      incomeExpense: "Galii fi Baasii",
      balanceSheet: "Qabeenya fi Liqii",
      cashFlow: "Sochii Maallaqaa",
      checkBalance: "Sakatta'iinsa fi Baalaansii",
      help: "Gargaarsa",
      settings: "Sajoo",
    },

    Tigrigna: {
      logo: "ማይክሮፋይናንስ ዌብ",
      dashboard: "ዳሽቦርድ",
      employees: "ሰራሕተኛታት",
      deposits: "ተቐማጢ ገንዘብ",
      loans: "ልቓሕ",
      loanPayments: "ክፍሊት ልቓሕ",
      withdrawals: "ገንዘብ ምውጻእ",
      reports: "ጸብጻባት",
      profile: "ፕሮፋይል",
      profitProduct: "መኽሰብን ዲቪደንድን",
      dividend: "ዲቪደንድ",
      profit: "መኽሰብ",
      financialReports: "ናይ ፋይናንስ ጸብጻባት",
      incomeExpense: "እቶትን ወጻኢን",
      balanceSheet: "ሃብትን ዕዳን",
      cashFlow: "ምንቅስቓስ ገንዘብ",
      checkBalance: "ምርመራን ባላንስን",
      help: "ሓገዝ",
      settings: "ቅንብራት",
    },
  };

  const t = texts[language] || texts.Amharic;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;

      setIsMobile(mobile);

      if (!mobile) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (location.pathname === "/dividend" || location.pathname === "/profit") {
      setOpenProfit(true);
    }

    const financialPaths = [
      "/income-expense",
      "/balance-sheet",
      "/cash-flow",
      "/check-balance",
    ];

    if (financialPaths.includes(location.pathname)) {
      setOpenFinancials(true);
    }
  }, [location.pathname]);

  const menuItems = isMember
    ? [
        {
          name: t.dashboard,
          path: "/",
          icon: <FaTachometerAlt />,
        },
        {
          name: t.employees,
          path: "/employees",
          icon: <FaUsers />,
        },
        {
          name: t.loans,
          path: "/loans",
          icon: <FaHandHoldingUsd />,
        },
        {
          name: t.withdrawals,
          path: "/withdrawals",
          icon: <FaWallet />,
        },
        {
          name: t.reports,
          path: "/reports",
          icon: <FaChartBar />,
        },
      ]
    : [
        {
          name: t.dashboard,
          path: "/",
          icon: <FaTachometerAlt />,
        },
        {
          name: t.employees,
          path: "/employees",
          icon: <FaUsers />,
        },
        {
          name: t.deposits,
          path: "/deposits",
          icon: <FaPiggyBank />,
        },
        {
          name: t.loans,
          path: "/loans",
          icon: <FaHandHoldingUsd />,
        },
        {
          name: t.loanPayments,
          path: "/loan-payments",
          icon: <FaMoneyCheckAlt />,
        },
        {
          name: t.withdrawals,
          path: "/withdrawals",
          icon: <FaWallet />,
        },
        {
          name: t.reports,
          path: "/reports",
          icon: <FaChartBar />,
        },
      ];

  const currentPath = location.pathname;

  const handleNavigation = (path) => {
    navigate(path);

    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const getLinkStyle = (isActive = false, isExpanded = false) => ({
    ...styles.link,
    background: isActive
      ? "#ee2b09"
      : isExpanded
      ? "rgba(238, 43, 9, 0.1)"
      : "transparent",
  });

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen((current) => !current)}
          style={styles.mobileToggle}
        >
          {isMobileOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
        </button>
      )}

      <div
        style={{
          ...styles.sidebar,
          width: isMobile ? "260px" : isOpen ? "260px" : "80px",
          left: isMobile ? (isMobileOpen ? "0" : "-260px") : "0",
        }}
      >
        <div style={styles.header}>
          {(isOpen || isMobile) && (
            <h2 style={styles.logoText}>{t.logo}</h2>
          )}

          {!isMobile && (
            <button
              onClick={() => setIsSidebarOpen(!isOpen)}
              style={styles.toggleBtn}
            >
              {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
            </button>
          )}
        </div>

        <ul style={styles.menu}>
          {menuItems.map((item) => (
            <li key={item.path} style={styles.listItem}>
              <div
                onClick={() => handleNavigation(item.path)}
                style={getLinkStyle(currentPath === item.path)}
              >
                <span style={styles.icon}>{item.icon}</span>
                {(isOpen || isMobile) && <span>{item.name}</span>}
              </div>
            </li>
          ))}

          <li style={styles.listItem}>
            <div
              onClick={() => handleNavigation("/profile")}
              style={getLinkStyle(currentPath.startsWith("/profile"))}
            >
              <span style={styles.icon}>
                <FaUser />
              </span>

              {(isOpen || isMobile) && <span>{t.profile}</span>}
            </div>
          </li>

          <li style={styles.listItem}>
            <div
              onClick={() => setOpenProfit((current) => !current)}
              style={{
                ...getLinkStyle(false, openProfit),
                justifyContent: "space-between",
              }}
            >
              <div style={styles.menuLeft}>
                <span style={styles.icon}>
                  <FaChartLine />
                </span>

                {(isOpen || isMobile) && <span>{t.profitProduct}</span>}
              </div>

              {(isOpen || isMobile) &&
                (openProfit ? <FaCaretDown /> : <FaCaretRight />)}
            </div>

            {openProfit && (isOpen || isMobile) && (
              <ul style={styles.subMenu}>
                <li
                  onClick={() => handleNavigation("/dividend")}
                  style={getLinkStyle(currentPath === "/dividend")}
                >
                  <FaPercentage style={styles.icon} />
                  {t.dividend}
                </li>

                {!isMember && (
                  <li
                    onClick={() => handleNavigation("/profit")}
                    style={getLinkStyle(currentPath === "/profit")}
                  >
                    <FaChartLine style={styles.icon} />
                    {t.profit}
                  </li>
                )}
              </ul>
            )}
          </li>

          {!isMember && (
            <li style={styles.listItem}>
              <div
                onClick={() => setOpenFinancials((current) => !current)}
                style={{
                  ...getLinkStyle(false, openFinancials),
                  justifyContent: "space-between",
                }}
              >
                <div style={styles.menuLeft}>
                  <span style={styles.icon}>
                    <FaFileInvoiceDollar />
                  </span>

                  {(isOpen || isMobile) && (
                    <span>{t.financialReports}</span>
                  )}
                </div>

                {(isOpen || isMobile) &&
                  (openFinancials ? <FaCaretDown /> : <FaCaretRight />)}
              </div>

              {openFinancials && (isOpen || isMobile) && (
                <ul style={styles.subMenu}>
                  <li
                    onClick={() => handleNavigation("/income-expense")}
                    style={getLinkStyle(currentPath === "/income-expense")}
                  >
                    <FaExchangeAlt style={styles.icon} />
                    {t.incomeExpense}
                  </li>

                <li
  onClick={() => handleNavigation("/balance-sheet")}
  style={getLinkStyle(currentPath === "/balance-sheet")}
>
  <FaBalanceScale style={styles.icon} />
  {t.balanceSheet}
</li>

                  <li
                    onClick={() => handleNavigation("/cash-flow")}
                    style={getLinkStyle(currentPath === "/cash-flow")}
                  >
                    <FaWallet style={styles.icon} />
                    {t.cashFlow}
                  </li>

                  <li
                    onClick={() => handleNavigation("/check-balance")}
                    style={getLinkStyle(currentPath === "/check-balance")}
                  >
                    <FaFileAlt style={styles.icon} />
                    {t.checkBalance}
                  </li>
                </ul>
              )}
            </li>
          )}
        </ul>

        <div style={styles.footer}>
          <div
            onClick={() => handleNavigation("/help")}
            style={getLinkStyle(currentPath === "/help")}
          >
            <FaQuestionCircle style={styles.icon} />
            {(isOpen || isMobile) && t.help}
          </div>

          <div
            onClick={() => handleNavigation("/settings")}
            style={getLinkStyle(currentPath === "/settings")}
          >
            <FaCog style={styles.icon} />
            {(isOpen || isMobile) && t.settings}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  sidebar: {
    background: "rgb(29, 29, 70)",
    padding: "15px",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.3s ease, left 0.3s ease",
    height: "100vh",
    position: "fixed",
    top: 0,
    zIndex: 1005,
    overflowY: "auto",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "30px",
    padding: "0 10px",
    minHeight: "35px",
  },

  logoText: {
    fontSize: "18px",
    fontWeight: "bold",
    margin: 0,
    whiteSpace: "nowrap",
  },

  toggleBtn: {
    background: "#ffffff",
    border: "none",
    borderRadius: "50%",
    width: "25px",
    height: "25px",
    cursor: "pointer",
    color: "#ee2b09",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  mobileToggle: {
    position: "fixed",
    top: "12px",
    left: "15px",
    zIndex: 10000,
    background: "#02020c",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  menu: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    flexGrow: 1,
  },

  listItem: {
    marginBottom: "8px",
  },

  subMenu: {
    listStyle: "none",
    padding: 0,
    margin: "5px 0 0 10px",
  },

  link: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    transition: "all 0.2s ease",
    userSelect: "none",
    minHeight: "44px",
    boxSizing: "border-box",
    color: "#ffffff",
  },

  menuLeft: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    minWidth: 0,
  },

  icon: {
    fontSize: "20px",
    minWidth: "25px",
  },

  footer: {
    borderTop: "1px solid rgba(255,255,255,0.1)",
    paddingTop: "15px",
    marginTop: "auto",
  },
};