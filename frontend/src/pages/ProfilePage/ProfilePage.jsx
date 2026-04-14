import { Link } from "react-router-dom";
import "./ProfilePage.css";

function ProfilePage({ onLogout }) {
  return (
    <section className="profile-view">
      <div className="profile-card">
        <h1>Profil</h1>
        <p className="profile-subtitle">
          Zarządzaj ustawieniami konta i wyloguj się z sesji rekrutacyjnej.
        </p>

        <div className="profile-actions">
          <Link className="primary-btn" to="/">
            Wróć do strony głównej
          </Link>
          <button type="button" className="ghost-btn" onClick={onLogout}>
            Wyloguj się
          </button>
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
