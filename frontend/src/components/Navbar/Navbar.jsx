import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar({ isLoggedIn, user }) {
  const location = useLocation();

  const roleId =
    user?.roleId ??
    (typeof user?.role === "number" ? user.role : (user?.role?.id ?? null));
  const isAdmin =
    roleId === 2 ||
    (typeof user?.role === "string" &&
      user.role.toLowerCase().includes("admin"));

  if (!isLoggedIn) return null;

  return (
    <nav className="main-navbar">
      <div className="navbar-logo">
        <Link to="/">AGH Rekrutacja</Link>
      </div>
      <div className="navbar-links">
        <Link to="/" className={location.pathname === "/" ? "active" : ""}>
          Start
        </Link>
        <Link
          to="/courses"
          className={location.pathname === "/courses" ? "active" : ""}
        >
          Kierunki
        </Link>
        <Link
          to="/admission"
          className={location.pathname === "/admission" ? "active" : ""}
        >
          Wiadomości
        </Link>

        {isAdmin && (
          <div className="admin-menu">
            <span className="admin-menu-label">Panel Admina</span>
            <div className="admin-dropdown">
              <Link to="/users">Zarządzanie użytkownikami</Link>
              <Link to="/coordinators">Koordynatorzy</Link>
              <Link to="/assign-coordinators">Przydziel koordynatorów</Link>
            </div>
          </div>
        )}
      </div>
      <div className="navbar-profile">
        <Link to="/profile" className="profile-link">
          <span>{user?.name || "Profil"}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
