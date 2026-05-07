import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar({ isLoggedIn, user }) {
  if (!isLoggedIn) return null;

  const profileLabel =
    user?.name?.trim().split(/\s+/)[0] ||
    user?.fullName?.trim().split(/\s+/)[0] ||
    "Profil";

  return (
    <nav className="main-navbar">
      <div className="navbar-logo">
        <Link to="/">AGH Rekrutacja</Link>
      </div>
      <div className="navbar-profile">
        <Link to="/profile" className="profile-link">
          <span>{profileLabel}</span>
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
