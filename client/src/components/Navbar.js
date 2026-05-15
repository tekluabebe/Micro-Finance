import React from "react";

export default function Navbar() {
  return (
    <div
      style={{
        background: "#2c3e50",
        padding: "15px",
        fontSize: "24px",
        fontWeight: "bold",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        
      }}
    >
      <span style={styles.blink}>
        Microfinance Management System
      </span>

      <style>
        {`
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
        `}
      </style>
    </div>
  );
}

const styles = {
  blink: {
    animation: "glowBlink 2.5s infinite ease-in-out",
  },
};