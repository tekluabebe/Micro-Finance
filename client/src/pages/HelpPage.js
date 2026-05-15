import React from "react";
import { FaInfoCircle, FaQuestionCircle, FaHeadset, FaBook, FaKeyboard, FaShieldAlt, FaClock } from "react-icons/fa";

export default function HelpPage() {
  const faqs = [
    { q: "ለምንድነው ውዝፍ የማይታየው?", a: "ብድሩ ከተወሰደ ገና 2 ወር ካልሞላው የዕፎይታ ጊዜ ስለሆነ ውዝፍ አይታይም።" },
    { q: "የወር ቁጠባዬን ከጨመርኩ ብድር ማግኘት እችላለሁ?", a: "አዎ፣ ሲስተሙ ብድር የሚፈቅደው በወቅታዊ የቁጠባ መጠንዎ 3 እጥፍ ስለሆነ ቁጠባዎ ሲጨምር የመበደር አቅምዎም ይጨምራል።" },
    { q: "የይለፍ ቃሌን (Password) ብረሳ ምን ማድረግ አለብኝ?", a: "ወደ ሲስተም አስተዳዳሪው (Admin) በመሄድ ፓስዎርድዎ እንዲቀየር መጠየቅ ይችላሉ።" },
    { q: "ሪፖርት እንዴት ማውረድ እችላለሁ?", a: "ሪፖርት ገጽ ላይ በመግባት የፈለጉትን ወር እና አመት መርጠው 'Download PDF' የሚለውን ቁልፍ ይጫኑ።" },
    { q: "በቅጣት ላይ ቅጣት ይታሰባል?", a: "አይ፣ ቅጣቱ የሚታሰበው ባመለጠው ወር መጠን እንጂ በቅጣቱ ላይ ተጨማሪ ወለድ አይታሰብም።" },
    { q: "የዋስትና ቁጠባ (Guarantor) ጥቅሙ ምንድነው?", a: "አንድ አባል ከቁጠባው በላይ መበደር ሲፈልግ፣ የጎደለውን የገንዘብ መጠን ሌሎች አባላት በቁጠባዎቻቸው ዋስ እንዲሆኑት ያገለግላል።" }
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}><FaQuestionCircle /> Help & Support Center</h1>
      
      <div style={styles.grid}>
        {/* --- የብድር አጠቃቀም መመሪያ --- */}
        <div style={styles.card} className="help-card">
          <h3 style={styles.cardTitle}><FaBook /> የብድር አጠቃቀም መመሪያ</h3>
          <ul style={styles.list}>
            <li>ብድር ለመመዝገብ መጀመሪያ ሰራተኛ መምረጥ አለብዎት።</li>
            <li>ብድሩ በገባ በ 3ኛው ወር ክፍያ ይጀምራል (2 ወር የዕፎይታ ጊዜ አለው)።</li>
            <li>የመክፈያ ጊዜው ካለፈ ሲስተሙ በወር 50 ብር ቅጣት በራሱ ያሰላል።</li>
          </ul>
        </div>

        {/* --- FAQ (ተደጋጋሚ ጥያቄዎች) - በካርዱ ውስጥ Scroll የሚሆን --- */}
        <div style={styles.card} className="help-card">
          <h3 style={styles.cardTitle}><FaInfoCircle /> FAQ (ተደጋጋሚ ጥያቄዎች)</h3>
          <div style={styles.faqScrollContainer}>
            {faqs.map((item, index) => (
              <div key={index} style={styles.faqItem}>
                <strong>ጥያቄ፡</strong> {item.q}<br/>
                <em style={{color: "#555"}}>መልስ፡</em> {item.a}
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
          <p style={{fontSize: "13px", marginBottom: "10px"}}>ለፈጣን ስራ እነዚህን ይጠቀሙ፡</p>
          <ul style={styles.list}>
            <li><strong>Dashboard:</strong> ዋናውን መረጃ ለማየት</li>
            <li><strong>Reports:</strong> የሪፖርት ፒዲኤፍ (PDF) ለማውረድ</li>
            <li><strong>Settings:</strong> ቅጣቶችን ለማስተካከል</li>
          </ul>
        </div>

        {/* --- Technical Support --- */}
        <div style={styles.card} className="help-card">
          <h3 style={styles.cardTitle}><FaHeadset /> Technical Support</h3>
          <div style={{fontSize: "14px", color: "#444"}}>
            <p><strong>Admin:</strong> Teklu Abebe Temitme</p>
            <p><strong>Email:</strong> tekluabebe0962@gmail.com</p>
            <p><strong>Phone:</strong> +251905698140</p>
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
            transform: translateY(-8px);
            box-shadow: 0 12px 24px rgba(63, 71, 217, 0.15) !important;
            border-bottom: 4px solid #3f47d9;
          }
          /* Scrollbar ን ውብ ለማድረግ */
          div::-webkit-scrollbar {
            width: 5px;
          }
          div::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #3f47d9;
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  container: { padding: "30px", backgroundColor: "#f8f9fa", minHeight: "100vh" },
  title: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "35px", color: "#3f47d9", fontSize: "24px" },
  grid: { 
    display: "grid", 
    gridTemplateColumns: "repeat(3, 1fr)", 
    gap: "25px" 
  },
  card: { 
    background: "#fff", 
    padding: "25px", 
    borderRadius: "16px", 
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)", 
    border: "1px solid #eee",
    height: "300px", // ሁሉም ካርዶች እኩል ቁመት እንዲኖራቸው
    overflow: "hidden"
  },
  cardTitle: { display: "flex", alignItems: "center", gap: "10px", color: "#3f47d9", marginBottom: "15px", fontSize: "18px", fontWeight: "600" },
  list: { paddingLeft: "20px", lineHeight: "1.8", margin: 0, fontSize: "14px", color: "#444" },
  
  // FAQ Scroll ሎጂክ
  faqScrollContainer: {
    overflowY: "auto",
    paddingRight: "5px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  faqItem: { 
    padding: "12px", 
    background: "#f0f2ff", 
    borderRadius: "10px", 
    borderLeft: "4px solid #3f47d9", 
    fontSize: "13px",
    lineHeight: "1.5"
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