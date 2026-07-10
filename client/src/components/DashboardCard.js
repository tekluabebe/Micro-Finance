import "./Dashboard.css";

export default function DashboardCard({
  title,
  value,
  icon
}) {
  return (
    <div className="dashboard-card">

      <div className="card-icon">
        {icon}
      </div>

      <div>
        <p className="card-title">
          {title}
        </p>

        <h2 className="card-value">
          {value}
        </h2>
      </div>

    </div>
  );
}