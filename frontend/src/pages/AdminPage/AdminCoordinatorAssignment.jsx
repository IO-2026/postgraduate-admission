import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import "../UsersPage/UsersPage.css";
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

function AdminCoordinatorAssignment() {
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

  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const { data: coordinators = [], isLoading: coordsLoading } = useQuery(
    ["coordinatorsWithCourses", token],
    async () => {
      const r = await fetch("/api/admin/coordinators-with-courses", {
        headers,
      });
      if (!r.ok) throw new Error("Nie można pobrać koordynatorów");
      return r.json();
    },
    {
      staleTime: 1000 * 60 * 5,
      initialData: queryClient.getQueryData(["coordinatorsWithCourses", token]),
    },
  );

  const { data: courses = [], isLoading: coursesLoading } = useQuery(
    ["courses", token],
    async () => {
      const r = await fetch("/api/courses", { headers });
      if (!r.ok) throw new Error("Nie można pobrać kursów");
      return r.json();
    },
    {
      staleTime: 1000 * 60 * 5,
      initialData: queryClient.getQueryData(["courses", token]),
    },
  );

  useEffect(() => {
    if (!isAdmin || !token) return;
    // Refresh cached admin lists in the background when the page is opened
    queryClient.invalidateQueries(["coordinatorsWithCourses", token]);
    queryClient.invalidateQueries(["courses", token]);
  }, [queryClient, token, isAdmin]);

  const loading = coordsLoading || coursesLoading;

  // Sorting helpers — keep UI stable across cache updates
  const sortCourses = (arr) =>
    (arr || []).slice().sort((a, b) => {
      const an = (a?.name || "").toLowerCase();
      const bn = (b?.name || "").toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return (a?.id || 0) - (b?.id || 0);
    });

  const sortedCourses = sortCourses(courses);
  const sortedCoordinators = (coordinators || []).slice().sort((a, b) => {
    const an = (a?.name || "").toLowerCase();
    const bn = (b?.name || "").toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return (a?.id || 0) - (b?.id || 0);
  });

  const assignCourseMutation = useMutation(
    async ({ courseId, coordinatorId }) => {
      const res = await fetch(`/api/admin/courses/${courseId}/coordinator`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ coordinatorId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    {
      onMutate: async (vars) => {
        setError("");
        setInfo("");
        await queryClient.cancelQueries(["courses", token]);
        await queryClient.cancelQueries(["coordinatorsWithCourses", token]);

        const previousCourses =
          queryClient.getQueryData(["courses", token]) || [];
        const previousCoordinators =
          queryClient.getQueryData(["coordinatorsWithCourses", token]) || [];

        const prevCourse = (previousCourses || []).find(
          (c) => Number(c.id) === Number(vars.courseId),
        );
        const previousCoordinatorId = prevCourse?.coordinatorId ?? null;

        const coordObj = (previousCoordinators || []).find(
          (c) => Number(c.id) === Number(vars.coordinatorId),
        );

        // update courses cache optimistically (use coordinatorId DTO field)
        queryClient.setQueryData(["courses", token], (prev = []) =>
          (prev || []).map((c) =>
            c.id === vars.courseId
              ? {
                  ...c,
                  coordinatorId: coordObj?.id ?? null,
                }
              : c,
          ),
        );

        // remove course from previous coordinator courses list
        if (previousCoordinatorId) {
          queryClient.setQueryData(
            ["coordinatorsWithCourses", token],
            (prev = []) =>
              (prev || []).map((c) =>
                Number(c.id) === Number(previousCoordinatorId)
                  ? {
                      ...c,
                      courses: (c.courses || []).filter(
                        (cr) => cr.id !== Number(vars.courseId),
                      ),
                    }
                  : c,
              ),
          );
        }

        // add course to new coordinator courses list
        queryClient.setQueryData(
          ["coordinatorsWithCourses", token],
          (prev = []) =>
            (prev || []).map((c) =>
              Number(c.id) === Number(vars.coordinatorId)
                ? {
                    ...c,
                    courses: [
                      ...(c.courses || []),
                      {
                        id: vars.courseId,
                        name: prevCourse ? prevCourse.name : "",
                      },
                    ],
                  }
                : c,
            ),
        );

        return { previousCourses, previousCoordinators, previousCoordinatorId };
      },
      onError: (err, vars, context) => {
        if (context?.previousCourses)
          queryClient.setQueryData(["courses", token], context.previousCourses);
        if (context?.previousCoordinators)
          queryClient.setQueryData(
            ["coordinatorsWithCourses", token],
            context.previousCoordinators,
          );
        setError(err?.message || "Błąd przypisania koordynatora kierunku");
      },
      onSuccess: (data, vars, context) => {
        // set course to server-returned CourseDTO (map coordinator -> coordinatorId)
        const mappedCourseDTO = {
          id: data.id,
          name: data.name,
          description: data.description,
          price: data.price,
          recruitmentStart: data.recruitmentStart,
          recruitmentEnd: data.recruitmentEnd,
          coordinatorId: data.coordinator?.id || data.coordinatorId || null,
        };
        queryClient.setQueryData(["courses", token], (prev = []) =>
          (prev || []).map((c) => (c.id === data.id ? mappedCourseDTO : c)),
        );

        // synchronize coordinators' courses lists using returned data (use mapped coordinatorId)
        const mappedCoordinatorId = data.coordinator?.id || data.coordinatorId;
        queryClient.setQueryData(
          ["coordinatorsWithCourses", token],
          (prev = []) =>
            (prev || []).map((c) => {
              if (Number(c.id) === Number(mappedCoordinatorId)) {
                const exists = (c.courses || []).some((cr) => cr.id === data.id);
                if (exists) return c;
                return {
                  ...c,
                  courses: [
                    ...(c.courses || []),
                    { id: data.id, name: data.name },
                  ],
                };
              }
              if (Number(c.id) === Number(context.previousCoordinatorId)) {
                return {
                  ...c,
                  courses: (c.courses || []).filter((cr) => cr.id !== data.id),
                };
              }
              return c;
            }),
        );

        setInfo("Przypisano koordynatora kierunku");
      },
    },
  );

  if (!isAdmin) {
    return (
      <div className="users-page">
        <header className="users-header">
          <div className="header-top">
            <Link to="/" className="back-link">
              ← Powrót do strony głównej
            </Link>
          </div>
          <h1>Brak uprawnień</h1>
          <p className="users-subtitle">
            Ta strona jest dostępna tylko dla administratorów.
          </p>
        </header>

        <section className="admin-view" aria-label="Panel administracyjny">
          <div className="admin-card">
            <p>Ta strona jest dostępna tylko dla administratorów.</p>
          </div>
        </section>
      </div>
    );
  }

  const handleCourseCoordinatorChange = (courseId, newValue) => {
    if (!newValue) return; // unassign not supported
    const coordinatorId = Number(newValue);
    assignCourseMutation.mutate({ courseId, coordinatorId });
  };

  return (
    <div className="users-page">
      <header className="users-header">
        <div className="header-top">
          <Link to="/" className="back-link">
            ← Powrót do strony głównej
          </Link>
        </div>
        <h1>Przydziel koordynatora</h1>
        <p className="users-subtitle">Przypisz koordynatora do kierunku.</p>
      </header>

      <section className="admin-view" aria-label="Przydzielanie koordynatorów">
        <div className="admin-card admin-form">
          {loading ? (
            <p>Ładowanie danych…</p>
          ) : (
            <>
              {sortedCourses.map((course) => (
                <section key={course.id} className="course-panel">
                  <h2>{course.name}</h2>
                  <div className="course-coordinator">
                    <label>Koordynator kierunku:&nbsp;</label>
                    <select
                      className="form-input"
                      value={course.coordinatorId ?? ""}
                      onChange={(e) =>
                        handleCourseCoordinatorChange(course.id, e.target.value)
                      }
                      disabled={
                        !(sortedCoordinators && sortedCoordinators.length > 0)
                      }
                    >
                      <option value="">-- Brak koordynatora --</option>
                      {sortedCoordinators.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.email ? `(${c.email})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>
              ))}

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
    </div>
  );
}

export default AdminCoordinatorAssignment;
