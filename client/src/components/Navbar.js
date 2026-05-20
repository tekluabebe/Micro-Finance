import React from "react";

export default function Navbar() {
  return (
    <div style={styles.navbarContainer}>
      {/* ክላስ ኔሙን እዚህ ላይ ጨምረነዋል ስለዚህ የሚዲያ ኩዌሪው አሁን በትክክል ይሰራል */}
      <span className="navbar-text" style={styles.blink}>
        Microfinance Management System
      </span>

      <style>
        {`
          /* የብርሃን ብልጭታ አኒሜሽን (Glow Animation) */
          @keyframes glowBlink {
            0% {
              color: #ffffff;
              opacity: 1;
              text-shadow: 0 0 5px #fff, 0 0 10px #fff;
            }
            25% {
              color: #00ffcc;
              opacity: 0.8;
              text-shadow: 0 0 8px #00ffcc, 0 0 15px #00ffcc;
            }
            50% {
              color: #00ff00;
              opacity: 0.6;
              text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00;
            }
            75% {
              color: #ff4d4d;
              opacity: 0.8;
              text-shadow: 0 0 8px #ff4d4d, 0 0 15px #ff4d4d;
            }
            100% {
              color: #ffffff;
              opacity: 1;
              text-shadow: 0 0 5px #fff, 0 0 10px #fff;
            }
          }

          /* ለሞባይል ስልኮች የሚሆን ማስተካከያ (Responsive Media Query) */
          @media (max-width: 768px) {
            .navbar-text {
              font-size: 16px !important; /* በስልክ ላይ የጽሁፉ መጠን እንዲያንስ */
              text-align: center;
              /* በስልክ በግራ በኩል የሚመጣውን የሀምበርገር በተን ቦታ ላለመግፋት */
              padding-left: 45px !important; 
              padding-right: 15px !important;
            }
          }
          @media (max-width: 480px) {
            .navbar-text {
              font-size: 14px !important; /* በጣም አነስተኛ ስልኮች ላይ ይበልጥ እንዲያንስ */
            }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  navbarContainer: {
    background: "#2c3e50",
    padding: "15px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    boxSizing: "border-box",
    
    // ናቭባሩን ሁልጊዜ ከላይ ለመቆለፍ (Fixed ለማድረግ) የተጨመሩ ስታይሎች
    position: "fixed",
    top: 0,
    left: 0,
    height: "55px", // የናቭባሩ ቋሚ ቁመት
    zIndex: 998,   // ከገጹ ይዘቶች (Dashboard) በላይ እንዲንሳፈፍ፣ ከSidebar (9999) በታች እንዲሆን
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)", // ይበልጥ ውብ እንዲሆን ቀጭን ጥላ
  },
  blink: {
    fontSize: "24px", 
    fontWeight: "bold",
    animation: "glowBlink 2.5s infinite ease-in-out",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
};