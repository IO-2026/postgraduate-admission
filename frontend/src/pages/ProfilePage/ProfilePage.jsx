import { Link } from "react-router-dom";
import "./ProfilePage.css";

function ProfilePage({ user, onLogout }) {
  const initials = [user?.name, user?.surname]
    .filter(Boolean)
    .map((part) => String(part).trim()[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarLabel = initials || "U";

  return (
    <section className="profile-view">
      <div className="profile-top-actions">
        <Link className="ghost-link profile-back-link" to="/">
          <svg
            className="profile-back-icon"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Wróć do strony głównej
        </Link>
      </div>
      <div className="profile-card">
        <header className="profile-header">
          <div className="profile-avatar">{avatarLabel}</div>
          <div className="profile-title">
            <h1>
              {user?.name} {user?.surname}
            </h1>
            <span className="profile-role-tag">{user?.role}</span>
          </div>
        </header>

        <div className="profile-info">
          <div className="info-group">
            <label>Adres e-mail</label>
            <p>{user?.email}</p>
          </div>
          <div className="info-group">
            <label>Numer telefonu</label>
            <p>{user?.telNumber || "Nie podano"}</p>
          </div>
          <div className="info-group">
            <label>Identyfikator użytkownika</label>
            <p>#{user?.id}</p>
          </div>
        </div>

          <div className="profile-actions">
          <button type="button" className="ghost-btn" onClick={onLogout}>
            Wyloguj się
          </button>
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
