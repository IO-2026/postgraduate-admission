import { useEffect, useState } from "react";

const AUTH_STORAGE_KEY = "pg-admission-auth";

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function loadAuthState() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== "object") return null;
  return parsed;
}

function AdminAssignments() {
  const auth = loadAuthState();
  const token = auth?.token || null;
  const user = auth?.user || null;
  const role = user?.role || "";
  const isAdmin = ["admin", "ADMIN", "Admin"].includes(role);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("/api/admin/assignments", { headers });
        if (!res.ok) {
          throw new Error("Nie można pobrać przypisań");
        }
        const data = await res.json();
        if (mounted) setAssignments(data);
      } catch (e) {
        if (mounted) setError("Nie można pobrać przypisań. " + (e?.message || ""));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [token]);

  // keep assignments in deterministic order to avoid UI flicker
  const sortedAssignments = (assignments || []).slice().sort((a, b) => {
    const ac = (a?.courseName || '').toLowerCase();
    const bc = (b?.courseName || '').toLowerCase();
    if (ac < bc) return -1;
    if (ac > bc) return 1;
    const an = (a?.cohortName || '').toLowerCase();
    const bn = (b?.cohortName || '').toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return (a?.id || 0) - (b?.id || 0);
  });

  if (!isAdmin) {
    return (
      <section className="admin-view" aria-label="Panel administracyjny">
        <div className="admin-card">
          <h1>Brak uprawnień</h1>
          <p>Ta strona jest dostępna tylko dla administratorów.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-view" aria-label="Przypisania koordynatorów">
      <header className="admin-header">
        <h1>Przypisania koordynatorów</h1>
        <p>Lista przypisań koordynator — kierunek — kohorta.</p>
      </header>

      <div className="admin-card">
        {loading ? (
          <p>Ładowanie…</p>
        ) : error ? (
          <p className="form-error" role="alert">{error}</p>
        ) : assignments.length === 0 ? (
          <p>Brak przypisań.</p>
        ) : (
          <table className="assignments-table">
            <thead>
              <tr>
                <th>Koordynator</th>
                <th>Kierunek</th>
                <th>Kohorta</th>
              </tr>
            </thead>
            <tbody>
              {sortedAssignments.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.coordinatorName} {a.coordinatorEmail ? `(${a.coordinatorEmail})` : ""}
                  </td>
                  <td>{a.courseName}</td>
                  <td>{a.cohortName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default AdminAssignments;
