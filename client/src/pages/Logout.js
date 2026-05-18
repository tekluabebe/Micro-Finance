import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // clear auth data
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");

    // redirect immediately
    navigate("/login");
  }, [navigate]);

  return <h2>Logging out...</h2>;
}