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

          <Link className="primary-btn" to="/auth">
            Zaloguj się
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="home-view">
      <header className="home-header">
        <Link
          className="profile-corner-btn"
          to="/profile"
          aria-label="Otwórz profil"
        >
          <svg
            className="profile-corner-icon"
            viewBox="0 0 24 24"
            fill="none"
            role="presentation"
            aria-hidden="true"
          >
            <path
              d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.2 0-7 2.1-7 5v1h14v-1c0-2.9-2.8-5-7-5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
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
