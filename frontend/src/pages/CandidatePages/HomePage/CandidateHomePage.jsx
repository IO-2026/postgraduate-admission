import { Link } from "react-router-dom";
import "./CandidateHomePage.css";

function CandidateHomePage({ isLoggedIn }) {
  const applications = [];

  if (!isLoggedIn) {
    return (
      <section className="gate-view" aria-label="Brama dostępu dla gościa">
        <div className="guest-panel">
          <p className="guest-tag">Studia podyplomowe AGH</p>
          <h1>Witamy w portalu rekrutacji</h1>
          <p className="guest-subtitle">
            Zaloguj się, aby zarządzać aplikacjami, sprawdzać status dokumentów
            i otrzymywać najważniejsze komunikaty.
          </p>

          <div style={{ display: "flex", gap: "1rem" }}>
            <Link className="primary-btn" to="/auth">
              Zaloguj się
            </Link>
            <Link
              className="secondary-btn"
              to="/courses"
              style={{
                padding: "0.8rem 1.5rem",
                borderRadius: "8px",
                textDecoration: "none",
                color: "var(--text-dark)",
                border: "1px solid var(--border)",
                background: "white",
              }}
            >
              Oferta studiów
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="home-view">
      <header className="home-header">
        <p className="home-tag">Studia podyplomowe AGH</p>
        <h1>Strona główna</h1>
        <p className="home-subtitle">
          Jesteś zalogowany. W tym miejscu możesz sprawdzić status rekrutacji,
          przesyłać wymagane dokumenty i śledzić terminy.
        </p>
        <div className="home-actions">
          <Link className="primary-btn" to="/admission">
            Zapisz się na studia
          </Link>
          <Link className="ghost-link" to="/courses">
            Kierunki studiów
          </Link>
          <Link className="ghost-link" to="/messages">
            Wiadomości
          </Link>
        </div>
      </header>

      <section className="applications-section">
        <div className="applications-header">
          <h2>Bieżące aplikacje</h2>
          <span className="applications-count">{applications.length}</span>
        </div>

        <ul className="applications-list" aria-label="Bieżące aplikacje"></ul>

        {applications.length === 0 ? (
          <p className="applications-empty">Brak bieżących aplikacji.</p>
        ) : null}
      </section>
    </section>
  );
}

export default CandidateHomePage;
