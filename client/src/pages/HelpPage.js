import React, { useEffect, useState } from "react";
import { FaInfoCircle, FaQuestionCircle, FaHeadset, FaBook, FaKeyboard, FaShieldAlt, FaClock } from "react-icons/fa";

// 💡 ከ App.js ጋር አንድ አይነት እንዲሆን ፕሮፕስ ስሙን 'isSidebarOpen' አድርገነዋል
export default function HelpPage({ isSidebarOpen = true }) {
  // በስክሪን መጠን ለውጥ ላይ ተመስርቶ ገጹን Responsive ለማድረግ
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const faqs = [
    { q: "ለምንድነው ውዝፍ የማይታየው?", a: "ብድሩ ከተወሰደ ገና 2 ወር ካልሞላው የዕፎይታ ጊዜ ስለሆነ ውዝፍ አይታይም።" },
    { q: "የወር ቁጠባዬን ከጨመርኩ ብድር ማግኘት እችላለሁ?", a: "አዎ፣ ሲስተሙ ብድር የሚፈቅደው በወቅታዊ የቁጠባ መጠንዎ 3 እጥፍ ስለሆነ ቁጠባዎ ሲጨምር የመበደር አቅምዎም ይጨምራል።" },
    { q: "የይለፍ ቃሌን (Password) ብረሳ ምን ማድረግ አለኝ?", a: "ወደ ሲስተም አስተዳዳሪው (Admin) በመሄድ ፓስዎርድዎ እንዲቀየር መጠየቅ ይችላሉ።" },
    { q: "ሪፖርት እንዴት ማውረድ እችላለሁ?", a: "ሪፖርት ገጽ ላይ በመግባት የፈለጉትን ወር እና አመት መርጠው 'Download PDF' የሚለውን ቁልፍ ይጫኑ።" },
    { q: "በቅጣት ላይ ቅጣት ይታሰባል?", a: "አይ፣ ቅጣቱ የሚታሰበው ባመለጠው ወር መጠን እንጂ በቅጣቱ ላይ ተጨማሪ ወለድ አይታሰብም።" },
    { q: "የዋስትና ቁጠባ (Guarantor) ጥቅሙ ምንድነው?", a: "አንድ አባል ከቁጠባው በላይ መበደር ሲፈልግ፣ የጎደለውን የገንዘብ መጠን ሌሎች አባላት በቁጠባዎቻቸው ዋስ እንዲሆኑት ያገለግላል።" }
  ];

  // 🛠️ ማስተካከያ፦ ከሌሎቹ ማዕከላዊ ገጾች ጋር እኩል የሆነ የሳይድባር ማርጅን ሎጂክ
  const currentLeftMargin = isMobile ? "0px" : (isSidebarOpen ? "100px" : "65px");

  const dynamicContainerStyle = {
    ...styles.container,
    marginLeft: currentLeftMargin,
    width: isMobile ? "100%" : `calc(100% - ${currentLeftMargin})`,
  };

  return (
    <div className="help-page-container" style={dynamicContainerStyle}>
      <h1 style={styles.title}><FaQuestionCircle /> Help & Support Center</h1>
      
      <div className="help-grid" style={styles.grid}>
        {/* --- የብድር አጠቃቀም መመሪያ --- */}
        <div style={styles.card} className="help-card">
          <h3 style={styles.cardTitle}><FaBook /> የብድር አጠቃቀም መመሪያ</h3>
          <ul style={styles.list}>
            <li>ብድር ለመመዝገብ መጀመሪያ ሰራተኛ መምረጥ አለብዎት።</li>
            <li>### የድርሻ መጠን (%)</li>
            <li>ብድሩ በገባ በ 3ኛው ወር ክፍያ ይጀምራል (2 ወር የዕፎይታ ጊዜ አለው)።</li>
            <li>የመክፈያ ጊዜው ካለፈ ሲስተሙ በወር 50 ብር ቅጣት በራሱ ያሰላል።</li>
          </ul>
        </div>

        {/* --- FAQ (ተደጋጋሚ ጥያቄዎች) --- */}
        <div style={styles.card} className="help-card faq-card-height">
          <h3 style={styles.cardTitle}><FaInfoCircle /> FAQ (ተደጋጋሚ ጥያቄዎች)</h3>
          <div style={styles.faqScrollContainer}>
            {faqs.map((item, index) => (
              <div key={index} style={styles.faqItem}>
                <strong>ጥያቄ፡</strong> {item.q}<br/>
                <div style={{ marginTop: "4px", color: "#4a5568" }}>
                  <em style={{ fontWeight: "600", fontStyle: "normal", color: "#3f47d9" }}>መልስ፡</em> {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- የደህንነት መመሪያ --- */}
        <div style={styles.card} className="help-card">
          <h3 style={styles.cardTitle}><FaShieldAlt /> የደህንነት መመሪያ</h3>
          <ul style={styles.list}>
            <li>ስራዎን ሲጨርሱ ሁልጊዜ Logout ማድረጉን አይርሱ።</li>
            <li>የይለፍ ቃልዎን (Password) ለማንም አያጋሩ።</li>
            <li>ሲስተሙ ላይ ችግር ካጋጠመዎት ራጅስትሪውን ለመቀየር አይሞክሩ።</li>
          </ul>
        </div>

        {/* --- Quick Actions --- */}
        <div style={styles.card} className="help-card">
          <h3 style={styles.cardTitle}><FaKeyboard /> Quick Actions</h3>
          <p style={{fontSize: "13px", marginBottom: "10px", color: "#666"}}>ለፈጣን ስራ እነዚህን ይጠቀሙ፡</p>
          <ul style={styles.list}>
            <li><strong>Dashboard:</strong> ዋናውን መረጃ ለማየት</li>
            <li><strong>Reports:</strong> የሪፖርት ፒዲኤፍ (PDF) ለማውረድ</li>
            <li><strong>Settings:</strong> ቅጣቶችን ለማስተካከል</li>
          </ul>
        </div>

        {/* --- Technical Support --- */}
        <div style={styles.card} className="help-card">
          <h3 style={styles.cardTitle}><FaHeadset /> Technical Support</h3>
          <div style={{fontSize: "14px", color: "#444", marginBottom: "15px"}}>
            <p style={{margin: "6px 0"}}><strong>Admin:</strong> Teklu Abebe Temitme</p>
            <p style={{margin: "6px 0"}}><strong>Email:</strong> tekluabebe0962@gmail.com</p>
            <p style={{margin: "6px 0"}}><strong>Phone:</strong> +251905698140</p>
          </div>
          <div style={styles.statusBadge}>System Status: Online</div>
        </div>

        {/* --- Support Hours --- */}
        <div style={styles.card} className="help-card">
          <h3 style={styles.cardTitle}><FaClock /> Support Hours</h3>
          <ul style={styles.list}>
            <li><strong>ሰኞ - አርብ:</strong> ከጠዋቱ 2:00 - 11:00</li>
            <li><strong>ቅዳሜ:</strong> ከጠዋቱ 2:00 - 6:00</li>
            <li><strong>እሁድ:</strong> ዝግ ነው</li>
          </ul>
        </div>
      </div>

      <style>
        {`
          .help-card {
            transition: all 0.3s ease-in-out;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }
          .help-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 12px 24px rgba(63, 71, 217, 0.12) !important;
            border-bottom: 4px solid #3f47d9;
          }
          
          div::-webkit-scrollbar {
            width: 5px;
          }
          div::-webkit-scrollbar-thumb {
            background: #e2e8f0;
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #3f47d9;
          }

          /* --- ታብሌቶች እና መካከለኛ ስክሪኖች --- */
          @media (max-width: 1024px) {
            .help-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 20px !important;
            }
          }

          /* --- ለሞባይል ስልኮች የሚሆን ማስተካከያ --- */
          @media (max-width: 768px) {
            .help-page-container {
              padding: 15px !important;
              padding-top: 80px !important;
              margin-left: 0px !important;
              width: 100% !important;
            }
            .help-grid {
              grid-template-columns: 1fr !important;
              gap: 15px !important;
            }
            .help-card {
              height: auto !important;
              padding: 20px !important;
            }
            .faq-card-height {
              height: 350px !important;
            }
          }
        `}
      </style>
    </div>
  );
}

// =========================
// STYLES
// =========================
const styles = {
  // 💡 የጠፋውን የ container ስታይል ሙሉ በሙሉ ጨምረነዋል
  container: { 
    backgroundColor: "#f8f9fa", 
    minHeight: "100vh", 
    padding: "30px 20px 20px 20px",
    transition: "margin-left 0.3s ease, width 0.3s ease", 
    boxSizing: "border-box"
  },
  title: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "30px", color: "#3f47d9", fontSize: "24px", fontWeight: "700" },
  grid: { 
    display: "grid", 
    gridTemplateColumns: "repeat(3, 1fr)", 
    gap: "25px" 
  },
  card: { 
    background: "#fff", 
    padding: "25px", 
    borderRadius: "16px", 
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)", 
    border: "1px solid #f1f3f5",
    height: "280px", 
    overflow: "hidden",
    boxSizing: "border-box"
  },
  cardTitle: { display: "flex", alignItems: "center", gap: "10px", color: "#3f47d9", marginBottom: "15px", fontSize: "17px", fontWeight: "600" },
  list: { paddingLeft: "20px", lineHeight: "1.8", margin: 0, fontSize: "14px", color: "#4a5568" },
  
  faqScrollContainer: {
    overflowY: "auto",
    paddingRight: "5px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flex: 1
  },
  faqItem: { 
    padding: "12px", 
    background: "#f4f5ff", 
    borderRadius: "10px", 
    borderLeft: "4px solid #3f47d9", 
    fontSize: "13px",
    lineHeight: "1.6"
  },
  
  statusBadge: { 
    marginTop: "auto", 
    padding: "6px 14px", 
    background: "#e8f5e9", 
    color: "#2e7d32", 
    borderRadius: "20px", 
    fontSize: "12px", 
    fontWeight: "bold",
    display: "inline-block",
    alignSelf: "flex-start"
  }
};