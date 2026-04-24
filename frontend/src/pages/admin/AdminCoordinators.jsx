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
  const role = user?.role || "";
  const isAdmin = ["admin", "ADMIN", "Admin"].includes(role);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [search, setSearch] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const queryClient = useQueryClient();

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const { data: users = [], isLoading: usersLoading, isError: usersIsError, error: usersError } = useQuery([
    "allUsers",
    token,
  ], async () => {
    const res = await fetch(`/api/admin/users/search`, { headers });
    if (!res.ok) throw new Error("Nie można pobrać użytkowników");
    return await res.json();
  }, { staleTime: 1000 * 60 * 5, enabled: true });

  const { data: coordinators = [], isLoading: coordsLoading, isError: coordsIsError, error: coordsError } = useQuery([
    "coordinatorsWithCohorts",
    token,
  ], async () => {
    const res = await fetch(`/api/admin/coordinators-with-cohorts`, { headers });
    if (!res.ok) throw new Error("Nie można pobrać koordynatorów");
    return await res.json();
  }, { staleTime: 1000 * 60 * 5, enabled: true });

  // derive loading & fetch errors from queries instead of setting state inside effects
  const usersEmpty = !users || users.length === 0;
  const coordsEmpty = !coordinators || coordinators.length === 0;
  const loading = (usersLoading && usersEmpty) || (coordsLoading && coordsEmpty);
  const fetchError = usersIsError ? usersError?.message : coordsIsError ? coordsError?.message : "";
  const displayedError = error || fetchError;





  const unassignMutation = useMutation(async (cohortId) => {
    const res = await fetch(`/api/admin/cohorts/${cohortId}/coordinator`, { method: "DELETE", headers });
    if (!res.ok) throw new Error(await res.text());
    return true;
  }, {
    onMutate: async (cohortId) => {
      setError("");
      setInfo("");
      setIsBusy(true);
      await queryClient.cancelQueries(["coordinatorsWithCohorts", token]);
      await queryClient.cancelQueries(["cohorts", token]);
      const previousCoordinators = queryClient.getQueryData(["coordinatorsWithCohorts", token]);
      const previousCohorts = queryClient.getQueryData(["cohorts", token]);

      queryClient.setQueryData(["coordinatorsWithCohorts", token], (old = []) => (old || []).map(coord => ({ ...coord, cohorts: (coord.cohorts || []).filter(c => c.id !== cohortId) })));
      queryClient.setQueryData(["cohorts", token], (old = []) => (old || []).map(c => c.id === cohortId ? ({ ...c, coordinator: null }) : c));

      return { previousCoordinators, previousCohorts };
    },
    onError: (err, cohortId, context) => {
      if (context?.previousCoordinators) queryClient.setQueryData(["coordinatorsWithCohorts", token], context.previousCoordinators);
      if (context?.previousCohorts) queryClient.setQueryData(["cohorts", token], context.previousCohorts);
      setError(err?.message || "Błąd");
    },
    onSettled: async () => {
      setIsBusy(false);
      await Promise.all([
        queryClient.invalidateQueries(["cohorts", token]),
        queryClient.invalidateQueries(["coordinatorsWithCohorts", token]),
      ]);
      setInfo("Usunięto przypisanie");
    },
  });



  const promoteMutation = useMutation(async (userId) => {
    const res = await fetch(`/api/admin/users/${userId}/promote`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, {
    onMutate: async (userId) => {
      setError("");
      setInfo("");
      setIsBusy(true);
      await queryClient.cancelQueries(["allUsers", token]);
      await queryClient.cancelQueries(["coordinatorsWithCohorts", token]);
      const previousUsers = queryClient.getQueryData(["allUsers", token]);
      const previousCoordinators = queryClient.getQueryData(["coordinatorsWithCohorts", token]);

      queryClient.setQueryData(["allUsers", token], (old = []) => old.map(u => u.id === userId ? { ...u, role: 3 } : u));
      const userObj = previousUsers?.find(u => u.id === userId);
      if (userObj) {
        const newCoord = { id: userObj.id, name: `${userObj.name} ${userObj.surname}`, email: userObj.email, cohorts: [], courses: [] };
        queryClient.setQueryData(["coordinatorsWithCohorts", token], (old = []) => {
          const exists = old.find(c => c.id === userId);
          if (exists) return old;
          return [newCoord, ...old];
        });
      }

      return { previousUsers, previousCoordinators };
    },
    onError: (err, userId, context) => {
      if (context?.previousUsers) queryClient.setQueryData(["allUsers", token], context.previousUsers);
      if (context?.previousCoordinators) queryClient.setQueryData(["coordinatorsWithCohorts", token], context.previousCoordinators);
      setError(err?.message || "Błąd podczas promowania");
    },
    onSettled: async () => {
      setIsBusy(false);
      await Promise.all([
        queryClient.invalidateQueries(["allUsers", token]),
        queryClient.invalidateQueries(["coordinatorsWithCohorts", token]),
      ]);
      setInfo("Użytkownik został promotowany na koordynatora");
    },
  });

  const demoteMutation = useMutation(async (userId) => {
    const res = await fetch(`/api/admin/users/${userId}/demote`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, {
    onMutate: async (userId) => {
      setError("");
      setInfo("");
      setIsBusy(true);
      await queryClient.cancelQueries(["allUsers", token]);
      await queryClient.cancelQueries(["coordinatorsWithCohorts", token]);
      const previousUsers = queryClient.getQueryData(["allUsers", token]);
      const previousCoordinators = queryClient.getQueryData(["coordinatorsWithCohorts", token]);

      queryClient.setQueryData(["allUsers", token], (old = []) => old.map(u => u.id === userId ? { ...u, role: 1 } : u));
      queryClient.setQueryData(["coordinatorsWithCohorts", token], (old = []) => old.filter(c => c.id !== userId));

      return { previousUsers, previousCoordinators };
    },
    onError: (err, userId, context) => {
      if (context?.previousUsers) queryClient.setQueryData(["allUsers", token], context.previousUsers);
      if (context?.previousCoordinators) queryClient.setQueryData(["coordinatorsWithCohorts", token], context.previousCoordinators);
      setError(err?.message || "Błąd podczas degradacji");
    },
    onSettled: async () => {
      setIsBusy(false);
      await Promise.all([
        queryClient.invalidateQueries(["allUsers", token]),
        queryClient.invalidateQueries(["coordinatorsWithCohorts", token]),
      ]);
      setInfo("Użytkownik zdegradowany");
    },
  });

  const filteredResults = useMemo(() => {
    if (!search || !search.trim()) return [];
    const term = search.toLowerCase();
    return (users || [])
      .filter(u => Number(u?.role ?? u?.rank ?? u?.roleId ?? 0) === 1 && (`${u.name || ""} ${u.surname || ""} ${u.email || ""}`).toLowerCase().includes(term))
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
        <p>Lista koordynatorów oraz przypisane do nich kohorty. Możesz też promować użytkowników.</p>
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
              onChange={(e)=>{ setSearch(e.target.value); }}
              onKeyDown={(e)=>{ if (e.key === 'Enter') { e.preventDefault(); if (filteredResults && filteredResults.length>0) promoteMutation.mutate(filteredResults[0].id); } }}
            />
            <button
              className="btn btn-primary"
              onClick={()=>{ if (filteredResults && filteredResults.length>0) promoteMutation.mutate(filteredResults[0].id); }}
              disabled={isBusy || !(filteredResults && filteredResults.length>0)}
            >Dodaj</button>
          </div>

          {displayedError ? (
            <p className="form-error" role="alert">{displayedError}</p>
          ) : null}
          {info ? <p className="form-info">{info}</p> : null}

          {loading ? (
            <p>Ładowanie…</p>
          ) : (
            coordinators.length === 0 ? (
              <p>Brak koordynatorów.</p>
            ) : (
              <>
                {filteredResults && filteredResults.length > 0 && (
                  <div className="search-results">
                    <h3>Wyniki wyszukiwania</h3>
                    <ul>
                      {filteredResults.map(u => (
                        <li key={u.id} className="search-result-item" onClick={() => promoteMutation.mutate(u.id)}>
                          <span>{u.name} {u.surname} {u.email}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <h2>Koordynatorzy</h2>
                {sortedCoordinators.map((c) => {
                  const hasCourses = c.courses && c.courses.length > 0;
                  const hasCohorts = c.cohorts && c.cohorts.length > 0;
                  return (
                    <div key={c.id} className="coordinator-card">
                      <div className="coord-header">
                        <strong>{c.name}</strong> {c.email ? `(${c.email})` : ""}
                        <button className="btn btn-secondary" onClick={() => demoteMutation.mutate(c.id)} disabled={isBusy} style={{marginLeft:10}}>Usuń</button>
                      </div>

                      {hasCourses && (
                        <>
                          <h3>Kierunki</h3>
                          <ul>
                            {(c.courses || []).slice().sort((a, b) => {
                              const an = (a.name||"").toLowerCase();
                              const bn = (b.name||"").toLowerCase();
                              if (an < bn) return -1;
                              if (an > bn) return 1;
                              return (a.id||0) - (b.id||0);
                            }).map(cr => (
                              <li key={cr.id} className="cohort-item">
                                <span>{cr.name}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {hasCohorts && (
                        <>
                          <h3>Kohorty</h3>
                          <ul>
                            {(c.cohorts || []).slice().sort((a,b) => {
                              const an = (a.courseName||'').toLowerCase();
                              const bn = (b.courseName||'').toLowerCase();
                              if (an < bn) return -1;
                              if (an > bn) return 1;
                              const an2 = (a.name||'').toLowerCase();
                              const bn2 = (b.name||'').toLowerCase();
                              if (an2 < bn2) return -1;
                              if (an2 > bn2) return 1;
                              return (a.id||0) - (b.id||0);
                            }).map((co) => (
                              <li key={co.id} className="cohort-item">
                                <span>{co.courseName} — {co.name}</span>
                                <button className="btn btn-secondary remove-btn" onClick={() => unassignMutation.mutate(co.id)} disabled={isBusy}>Usuń</button>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {!hasCourses && !hasCohorts && (
                        <ul><li>Brak przypisań.</li></ul>
                      )}
                    </div>
                  );
                })}
              </>
            )
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminCoordinators;
