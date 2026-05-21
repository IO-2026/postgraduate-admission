import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { fetchInbox } from "../../services/messageApi";
import "./Navbar.css";

const INBOX_UNREAD_EVENT = "inbox-unread-count-updated";

function Navbar({ isLoggedIn, user, isAdmin, isCoordinator }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const isCandidate = isLoggedIn && !isAdmin && !isCoordinator;

  useEffect(() => {
    let isMounted = true;

    if (!isLoggedIn || !isCandidate) {
      return () => {
        isMounted = false;
      };
    }

    async function loadUnreadCount() {
      try {
        const messages = await fetchInbox();
        if (!isMounted) return;
        const unread = Array.isArray(messages)
          ? messages.filter((message) => !message.isRead).length
          : 0;
        setUnreadCount(unread);
      } catch (error) {
        if (isMounted) {
          setUnreadCount(0);
        }
        console.error("Failed to load unread messages count", error);
      }
    }

    loadUnreadCount();

    return () => {
      isMounted = false;
    };
  }, [isCandidate, isLoggedIn, location.pathname]);

  useEffect(() => {
    if (!isLoggedIn || !isCandidate) {
      return;
    }

    const handleUnreadCountUpdated = (event) => {
      const count = Number(event?.detail?.count);
      if (Number.isNaN(count) || count < 0) return;
      setUnreadCount(count);
    };

    window.addEventListener(INBOX_UNREAD_EVENT, handleUnreadCountUpdated);

    return () => {
      window.removeEventListener(INBOX_UNREAD_EVENT, handleUnreadCountUpdated);
    };
  }, [isCandidate, isLoggedIn]);

  if (!isLoggedIn) return null;

  const profileLabel =
    user?.name?.trim().split(/\s+/)[0] ||
    user?.fullName?.trim().split(/\s+/)[0] ||
    "Profil";

  const actions = isAdmin
    ? [
        {
          to: "/",
          label: "Strona główna",
          end: true,
        },
        {
          to: "/admin/courses/new",
          label: "Nowy kierunek",
        },
        { to: "/users", label: "Użytkownicy" },
        {
          to: "/send-message",
          label: "Wyślij wiadomość",
        },
        {
          to: "/sent-messages",
          label: "Wysłane wiadomości",
        },
      ]
    : isCoordinator
      ? [
          {
            to: "/",
            label: "Strona główna",
            end: true,
          },
          {
            to: "/send-message",
            label: "Wyślij wiadomość",
          },
          {
            to: "/sent-messages",
            label: "Wysłane wiadomości",
          },
        ]
      : [
          {
            to: "/",
            label: "Strona główna",
            end: true,
          },
          {
            to: "/messages",
            label: "Wiadomości",
            showUnreadCount: true,
          },
          { to: "/contact", label: "Formularz kontaktowy" },
        ];

  return (
    <nav className="main-navbar">
      <div className="navbar-logo">
        <Link to="/">AGH Rekrutacja</Link>
      </div>
      <div className="navbar-actions" aria-label="Szybkie akcje">
        {actions.map((action) => (
          <NavLink
            key={action.to}
            className={({ isActive }) =>
              `navbar-action${isActive ? " navbar-action--active" : ""}`
            }
            end={action.end}
            to={action.to}
          >
            {action.label}
            {action.showUnreadCount && unreadCount > 0 ? (
              <span className="unread-badge">{unreadCount}</span>
            ) : null}
          </NavLink>
        ))}
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
