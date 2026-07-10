import React, { useEffect, useState } from "react";
import {
  FaBullhorn,
  FaBookOpen,
  FaCog,
  FaRegSmile,
  FaShieldAlt,
  FaHeadset,
  FaClock,
  FaSearch,
  FaKeyboard,
  FaQuestionCircle,
  FaInfoCircle,
} from "react-icons/fa";

export default function HelpPage({ isSidebarOpen = true }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentLeftMargin = isMobile
    ? "0px"
    : isSidebarOpen
    ? "100px"
    : "65px";

  const dynamicContainerStyle = {
    ...styles.container,
    marginLeft: currentLeftMargin,
    width: isMobile ? "100%" : `calc(100% - ${currentLeftMargin})`,
  };

  const faqs = [
    {
      q: "ለምንድነው ውዝፍ የማይታየው?",
      a: "ብድሩ ከተወሰደ ገና 2 ወር ካልሞላው የዕፎይታ ጊዜ ስለሆነ ውዝፍ አይታይም።",
    },
    {
      q: "የወር ቁጠባዬን ከጨመርኩ ብድር ማግኘት እችላለሁ?",
      a: "አዎ፣ ሲስተሙ ብድር የሚፈቅደው በወቅታዊ የቁጠባ መጠንዎ 3 እጥፍ ስለሆነ ቁጠባዎ ሲጨምር የመበደር አቅምዎም ይጨምራል።",
    },
    {
      q: "የይለፍ ቃሌን (Password) ብረሳ ምን ማድረግ አለኝ?",
      a: "ወደ ሲስተም አስተዳዳሪው (Admin) በመሄድ ፓስዎርድዎ እንዲቀየር መጠየቅ ይችላሉ።",
    },
    {
      q: "ሪፖርት እንዴት ማውረድ እችላለሁ?",
      a: "ሪፖርት ገጽ ላይ በመግባት የፈለጉትን ወር እና አመት መርጠው Download PDF የሚለውን ቁልፍ ይጫኑ።",
    },
  ];

  const searchableText = `
    የብድር አጠቃቀም መመሪያ
    FAQ
    የደህንነት መመሪያ
    Quick Actions
    Technical Support
    Support Hours
    Dashboard Reports Settings
    Teklu Abebe Temitme
  `.toLowerCase();

  const showLoanGuide =
    !searchTerm ||
    "የብድር አጠቃቀም መመሪያ loan payment".includes(
      searchTerm.toLowerCase()
    );

  const showFaq =
    !searchTerm ||
    "faq ተደጋጋሚ ጥያቄ password report".includes(
      searchTerm.toLowerCase()
    );

  const showSecurity =
    !searchTerm ||
    "የደህንነት መመሪያ security password logout".includes(
      searchTerm.toLowerCase()
    );

  const showQuickActions =
    !searchTerm ||
    "quick actions dashboard reports settings".includes(
      searchTerm.toLowerCase()
    );

  const showSupport =
    !searchTerm ||
    "technical support admin teklu email phone".includes(
      searchTerm.toLowerCase()
    );

  const showHours =
    !searchTerm ||
    "support hours ሰኞ አርብ ቅዳሜ".includes(searchTerm.toLowerCase());

  const hasResults =
    showLoanGuide ||
    showFaq ||
    showSecurity ||
    showQuickActions ||
    showSupport ||
    showHours ||
    searchableText.includes(searchTerm.toLowerCase());

  return (
    <div className="help-page-container" style={dynamicContainerStyle}>
      {/* HERO SECTION */}
      <section className="help-hero">
        <div className="hero-shape hero-shape-one" />
        <div className="hero-shape hero-shape-two" />
        <div className="hero-star star-one">✦</div>
        <div className="hero-star star-two">✦</div>

        <div className="hero-content">
          <div className="hero-logo">
            <FaRegSmile />
            <span>Cooperative Help Center</span>
          </div>

          <h1>Help Center</h1>

          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* INTRO SECTION */}
      <section className="help-intro">
        <h2>Need help? We’ve got your back.</h2>
        <p>
          ስለ ብድር፣ ቁጠባ፣ ሪፖርት፣ ፓስዎርድ እና ቴክኒካል ድጋፍ
          የሚፈልጉትን መረጃ እዚህ ያግኙ።
        </p>
      </section>

      {/* HELP CARDS */}
      <section className="help-cards-section">
        {!hasResults ? (
          <div className="no-results">
            No help topics found for “{searchTerm}”.
          </div>
        ) : (
          <div className="help-grid">
            {/* LOAN GUIDE */}
            {showLoanGuide && (
              <div className="help-card">
                <div className="help-card-icon">
                  <FaBookOpen />
                </div>

                <h3>የብድር አጠቃቀም መመሪያ</h3>

                <ul className="card-list">
                  <li>ብድር ለመመዝገብ መጀመሪያ ሰራተኛ መምረጥ አለብዎት።</li>
                  <li>የድርሻ መጠን (%) በትክክል ያስገቡ።</li>
                  <li>
                    ብድሩ በገባ በ3ኛው ወር ክፍያ ይጀምራል
                    (2 ወር የዕፎይታ ጊዜ አለው)።
                  </li>
                  <li>
                    የመክፈያ ጊዜው ካለፈ ሲስተሙ በወር 50 ብር
                    ቅጣት በራሱ ያሰላል።
                  </li>
                </ul>
              </div>
            )}

            {/* FAQ */}
            {showFaq && (
              <div className="help-card faq-card">
                <div className="help-card-icon">
                  <FaInfoCircle />
                </div>

                <h3>FAQ (ተደጋጋሚ ጥያቄዎች)</h3>

                <div className="faq-scroll">
                  {faqs.map((item, index) => (
                    <div className="faq-item" key={index}>
                      <strong>ጥያቄ:</strong> {item.q}
                      <br />
                      <span>
                        <strong>መልስ:</strong> {item.a}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECURITY */}
            {showSecurity && (
              <div className="help-card">
                <div className="help-card-icon">
                  <FaShieldAlt />
                </div>

                <h3>የደህንነት መመሪያ</h3>

                <ul className="card-list">
                  <li>ስራዎን ሲጨርሱ ሁልጊዜ Logout ማድረጉን አይርሱ።</li>
                  <li>የይለፍ ቃልዎን (Password) ለማንም አያጋሩ።</li>
                  <li>
                    ሲስተሙ ላይ ችግር ካጋጠመዎት ራጅስትሪውን
                    ለመቀየር አይሞክሩ።
                  </li>
                </ul>
              </div>
            )}

            {/* QUICK ACTIONS */}
            {showQuickActions && (
              <div className="help-card">
                <div className="help-card-icon">
                  <FaKeyboard />
                </div>

                <h3>Quick Actions</h3>

                <p className="card-description">
                  ለፈጣን ስራ እነዚህን ይጠቀሙ፡
                </p>

                <ul className="card-list">
                  <li>
                    <strong>Dashboard:</strong> ዋናውን መረጃ ለማየት
                  </li>
                  <li>
                    <strong>Reports:</strong> የሪፖርት ፒዲኤፍ (PDF) ለማውረድ
                  </li>
                  <li>
                    <strong>Settings:</strong> ቅጣቶችን ለማስተካከል
                  </li>
                </ul>
              </div>
            )}

            {/* TECHNICAL SUPPORT */}
            {showSupport && (
              <div className="help-card">
                <div className="help-card-icon">
                  <FaHeadset />
                </div>

                <h3>Technical Support</h3>

                <div className="support-contact">
                  <p>
                    <strong>Admin:</strong> Teklu Abebe Temitme
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    <a href="mailto:tekluabebe0962@gmail.com">
                      tekluabebe0962@gmail.com
                    </a>
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    <a href="tel:+251905698140">+251905698140</a>
                  </p>
                </div>

                <div className="status-badge">System Status: Online</div>
              </div>
            )}

            {/* SUPPORT HOURS */}
            {showHours && (
              <div className="help-card">
                <div className="help-card-icon">
                  <FaClock />
                </div>

                <h3>Support Hours</h3>

                <ul className="card-list">
                  <li>
                    <strong>ሰኞ - አርብ:</strong> ከጠዋቱ 2:00 - 11:00
                  </li>
                  <li>
                    <strong>ቅዳሜ:</strong> ከጠዋቱ 2:00 - 6:00
                  </li>
                  <li>
                    <strong>እሁድ:</strong> ዝግ ነው
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .help-page-container {
          font-family: Arial, sans-serif;
          background: #ffffff;
          min-height: 100vh;
          overflow-x: hidden;
          transition: margin-left 0.3s ease, width 0.3s ease;
        }

        .help-hero {
          position: relative;
          min-height: 320px;
          overflow: hidden;
          background: linear-gradient(135deg, #5865f2 0%, #3f4be7 55%, #2f39c9 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 35px 20px;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          width: min(700px, 100%);
          text-align: center;
        }

        .hero-logo {
          position: absolute;
          top: -10px;
          left: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
        }

        .hero-logo svg {
          font-size: 22px;
        }

        .help-hero h1 {
          color: #ffffff;
          font-size: clamp(34px, 5vw, 54px);
          margin: 35px 0 28px;
          font-weight: 800;
        }

        .search-box {
          background: #ffffff;
          height: 58px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 0 20px;
          box-shadow: 0 10px 24px rgba(20, 30, 120, 0.22);
        }

        .search-box svg {
          color: #8d96aa;
          font-size: 19px;
        }

        .search-box input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 16px;
          color: #202225;
          background: transparent;
        }

        .hero-shape {
          position: absolute;
          opacity: 0.16;
          border-radius: 50%;
          background: #d9ddff;
        }

        .hero-shape-one {
          width: 420px;
          height: 420px;
          left: -120px;
          bottom: -290px;
        }

        .hero-shape-two {
          width: 500px;
          height: 500px;
          right: -170px;
          bottom: -350px;
        }

        .hero-star {
          position: absolute;
          color: #a8e6ff;
          font-size: 34px;
        }

        .star-one {
          top: 55px;
          left: 20%;
        }

        .star-two {
          top: 70px;
          right: 20%;
        }

        .help-intro {
          text-align: center;
          max-width: 780px;
          margin: 0 auto;
          padding: 48px 20px 34px;
        }

        .help-intro h2 {
          margin: 0 0 14px;
          color: #2f3545;
          font-size: clamp(25px, 3vw, 34px);
          font-weight: 800;
        }

        .help-intro p {
          margin: 0;
          color: #5c6478;
          line-height: 1.8;
          font-size: 15px;
        }

        .help-cards-section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 30px 55px;
        }

        .help-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }

        .help-card {
          min-height: 285px;
          background: #ffffff;
          border: 1px solid #edf0f7;
          border-radius: 12px;
          padding: 26px 22px;
          box-shadow: 0 5px 16px rgba(30, 40, 90, 0.08);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          display: flex;
          flex-direction: column;
        }

        .help-card:hover {
          transform: translateY(-7px);
          box-shadow: 0 14px 28px rgba(63, 75, 231, 0.18);
        }

        .help-card-icon {
          width: 54px;
          height: 54px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #eef0ff;
          color: #5865f2;
          font-size: 26px;
        }

        .help-card h3 {
          margin: 0 0 15px;
          color: #4a56e8;
          font-size: 18px;
          font-weight: 800;
        }

        .card-description {
          margin: 0 0 12px;
          color: #5d6577;
          font-size: 14px;
        }

        .card-list {
          margin: 0;
          padding-left: 20px;
          color: #4f5668;
          font-size: 14px;
          line-height: 1.9;
        }

        .faq-card {
          min-height: 285px;
        }

        .faq-scroll {
          overflow-y: auto;
          max-height: 195px;
          padding-right: 5px;
        }

        .faq-item {
          background: #f3f4ff;
          border-left: 4px solid #5865f2;
          border-radius: 10px;
          padding: 11px 12px;
          margin-bottom: 10px;
          color: #4f5668;
          font-size: 13px;
          line-height: 1.65;
        }

        .faq-item span {
          color: #5d6577;
        }

        .faq-item strong {
          color: #3f4be7;
        }

        .support-contact {
          color: #4f5668;
          font-size: 14px;
          line-height: 1.7;
        }

        .support-contact p {
          margin: 4px 0;
        }

        .support-contact a {
          color: #5865f2;
          font-weight: 700;
          text-decoration: underline;
          word-break: break-word;
        }

        .status-badge {
          margin-top: auto;
          align-self: flex-start;
          padding: 7px 14px;
          border-radius: 20px;
          background: #e7f6e9;
          color: #2e7d32;
          font-size: 12px;
          font-weight: 800;
        }

        .no-results {
          text-align: center;
          padding: 45px 20px;
          color: #687087;
          font-size: 16px;
          background: #f7f8ff;
          border-radius: 10px;
        }

        @media (max-width: 1024px) {
          .help-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .help-page-container {
            margin-left: 0 !important;
            width: 100% !important;
          }

          .help-hero {
            min-height: 290px;
            padding: 25px 18px;
          }

          .hero-logo {
            position: static;
            justify-content: center;
            margin-bottom: 20px;
          }

          .help-hero h1 {
            margin: 0 0 24px;
          }

          .help-cards-section {
            padding: 0 16px 40px;
          }

          .help-intro {
            padding: 35px 18px 28px;
          }
        }

        @media (max-width: 520px) {
          .help-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .help-card {
            min-height: auto;
          }

          .search-box {
            height: 52px;
            padding: 0 15px;
          }

          .search-box input {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#ffffff",
    minHeight: "100vh",
    padding: 0,
    boxSizing: "border-box",
  },
};