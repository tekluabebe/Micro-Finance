import axios from "axios";

// Render ላይ deploy ሲሆን የሚሰጥህን URL እዚህ ጋር ትተካዋለህ
const API = axios.create({
  baseURL: process.env.NODE_ENV === "production" 
    ? "https://micro-finance-90cq.onrender.com/api" // Render ላይ የሚሰጥህ URL
    : "http://localhost:5000/api"                // ለኮምፒውተርህ (Local)
});

export default API;