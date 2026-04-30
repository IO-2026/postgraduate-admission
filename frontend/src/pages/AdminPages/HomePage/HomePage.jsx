import { Link } from "react-router-dom";
import "./HomePage.css";

function AdminHomePage() {
  const quickActions = [
    { label: "Kierunki studiów", to: "/admin/courses" },
    { label: "Użytkownicy", to: "/users" },
  ];

  return (
    <section className="admin-home-view" aria-label="Panel administratora">
      <header className="admin-home-header">
        <p className="admin-home-tag">Studia podyplomowe AGH</p>
        <h1>Panel administratora</h1>
        <p className="admin-home-subtitle">
          Zarządzaj użytkownikami i ofertą studiów.
        </p>
        <div className="admin-home-actions">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              className="primary-btn"
              to={action.to}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </header>

      <section className="admin-tools-section">
        <div className="admin-tools-header">
          <h2>Narzędzia administracyjne</h2>
          <span className="admin-tools-count">{quickActions.length}</span>
        </div>
        <p className="admin-tools-empty">
          Wybierz jedną z akcji powyżej, aby rozpocząć zarządzanie systemem.
        </p>
      </section>
    </section>
  );
}

export default AdminHomePage;
