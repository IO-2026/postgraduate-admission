import { Link } from "react-router-dom";
import "./ProfilePage.css";

function ProfilePage({ user, onLogout }) {
  return (
    <section className="profile-view">
      <div className="profile-card">
        <header className="profile-header">
          <div className="profile-avatar">{user?.name?.charAt(0) || "U"}</div>
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
