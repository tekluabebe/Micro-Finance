import axios from "axios";

const API = axios.create({
  // እዚህ ጋር ያንተን የ Render Backend URL መተካት አለብህ
  baseURL: "https://micro-finance-backend.onrender.com/api", 
});

export default API;