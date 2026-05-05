import {Link} from "react-router-dom";
import "./Navbar.css";
import {useEffect, useState} from "react";
import {fetchUnreadCount} from "../../services/messageApi.js";

function Navbar({isLoggedIn, user}) {
    const [unreadCount, setUnreadCount] = useState(0);

    const isAdmin = isLoggedIn && (
        user?.role === "Admin" ||
        user?.roleId === 2 ||
        (typeof user?.role === "string" && user.role.toLowerCase().includes("admin"))
    );

    const isCoordinator = isLoggedIn && user?.role === "Coordinator";
    const canSendMessage = isAdmin || isCoordinator;

    useEffect(() => {
        if (!isLoggedIn) return;
        const loadUnread = async () => {
            try {
                const count = await fetchUnreadCount();
                setUnreadCount(count);
            } catch (err) {
                console.error("Failed to fetch unread count", err);
            }
        };
        loadUnread();
        const interval = setInterval(loadUnread, 60000);
        return () => clearInterval(interval);
    }, [isLoggedIn]);

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
            <div className="navbar-links">
                {!isAdmin && !isCoordinator && (
                    <>
                        <Link to="/courses">Kierunki</Link>
                        <Link to="/messages" className="nav-link">
                            Wiadomości
                            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                        </Link>
                    </>
                )}

                {isAdmin && (
                    <>
                        <Link to="/admin/courses" className="nav-link">Kierunki</Link>
                        <Link to="/users" className="nav-link">Użytkownicy</Link>
                    </>
                )}

                {canSendMessage && (
                    <Link to="/send-message" className="nav-link">Wyślij wiadomość</Link>
                )}

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
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                </Link>
            </div>
        </nav>
    );
}

export default Navbar;
