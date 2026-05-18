import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaCog, FaUserShield, FaPercentage, FaPalette, FaInfoCircle, 
  FaHistory, FaGlobe, FaCode, FaSignOutAlt, FaMoon, FaSun 
} from "react-icons/fa";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("Amharic");
  const [darkMode, setDarkMode] = useState(false);
  const [penalty, setPenalty] = useState(50);

  const texts = {
    Amharic: {
      title: "የሲስተም ቅንብሮች",
      finance: "የፋይናንስ ቅንብሮች",
      penaltyLabel: "የወር ውዝፍ ቅጣት (ብር)",
      penaltyHint: "* ይህ ዋጋ በወር የሚታሰብ የውዝፍ ቅጣትን ይወክላል።",
      appearance: "የገጽታ ቅንብሮች",
      darkMode: "የጨለማ ገጽታ (Dark Mode)",
      langLabel: "ቋንቋ ይምረጡ",
      security: "ደህንነት",
      changePass: "የአድሚን ፓስዎርድ ቀይር",
      logout: "ከሲስተሙ ውጣ",
      about: "ስለ እኛ እና ስለ ሲስተሙ",
      mission: "ተልዕኳችን",
      missionText: "ለአነስተኛ እና ጥቃቅን ማህበራት ቀልጣፋ የፋይናንስ አስተዳደር ሲስተም ማቅረብ።",
      version: "የሲስተም ስሪት",
      devInfo: "የአልሚው መረጃ",
      developer: "ተክሉ አበበ",
      pro: "የሶፍትዌር እና አይቲ ባለሙያ"
    },
    English: {
      title: "System Settings",
      finance: "Finance Settings",
      penaltyLabel: "Monthly Late Penalty (ETB)",
      penaltyHint: "* This value determines the monthly late penalty.",
      appearance: "Appearance Settings",
      darkMode: "Dark Mode",
      langLabel: "Select Language",
      security: "Security",
      changePass: "Change Admin Password",
      logout: "Logout System",
      about: "About Us & System Info",
      mission: "Our Mission",
      missionText: "Providing efficient financial management systems for micro-finance associations.",
      version: "System Version",
      devInfo: "Developer Info",
      developer: "Teklu Abebe",
      pro: "Full-stack IT Specialist"
    },
    Oromiffa: {
      title: "Sajoo Sirnaa",
      finance: "Sajoo Faayinaansii",
      penaltyLabel: "Adabbii Turtee Ji'aa (ETB)",
      penaltyHint: "* Gatiin kun adabbii turtee ji'aan herregamu bakka bu'a.",
      appearance: "Sajoo Bifa Sirnaa",
      darkMode: "Haala Dukkanaa (Dark Mode)",
      langLabel: "Affaan Filadhu",
      security: "Nageenya",
      changePass: "Jecha Darbii Jijjiiri",
      logout: "Sirna gadi lakkisi",
      about: "Waa'ee Keenya",
      mission: "Ergama Keenya",
      missionText: "Waldaalee xixiqqoodhaaf sirna bulchiinsa faayinaansii si'aawaa dhiyeessuu.",
      version: "Maxxansa Sirnaa",
      devInfo: "Oduu Omishitootaa",
      developer: "Teklu Abebe",
      pro: "Ogeessa Sooftiweerii fi IT"
    },
    Tigrigna: {
      title: "ቅንብራት ስርዓት",
      finance: "ቅንብራት ፋይናንስ",
      penaltyLabel: "ቅጽዓት ወርሓዊ ውዝፍ (ብር)",
      penaltyHint: "* እዚ ዋጋ እዚ ወርሓዊ ዝሕሰብ ናይ ውዝፍ ቅጽዓት እዩ።",
      appearance: "ቅንብራት መልክዕ",
      darkMode: "ጸሊም መልክዕ (Dark Mode)",
      langLabel: "ቋንቋ ምረጽ",
      security: "ደህንነት",
      changePass: "ፓስዎርድ ቀይር",
      logout: "ካብ ስርዓት ውጻእ",
      about: "ብዛዕባናን ስርዓትን",
      mission: "ዕላማና",
      missionText: "ንናእሽቱን ማእከለዎትን ማሕበራት ስሉጥ ዝኾነ ናይ ፋይናንስ ምሕደራ ስርዓት ምቕራብ።",
      version: "ሕታም ስርዓት",
      devInfo: "ሓበሬታ ኣማዕባሊ",
      developer: "ተክሉ አበበ",
      pro: "ኪኢላ ሶፍትዌርን አይቲን"
    }
  };

  const t = texts[language];

 const handleLogout = () => {
  localStorage.clear(); // ሁሉንም በአንዴ ያጠፋል (ቀላል ነው)
  window.dispatchEvent(new Event("storage"));
  window.location.href = "/login";
};

  const currentContainerStyle = {
    ...styles.container,
    backgroundColor: darkMode ? "#101827" : "#f4f7fe",
    color: darkMode ? "#ffffff" : "#2c3e50",
  };

  return (
    <div style={currentContainerStyle}>
      <h1 style={{...styles.title, color: darkMode ? "#6366f1" : "#3f47d9"}}>
        <FaCog /> {t.title}
      </h1>

      <div style={styles.grid}>
        {/* Finance Settings */}
        <div style={{...styles.section, backgroundColor: darkMode ? "#1f2937" : "#fff"}} className="settings-card">
          <h3 style={styles.sectionTitle}><FaPercentage /> {t.finance}</h3>
          <div style={styles.inputGroup}>
            <label style={styles.label}>{t.penaltyLabel}</label>
            <input 
              type="number" 
              value={penalty} 
              onChange={(e) => setPenalty(e.target.value)} 
              style={{...styles.input, backgroundColor: darkMode ? "#374151" : "#fff", color: darkMode ? "#fff" : "#000"}}
            />
          </div>
          <p style={styles.hint}>{t.penaltyHint}</p>
        </div>

        {/* Appearance Settings */}
        <div style={{...styles.section, backgroundColor: darkMode ? "#1f2937" : "#fff"}} className="settings-card">
          <h3 style={styles.sectionTitle}><FaPalette /> {t.appearance}</h3>
          <div style={styles.toggleRow}>
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {darkMode ? <FaMoon color="#facc15" /> : <FaSun color="#f59e0b" />} {t.darkMode}
            </span>
            <input 
              type="checkbox" 
              checked={darkMode} 
              onChange={() => setDarkMode(!darkMode)} 
              className="mode-checkbox"
            />
          </div>
          <div style={styles.toggleRow}>
            <span><FaGlobe /> {t.langLabel}</span>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)} 
              style={{...styles.select, backgroundColor: darkMode ? "#374151" : "#fff", color: darkMode ? "#fff" : "#000"}}
            >
              <option value="Amharic">አማርኛ</option>
              <option value="English">English</option>
              <option value="Oromiffa">Afaan Oromoo</option>
              <option value="Tigrigna">ትግርኛ</option>
            </select>
          </div>
        </div>

        {/* Security Settings */}
        <div style={{...styles.section, backgroundColor: darkMode ? "#1f2937" : "#fff"}} className="settings-card">
          <h3 style={styles.sectionTitle}><FaUserShield /> {t.security}</h3>
          <button style={styles.btnSecondary}>{t.changePass}</button>
          <button onClick={handleLogout} style={styles.btnLogout}>
            <FaSignOutAlt /> {t.logout}
          </button>
        </div>

        {/* About Us Section */}
        <div style={{...styles.section, gridColumn: "1 / -1", backgroundColor: darkMode ? "#1f2937" : "#fff"}} className="settings-card">
          <h3 style={styles.sectionTitle}><FaInfoCircle /> {t.about}</h3>
          <div style={styles.aboutGrid}>
            <div style={{...styles.aboutItem, backgroundColor: darkMode ? "#111827" : "#f9fbff"}}>
              <h4><FaGlobe /> {t.mission}</h4>
              <p>{t.missionText}</p>
            </div>
            <div style={{...styles.aboutItem, backgroundColor: darkMode ? "#111827" : "#f9fbff"}}>
              <h4><FaHistory /> {t.version}</h4>
              <p>v1.0.4 (Stable Build)</p>
              <p>Updated: May 2026</p>
            </div>
            <div style={{...styles.aboutItem, backgroundColor: darkMode ? "#111827" : "#f9fbff"}}>
              <h4><FaCode /> {t.devInfo}</h4>
              <p><strong>{t.developer}</strong></p>
              <p>{t.pro}</p>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          .settings-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid transparent;
            cursor: pointer;
          }
          .settings-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
            border-left: 5px solid #3f47d9;
          }
          .mode-checkbox {
            width: 40px;
            height: 20px;
            accent-color: #3f47d9;
            cursor: pointer;
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  container: { padding: "30px", transition: "background 0.3s ease", minHeight: "100vh" },
  title: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "30px", fontSize: "28px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "25px" },
  section: { padding: "25px", borderRadius: "18px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
  sectionTitle: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderBottom: "1px solid rgba(128,128,128,0.1)", paddingBottom: "10px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "10px" },
  label: { fontSize: "14px", fontWeight: "600" },
  input: { padding: "12px", borderRadius: "10px", border: "1.5px solid rgba(128,128,128,0.2)", fontSize: "16px", outline: "none" },
  hint: { fontSize: "11px", color: "#888", marginTop: "8px" },
  toggleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(128,128,128,0.05)" },
  select: { padding: "8px", borderRadius: "8px", border: "1px solid rgba(128,128,128,0.2)", cursor: "pointer" },
  btnSecondary: { width: "100%", padding: "12px", background: "#3f47d9", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", marginBottom: "12px" },
  btnLogout: { width: "100%", padding: "12px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  aboutGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "15px" },
  aboutItem: { padding: "15px", borderRadius: "12px", border: "1px solid rgba(128,128,128,0.1)" }
};
