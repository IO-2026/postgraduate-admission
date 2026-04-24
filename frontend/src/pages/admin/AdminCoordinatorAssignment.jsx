import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import "./AdminCoordinatorAssignment.css";

let tmpIdCounter = 0;
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

function AdminCoordinatorAssignment() {
  const auth = loadAuthState();
  const token = auth?.token || null;
  const user = auth?.user || null;
  const role = user?.role || "";
  const isAdmin = ["admin", "ADMIN", "Admin"].includes(role);

  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");


  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const { data: coordinators = [], isLoading: coordsLoading } = useQuery([
    "coordinatorsWithCohorts",
    token,
  ], async () => {
    const r = await fetch("/api/admin/coordinators-with-cohorts", { headers });
    if (!r.ok) throw new Error("Nie można pobrać koordynatorów");
    return r.json();
  }, { staleTime: 1000 * 60 * 5, initialData: queryClient.getQueryData(["coordinatorsWithCohorts", token]) });

  const { data: courses = [], isLoading: coursesLoading } = useQuery([
    "courses",
    token,
  ], async () => {
    const r = await fetch("/api/courses", { headers });
    if (!r.ok) throw new Error("Nie można pobrać kursów");
    return r.json();
  }, { staleTime: 1000 * 60 * 5, initialData: queryClient.getQueryData(["courses", token]) });

  const { data: cohorts = [], isLoading: cohortsLoading } = useQuery([
    "cohorts",
    token,
  ], async () => {
    const r = await fetch("/api/cohorts", { headers });
    if (!r.ok) throw new Error("Nie można pobrać kohort");
    return r.json();
  }, { staleTime: 1000 * 60 * 5, initialData: queryClient.getQueryData(["cohorts", token]) });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery([
    "assignments",
    token,
  ], async () => {
    const r = await fetch("/api/admin/assignments", { headers });
    if (!r.ok) throw new Error("Nie można pobrać przypisań");
    return r.json();
  }, { staleTime: 1000 * 60 * 5, initialData: queryClient.getQueryData(["assignments", token]) });

  const loading = coordsLoading || coursesLoading || cohortsLoading || assignmentsLoading;

  // Sorting helpers — keep UI stable across cache updates
  const sortCourses = (arr) => (arr || []).slice().sort((a, b) => {
    const an = (a?.name || '').toLowerCase();
    const bn = (b?.name || '').toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return (a?.id || 0) - (b?.id || 0);
  });

  const sortCohorts = (arr) => (arr || []).slice().sort((a, b) => {
    const ac = (a?.course?.name || a?.courseName || '').toLowerCase();
    const bc = (b?.course?.name || b?.courseName || '').toLowerCase();
    if (ac < bc) return -1;
    if (ac > bc) return 1;
    const an = (a?.name || '').toLowerCase();
    const bn = (b?.name || '').toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return (a?.id || 0) - (b?.id || 0);
  });

  const sortAssignments = (arr) => (arr || []).slice().sort((a, b) => {
    if ((a?.courseId || 0) !== (b?.courseId || 0)) return (a?.courseId || 0) - (b?.courseId || 0);
    if ((a?.cohortId || 0) !== (b?.cohortId || 0)) return (a?.cohortId || 0) - (b?.cohortId || 0);
    const an = (a?.cohortName || '').toLowerCase();
    const bn = (b?.cohortName || '').toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return (a?.id || 0) - (b?.id || 0);
  });

  const sortedCourses = sortCourses(courses);
  const sortedCohorts = sortCohorts(cohorts);
  const sortedCoordinators = (coordinators || []).slice().sort((a, b) => {
    const an = (a?.name || '').toLowerCase();
    const bn = (b?.name || '').toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return (a?.id || 0) - (b?.id || 0);
  });
  const sortedAssignments = sortAssignments(assignments);

  // Mutations for optimistic updates
  const assignCohortMutation = useMutation(async ({ coordinatorId, courseId, cohortId }) => {
    const res = await fetch("/api/admin/assign-coordinator", { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ coordinatorId, courseId, cohortId }) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, {
    onMutate: async (vars) => {
      setError("");
      setInfo("");
      await queryClient.cancelQueries(["assignments", token]);
      await queryClient.cancelQueries(["cohorts", token]);
      await queryClient.cancelQueries(["coordinatorsWithCohorts", token]);
      await queryClient.cancelQueries(["courses", token]);

      const previousAssignments = queryClient.getQueryData(["assignments", token]) || [];
      const previousCohorts = queryClient.getQueryData(["cohorts", token]) || [];
      const previousCoordinators = queryClient.getQueryData(["coordinatorsWithCohorts", token]) || [];
      const previousCourses = queryClient.getQueryData(["courses", token]) || [];

      const tempId = `tmp-${++tmpIdCounter}`;
      const coordObj = (previousCoordinators || []).find((c) => Number(c.id) === Number(vars.coordinatorId));
      const tempAssignment = {
        id: tempId,
        coordinatorId: Number(vars.coordinatorId),
        courseId: Number(vars.courseId),
        cohortId: Number(vars.cohortId),
        coordinatorName: coordObj?.name,
        coordinatorEmail: coordObj?.email,
      };

      queryClient.setQueryData(["assignments", token], (prev = []) => {
        const without = (prev || []).filter((p) => p.cohortId !== Number(vars.cohortId));
        return [...without, tempAssignment];
      });

      // update cohort's coordinator locally
      queryClient.setQueryData(["cohorts", token], (prev = []) => (prev || []).map((c) => (c.id === Number(vars.cohortId) ? { ...c, coordinator: { id: Number(vars.coordinatorId), name: coordObj?.name, email: coordObj?.email } } : c)));

      // add cohort brief to coordinator's cohorts list
      queryClient.setQueryData(["coordinatorsWithCohorts", token], (prev = []) => {
        const arr = (prev || []).slice();
        return arr.map((c) => {
          if (Number(c.id) === Number(vars.coordinatorId)) {
            const exists = (c.cohorts || []).some((co) => co.id === Number(vars.cohortId));
            if (exists) return c;
            const course = (previousCourses || []).find((cr) => Number(cr.id) === Number(vars.courseId));
            const cohortName = (previousCohorts.find((cc) => Number(cc.id) === Number(vars.cohortId)) || {}).name || "";
            const cohortBrief = { id: Number(vars.cohortId), name: cohortName, courseId: course ? Number(course.id) : null, courseName: course ? course.name : null };
            return { ...c, cohorts: [...(c.cohorts || []), cohortBrief] };
          }
          return c;
        });
      });

      return { previousAssignments, previousCohorts, previousCoordinators, previousCourses, tempId };
    },
    onError: (err, vars, context) => {
      if (context?.previousAssignments) queryClient.setQueryData(["assignments", token], context.previousAssignments);
      if (context?.previousCohorts) queryClient.setQueryData(["cohorts", token], context.previousCohorts);
      if (context?.previousCoordinators) queryClient.setQueryData(["coordinatorsWithCohorts", token], context.previousCoordinators);
      if (context?.previousCourses) queryClient.setQueryData(["courses", token], context.previousCourses);
      setError(err?.message || "Błąd przypisania");
    },
    onSuccess: (data, vars, context) => {
      // replace temp assignment with server-assigned DTO
      queryClient.setQueryData(["assignments", token], (prev = []) => (prev || []).map((p) => (p.id === context.tempId ? data : p)));

      // ensure cohort and coordinator lists contain server data
      queryClient.setQueryData(["cohorts", token], (prev = []) => (prev || []).map((c) => (c.id === data.cohortId ? { ...c, coordinator: { id: data.coordinatorId, name: data.coordinatorName, email: data.coordinatorEmail } } : c)));

      queryClient.setQueryData(["coordinatorsWithCohorts", token], (prev = []) => {
        const arr = (prev || []).slice();
        return arr.map((c) => {
          if (Number(c.id) === Number(data.coordinatorId)) {
            const exists = (c.cohorts || []).some((co) => co.id === data.cohortId);
            if (exists) return c;
            const cohortBrief = { id: data.cohortId, name: data.cohortName || "", courseId: data.courseId, courseName: data.courseName };
            return { ...c, cohorts: [...(c.cohorts || []), cohortBrief] };
          }
          return c;
        });
      });

      setInfo("Przypisano koordynatora");
    },
  });

  const unassignCohortMutation = useMutation(async ({ assignmentId }) => {
    const res = await fetch(`/api/admin/assignments/${assignmentId}`, { method: "DELETE", headers });
    if (!res.ok) throw new Error(await res.text());
    return true;
  }, {
    onMutate: async ({ assignmentId, cohortId, coordinatorId }) => {
      setError("");
      setInfo("");
      await queryClient.cancelQueries(["assignments", token]);
      await queryClient.cancelQueries(["cohorts", token]);
      await queryClient.cancelQueries(["coordinatorsWithCohorts", token]);

      const previousAssignments = queryClient.getQueryData(["assignments", token]) || [];
      const previousCohorts = queryClient.getQueryData(["cohorts", token]) || [];
      const previousCoordinators = queryClient.getQueryData(["coordinatorsWithCohorts", token]) || [];

      queryClient.setQueryData(["assignments", token], (prev = []) => (prev || []).filter((p) => p.id !== assignmentId && p.cohortId !== cohortId));
      queryClient.setQueryData(["cohorts", token], (prev = []) => (prev || []).map((c) => (c.id === cohortId ? { ...c, coordinator: null } : c)));
      queryClient.setQueryData(["coordinatorsWithCohorts", token], (prev = []) => (prev || []).map((c) => (Number(c.id) === Number(coordinatorId) ? { ...c, cohorts: (c.cohorts || []).filter((co) => co.id !== Number(cohortId)) } : c)));

      return { previousAssignments, previousCohorts, previousCoordinators };
    },
    onError: (err, vars, context) => {
      if (context?.previousAssignments) queryClient.setQueryData(["assignments", token], context.previousAssignments);
      if (context?.previousCohorts) queryClient.setQueryData(["cohorts", token], context.previousCohorts);
      if (context?.previousCoordinators) queryClient.setQueryData(["coordinatorsWithCohorts", token], context.previousCoordinators);
      setError(err?.message || "Błąd usuwania przypisania");
    },
    onSuccess: () => {
      setInfo("Usunięto przypisanie");
    },
  });

  const assignCourseMutation = useMutation(async ({ courseId, coordinatorId }) => {
    const res = await fetch(`/api/admin/courses/${courseId}/coordinator`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ coordinatorId }) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, {
    onMutate: async (vars) => {
      setError("");
      setInfo("");
      await queryClient.cancelQueries(["courses", token]);
      await queryClient.cancelQueries(["coordinatorsWithCohorts", token]);

      const previousCourses = queryClient.getQueryData(["courses", token]) || [];
      const previousCoordinators = queryClient.getQueryData(["coordinatorsWithCohorts", token]) || [];

      const prevCourse = (previousCourses || []).find((c) => Number(c.id) === Number(vars.courseId));
      const previousCoordinatorId = prevCourse?.coordinator?.id ?? null;

      const coordObj = (previousCoordinators || []).find((c) => Number(c.id) === Number(vars.coordinatorId));

      // update courses cache
      queryClient.setQueryData(["courses", token], (prev = []) => (prev || []).map((c) => (c.id === vars.courseId ? { ...c, coordinator: { id: coordObj?.id, name: coordObj?.name, email: coordObj?.email } } : c)));

      // remove course from previous coordinator courses
      if (previousCoordinatorId) {
        queryClient.setQueryData(["coordinatorsWithCohorts", token], (prev = []) => (prev || []).map((c) => (Number(c.id) === Number(previousCoordinatorId) ? { ...c, courses: (c.courses || []).filter((cr) => cr.id !== Number(vars.courseId)) } : c)));
      }

      // add course to new coordinator courses
      queryClient.setQueryData(["coordinatorsWithCohorts", token], (prev = []) => (prev || []).map((c) => (Number(c.id) === Number(vars.coordinatorId) ? { ...c, courses: [...(c.courses || []), { id: vars.courseId, name: prevCourse ? prevCourse.name : "" }] } : c)));

      return { previousCourses, previousCoordinators, previousCoordinatorId };
    },
    onError: (err, vars, context) => {
      if (context?.previousCourses) queryClient.setQueryData(["courses", token], context.previousCourses);
      if (context?.previousCoordinators) queryClient.setQueryData(["coordinatorsWithCohorts", token], context.previousCoordinators);
      setError(err?.message || "Błąd przypisania koordynatora kierunku");
    },
    onSuccess: (data, vars, context) => {
      // set course to server returned object
      queryClient.setQueryData(["courses", token], (prev = []) => (prev || []).map((c) => (c.id === data.id ? data : c)));
      // synchronize coordinators' courses lists using returned data
      queryClient.setQueryData(["coordinatorsWithCohorts", token], (prev = []) => (prev || []).map((c) => {
        if (Number(c.id) === Number(data.coordinator?.id || data.coordinatorId)) {
          const exists = (c.courses || []).some(cr => cr.id === data.id);
          if (exists) return c;
          return { ...c, courses: [...(c.courses || []), { id: data.id, name: data.name }] };
        }
        if (Number(c.id) === Number(context.previousCoordinatorId)) {
          return { ...c, courses: (c.courses || []).filter(cr => cr.id !== data.id) };
        }
        return c;
      }));

      setInfo("Przypisano koordynatora kierunku");
    },
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

  // render per-course panels with cohorts and dropdowns
  const handleCoordinatorChange = (courseId, cohortId, newValue) => {
    // Determine current assignment
    const currentAssignments = queryClient.getQueryData(["assignments", token]) || [];
    const existing = currentAssignments.find((a) => a.cohortId === cohortId);

    if (!newValue) {
      // Unassign
      if (!existing) return;

      // If this is a temporary (optimistic) assignment we can remove locally without hitting the server
      const isTemp = existing && (typeof existing.id === "string") && String(existing.id).startsWith("tmp-");
      if (isTemp) {
        // remove temp assignment from cache
        queryClient.setQueryData(["assignments", token], (prev = []) => (prev || []).filter((p) => p.cohortId !== cohortId));
        // clear cohort coordinator
        queryClient.setQueryData(["cohorts", token], (prev = []) => (prev || []).map((c) => (c.id === cohortId ? { ...c, coordinator: null } : c)));
        // remove cohort from any coordinator lists
        queryClient.setQueryData(["coordinatorsWithCohorts", token], (prev = []) => (prev || []).map((c) => ({ ...c, cohorts: (c.cohorts || []).filter((co) => co.id !== cohortId) })));
        setInfo("Usunięto przypisanie");
        return;
      }

      unassignCohortMutation.mutate({ assignmentId: existing.id, cohortId: cohortId, coordinatorId: existing.coordinatorId });
    } else {
      const coordinatorId = Number(newValue);
      assignCohortMutation.mutate({ coordinatorId, courseId, cohortId });
    }
  };

  const handleCourseCoordinatorChange = (courseId, newValue) => {
    if (!newValue) return; // unassign not supported
    const coordinatorId = Number(newValue);
    assignCourseMutation.mutate({ courseId, coordinatorId });
  };

  return (
    <section className="admin-view" aria-label="Przydzielanie koordynatorów">
      <header className="admin-header">
        <h1>Przydziel koordynatora</h1>
        <p>Przypisz koordynatora do kierunku i kohorty.</p>
      </header>

      <div className="admin-card admin-form">
        {loading ? (
          <p>Ładowanie danych…</p>
        ) : (
          <>
            {sortedCourses.map((course) => {
              const cohortsForCourse = sortedCohorts.filter((c) => (c.course ? c.course.id === course.id : (c.courseId ? c.courseId === course.id : false)));
              return (
                <section key={course.id} className="course-panel">
                  <h2>{course.name}</h2>
                  <div className="course-coordinator">
                    <label>Koordynator kierunku:&nbsp;</label>
                    <select className="form-input"
                      value={course.coordinator ? course.coordinator.id : (sortedCoordinators && sortedCoordinators.length > 0 ? sortedCoordinators[0].id : "")}
                      onChange={(e) => handleCourseCoordinatorChange(course.id, e.target.value)}
                      disabled={!(sortedCoordinators && sortedCoordinators.length > 0)}
                    >
                      {sortedCoordinators.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.email ? `(${c.email})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  {cohortsForCourse.length === 0 ? (
                    <p>Brak kohort dla tego kierunku.</p>
                  ) : (
                    <table className="assignments-table">
                      <thead>
                        <tr>
                          <th>Kohorta</th>
                          <th>Koordynator</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cohortsForCourse.map((cohort) => {
                          const assigned = sortedAssignments.find((a) => a.cohortId === cohort.id);
                          return (
                            <tr key={cohort.id}>
                              <td>{cohort.name}</td>
                              <td>
                                <select className="form-input"
                                  value={assigned ? assigned.coordinatorId : ""}
                                  onChange={(e) => handleCoordinatorChange(course.id, cohort.id, e.target.value)}
                                >
                                  <option value="">(Brak)</option>
                                  {sortedCoordinators.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name} {c.email ? `(${c.email})` : ""}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </section>
              );
            })}

            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            {info ? <p className="form-info">{info}</p> : null}
          </>
        )}
      </div>
    </section>
  );
}

export default AdminCoordinatorAssignment;
