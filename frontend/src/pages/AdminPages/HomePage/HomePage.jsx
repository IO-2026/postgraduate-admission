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
            <Link key={action.to} className="primary-btn" to={action.to}>
              {action.label}
            </Link>
          ))}
          <Link className="ghost-link" to="/send-message">
            Wyślij wiadomość
          </Link>
        </div>
      </header>
    </section>
  );
}

export default AdminHomePage;
