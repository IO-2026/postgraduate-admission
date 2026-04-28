import { useEffect, useState } from "react";
import { fetchUsers, updateUserRole } from "../../services/userApi";
import { Link } from "react-router-dom";
import "./UsersPage.css";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="users-page">
        <p>Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      <header className="users-header">
        <div className="header-top">
          <Link to="/" className="back-link">
            ← Powrót do strony głównej
          </Link>
        </div>
        <h1>Zarządzanie Użytkownikami</h1>
        <p className="users-subtitle">
          Zmieniaj uprawnienia użytkowników w systemie.
        </p>
      </header>

      {error && <div className="error-message">{error}</div>}

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
            {users.map((user) => (
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
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-table">
                  Brak użytkowników
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
