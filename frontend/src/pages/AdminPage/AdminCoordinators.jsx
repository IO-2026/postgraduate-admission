import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import "./AdminCoordinatorAssignment.css";

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

function AdminCoordinators() {
  const auth = loadAuthState();
  const token = auth?.token || null;
  const user = auth?.user || null;
  const roleId =
    user?.roleId ??
    (typeof user?.role === "number" ? user.role : (user?.role?.id ?? null));
  const isAdmin =
    roleId === 2 ||
    (typeof user?.role === "string" &&
      user.role.toLowerCase().includes("admin"));

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [search, setSearch] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const queryClient = useQueryClient();

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersIsError,
    error: usersError,
  } = useQuery(
    ["allUsers", token],
    async () => {
      const res = await fetch(`/api/users`, { headers });
      if (!res.ok) throw new Error("Nie można pobrać użytkowników");
      return await res.json();
    },
    { staleTime: 1000 * 60 * 5, enabled: true },
  );

  const {
    data: coordinators = [],
    isLoading: coordsLoading,
    isError: coordsIsError,
    error: coordsError,
  } = useQuery(
    ["coordinatorsWithCourses", token],
    async () => {
      const res = await fetch(`/api/admin/coordinators-with-courses`, {
        headers,
      });
      if (!res.ok) throw new Error("Nie można pobrać koordynatorów");
      return await res.json();
    },
    { staleTime: 1000 * 60 * 5, enabled: true },
  );

  // derive loading & fetch errors from queries
  const usersEmpty = !users || users.length === 0;
  const coordsEmpty = !coordinators || coordinators.length === 0;
  const loading =
    (usersLoading && usersEmpty) || (coordsLoading && coordsEmpty);
  const fetchError = usersIsError
    ? usersError?.message
    : coordsIsError
      ? coordsError?.message
      : "";
  const displayedError = error || fetchError;

  const promoteMutation = useMutation(
    async (userId) => {
      const res = await fetch(`/api/admin/users/${userId}/promote`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    {
      onMutate: async (userId) => {
        setError("");
        setInfo("");
        setIsBusy(true);
        // optimistically clear search input immediately and do not revert on failure
        setSearch("");
        await queryClient.cancelQueries(["allUsers", token]);
        await queryClient.cancelQueries(["coordinatorsWithCourses", token]);
        const previousUsers = queryClient.getQueryData(["allUsers", token]);
        const previousCoordinators = queryClient.getQueryData([
          "coordinatorsWithCourses",
          token,
        ]);

        queryClient.setQueryData(["allUsers", token], (old = []) =>
          old.map((u) => (u.id === userId ? { ...u, roleId: 3 } : u)),
        );
        const userObj = previousUsers?.find((u) => u.id === userId);
        if (userObj) {
          const newCoord = {
            id: userObj.id,
            name: `${userObj.name} ${userObj.surname}`,
            email: userObj.email,
            courses: [],
          };
          queryClient.setQueryData(
            ["coordinatorsWithCourses", token],
            (old = []) => {
              const exists = old.find((c) => c.id === userId);
              if (exists) return old;
              return [newCoord, ...old];
            },
          );
        }

        return { previousUsers, previousCoordinators };
      },
      onError: (err, userId, context) => {
        if (context?.previousUsers)
          queryClient.setQueryData(["allUsers", token], context.previousUsers);
        if (context?.previousCoordinators)
          queryClient.setQueryData(
            ["coordinatorsWithCourses", token],
            context.previousCoordinators,
          );
        setError(err?.message || "Błąd podczas promowania");
      },
      onSuccess: async () => {
        setIsBusy(false);
        await Promise.all([
          queryClient.invalidateQueries(["allUsers", token]),
          queryClient.invalidateQueries(["coordinatorsWithCourses", token]),
        ]);
        setSearch("");
        setInfo("Użytkownik został promotowany na koordynatora");
      },
    },
  );

  const demoteMutation = useMutation(
    async (userId) => {
      const res = await fetch(`/api/admin/users/${userId}/demote`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    {
      onMutate: async (userId) => {
        setError("");
        setInfo("");
        setIsBusy(true);
        await queryClient.cancelQueries(["allUsers", token]);
        await queryClient.cancelQueries(["coordinatorsWithCourses", token]);
        const previousUsers = queryClient.getQueryData(["allUsers", token]);
        const previousCoordinators = queryClient.getQueryData([
          "coordinatorsWithCourses",
          token,
        ]);

        // optimistic update: set role to Candidate and remove from coordinators list
        queryClient.setQueryData(["allUsers", token], (old = []) =>
          (old || []).map((u) =>
            Number(u.id) === Number(userId) ? { ...u, roleId: 1 } : u,
          ),
        );
        queryClient.setQueryData(
          ["coordinatorsWithCourses", token],
          (old = []) =>
            (old || []).filter((c) => Number(c.id) !== Number(userId)),
        );

        return { previousUsers, previousCoordinators };
      },
      onError: (err, userId, context) => {
        if (context?.previousUsers)
          queryClient.setQueryData(["allUsers", token], context.previousUsers);
        if (context?.previousCoordinators)
          queryClient.setQueryData(
            ["coordinatorsWithCourses", token],
            context.previousCoordinators,
          );
        const msg = (err && err.message) || String(err || "");
        let polishMsg = msg;
        const lower = msg.toLowerCase();
        if (lower.includes("cannot demote")) {
          polishMsg =
            "Nie można zdegradować użytkownika: ma przypisane kursy. Najpierw usuń lub przekaż przypisania kursów.";
        }
        setError(polishMsg || "Błąd podczas degradacji");
        setIsBusy(false);
      },
      onSuccess: async (data, userId) => {
        setIsBusy(false);
        // ensure caches reflect server state
        queryClient.setQueryData(["allUsers", token], (old = []) =>
          (old || []).map((u) =>
            Number(u.id) === Number(userId) ? { ...u, roleId: 1 } : u,
          ),
        );
        queryClient.setQueryData(
          ["coordinatorsWithCourses", token],
          (old = []) =>
            (old || []).filter((c) => Number(c.id) !== Number(userId)),
        );
        await Promise.all([
          queryClient.invalidateQueries(["allUsers", token]),
          queryClient.invalidateQueries(["coordinatorsWithCourses", token]),
        ]);
        setInfo("Użytkownik zdegradowany");
      },
    },
  );

  const filteredResults = useMemo(() => {
    if (!search || !search.trim()) return [];
    const term = search.toLowerCase();
    return (users || [])
      .filter(
        (u) =>
          Number(u?.roleId ?? u?.role ?? u?.rank ?? 0) === 1 &&
          `${u.name || ""} ${u.surname || ""} ${u.email || ""}`
            .toLowerCase()
            .includes(term),
      )
      .sort((a, b) => {
        const an = `${a.name || ""} ${a.surname || ""}`.toLowerCase();
        const bn = `${b.name || ""} ${b.surname || ""}`.toLowerCase();
        if (an < bn) return -1;
        if (an > bn) return 1;
        return (a.id || 0) - (b.id || 0);
      });
  }, [search, users]);

  const sortedCoordinators = useMemo(() => {
    return (coordinators || []).slice().sort((a, b) => {
      const an = (a.name || "").toLowerCase();
      const bn = (b.name || "").toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return (a.id || 0) - (b.id || 0);
    });
  }, [coordinators]);

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
    <section className="admin-view" aria-label="Koordynatorzy">
      <header className="admin-header">
        <h1>Koordynatorzy</h1>
        <p>
          Lista koordynatorów oraz przypisane do nich kierunki. Możesz też
          promować użytkowników.
        </p>
      </header>

      <div className="admin-grid">
        <div className="admin-card">
          <h2>Dodaj koordynatora</h2>

          <div className="search-row">
            <input
              type="text"
              className="form-input"
              placeholder="Szukaj (imię, nazwisko, email)"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filteredResults && filteredResults.length > 0)
                    promoteMutation.mutate(filteredResults[0].id);
                }
              }}
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                if (filteredResults && filteredResults.length > 0)
                  promoteMutation.mutate(filteredResults[0].id);
              }}
              disabled={
                isBusy || !(filteredResults && filteredResults.length > 0)
              }
            >
              Dodaj
            </button>
          </div>

          {displayedError ? (
            <p className="form-error" role="alert">
              {displayedError}
            </p>
          ) : null}
          {info ? <p className="form-info">{info}</p> : null}

          {loading ? (
            <p>Ładowanie…</p>
          ) : coordinators.length === 0 ? (
            <p>Brak koordynatorów.</p>
          ) : (
            <>
              {filteredResults && filteredResults.length > 0 && (
                <div className="search-results">
                  <h3>Wyniki wyszukiwania</h3>
                  <ul>
                    {filteredResults.map((u) => (
                      <li
                        key={u.id}
                        className="search-result-item"
                        onClick={() => promoteMutation.mutate(u.id)}
                      >
                        <span>
                          {u.name} {u.surname} {u.email}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <h2>Koordynatorzy</h2>
              {sortedCoordinators.map((c) => {
                const hasCourses = c.courses && c.courses.length > 0;
                return (
                  <div key={c.id} className="coordinator-card">
                    <div className="coord-header">
                      <strong>{c.name}</strong> {c.email ? `(${c.email})` : ""}
                      <button
                        className="btn btn-secondary"
                        onClick={() => demoteMutation.mutate(c.id)}
                        disabled={isBusy}
                        style={{ marginLeft: 10 }}
                      >
                        Usuń
                      </button>
                    </div>

                    {hasCourses && (
                      <>
                        <ul>
                          {(c.courses || [])
                            .slice()
                            .sort((a, b) => {
                              const an = (a.name || "").toLowerCase();
                              const bn = (b.name || "").toLowerCase();
                              if (an < bn) return -1;
                              if (an > bn) return 1;
                              return (a.id || 0) - (b.id || 0);
                            })
                            .map((cr) => (
                              <li key={cr.id} className="cohort-item">
                                <span>{cr.name}</span>
                              </li>
                            ))}
                        </ul>
                      </>
                    )}

                    {!hasCourses && (
                      <ul>
                        <li>Brak przypisań.</li>
                      </ul>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminCoordinators;
