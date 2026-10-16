import React from "react";
import { useAppContext } from "../pages/context";

export default function Navbar() {
  const { language } = useAppContext();
  const title = {
    English: "Microfinance Management System",
    Amharic: "የማይክሮፋይናንስ አስተዳደር ስርዓት",
    Oromiffa: "Sirna Bulchiinsa Maayikiroo Faayinaansii",
    Tigrigna: "ስርዓት ምምሕዳር ማይክሮ ፋይናንስ",
  }[language] || "Microfinance Management System";

  return (
    <div style={styles.navbarContainer}>
      {/* 💡 ሚዲያ ኳሪው እንዲያገኘው className="navbar-text" ጨምረናል */}
      <span style={styles.blink} className="navbar-text">
        {title}
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
              padding: 0 10px;
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
    background: "#202923",
    padding: "15px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    boxSizing: "border-box",
    
    position: "fixed",  
    top: 0,             
    left: 0,            
    zIndex: 1000,       // 💡 ከሳይድባሩ (1005) በታች እንዲሆን 1000 አደረግነው
    height: "60px",     
  },
  blink: {
    fontSize: "24px", 
    fontWeight: "bold",
    color: "#e8f2ec",
    textShadow: "none",
  },
};