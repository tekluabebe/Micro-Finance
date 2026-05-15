import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import API from "../services/api";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function MonthlySavingsChart() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const res = await API.get("/dashboard/monthly-savings");

        console.log("CHART DATA:", res.data);

        setChartData(res.data);
      } catch (err) {
        console.error("Chart error:", err);
      }
    };

    fetchChart();
  }, []);

  const data = {
    labels: chartData.map((d) => d.month),
    datasets: [
      {
        label: "Monthly Savings (Birr)",
        data: chartData.map((d) => d.total),
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  return (
    <div style={{ width: "80%", margin: "40px auto" }}>
      <h3 style={{ textAlign: "center" }}>Monthly Savings Trend</h3>
      <Line data={data} />
    </div>
  );
}