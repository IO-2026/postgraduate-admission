import { useEffect, useState } from "react";
import { fetchUsers, updateUserRole, deleteUser } from "../../../services/userApi";
import { Link } from "react-router-dom";
import "./UsersPage.css";

const ROLE_FILTERS = [
  { label: "Wszyscy", value: "all" },
  { label: "Administrator", value: "Admin" },
  { label: "Koordynator", value: "Coordinator" },
  { label: "Kandydat", value: "Candidate" },
];

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const token = JSON.parse(localStorage.getItem("pg-admission-auth"))?.token;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".action-menu-container")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const data = await fetchUsers(token);
        setUsers(data);
      } catch (err) {
        console.error(err);
        setError("Nie udało się pobrać listy użytkowników.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [token]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(token, userId, newRole);
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, roleName: newRole } : user,
        ),
      );
    } catch (err) {
      console.error(err);
      alert("Wystąpił błąd podczas zmiany roli.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Czy na pewno chcesz usunąć tego użytkownika? Ta operacja jest nieodwracalna.")) {
      return;
    }

    try {
      await deleteUser(token, userId);
      setUsers(users.filter((user) => user.id !== userId));
    } catch (err) {
      console.error(err);
      alert("Wystąpił błąd podczas usuwania użytkownika.");
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesRole =
      roleFilter === "all" || String(user.roleName) === roleFilter;
    const searchableText = [
      user.name,
      user.surname,
      `${user.name || ""} ${user.surname || ""}`,
      user.email,
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch =
      !normalizedSearch || searchableText.includes(normalizedSearch);

    return matchesRole && matchesSearch;
  });

  if (loading) {
    return (
      <div className="users-page">
        <p>Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-top-actions">
        <Link className="ghost-link users-back-link" to="/">
          <svg
            className="users-back-icon"
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
      <header className="users-header">
        <h1>Zarządzanie Użytkownikami</h1>
        <p className="users-subtitle">
          Zmieniaj uprawnienia użytkowników w systemie.
        </p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <section className="users-controls" aria-label="Filtrowanie użytkowników">
        <label className="users-search-field">
          Szukaj
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Imię, nazwisko lub e-mail"
          />
        </label>

        <div className="users-role-filter" role="group" aria-label="Filtr roli">
          {ROLE_FILTERS.map((role) => (
            <button
              key={role.value}
              type="button"
              className={roleFilter === role.value ? "active" : ""}
              onClick={() => setRoleFilter(role.value)}
            >
              {role.label}
            </button>
          ))}
        </div>
      </section>

      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Imię i nazwisko</th>
              <th>Email</th>
              <th>Telefon</th>
              <th style={{ width: "1%", whiteSpace: "nowrap" }}>Rola</th>
              <th style={{ width: "1%", paddingLeft: 0 }}>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>
                  {user.name} {user.surname}
                </td>
                <td>{user.email}</td>
                <td>{user.telNumber}</td>
                <td style={{ width: "1%", whiteSpace: "nowrap" }}>
                  <select
                    value={user.roleName}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="role-select"
                  >
                    <option value="Admin">Administrator</option>
                    <option value="Coordinator">Koordynator</option>
                    <option value="Candidate">Kandydat</option>
                  </select>
                </td>
                <td style={{ width: "1%", paddingLeft: 0 }}>
                  <div className="action-menu-container" style={{ position: "relative" }}>
                    <button
                      className="ghost-btn"
                      onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                      aria-label="Więcej akcji"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        padding: 0,
                        borderRadius: "4px",
                        color: "var(--text-muted)",
                        transition: "background-color 0.2s, color 0.2s"
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <circle cx="5" cy="12" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="19" cy="12" r="1.5" />
                      </svg>
                    </button>
                    {openMenuId === user.id && (
                      <div className="action-dropdown">
                        <button
                          className="action-dropdown-btn delete"
                          onClick={() => {
                            setOpenMenuId(null);
                            handleDeleteUser(user.id);
                          }}
                        >
                          Usuń użytkownika
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="6" className="empty-table">
                  Brak użytkowników pasujących do filtrów
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersPage;
