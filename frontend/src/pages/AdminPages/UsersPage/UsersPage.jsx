import { useEffect, useState } from "react";
import { fetchUsers, updateUserRole } from "../../../services/userApi";
import { Link } from "react-router-dom";
import "./UsersPage.css";

const ROLE_FILTERS = [
  { label: "Wszyscy", value: "all" },
  { label: "Admin", value: "Admin" },
  { label: "Coordinator", value: "Coordinator" },
  { label: "Candidate", value: "Candidate" },
];

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const token = JSON.parse(localStorage.getItem("pg-admission-auth"))?.token;

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
              <th>Rola</th>
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
                <td>
                  <select
                    value={user.roleName}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="role-select"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Candidate">Candidate</option>
                  </select>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-table">
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
