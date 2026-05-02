import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchApplicationsOfUser } from "../../../services/applicationApi";
import { fetchCourseById } from "../../../services/courseApi";
import "./CandidateHomePage.css";

const STATUS_LABELS = {
  SUBMITTED: "Wniosek przyjęty",
  VERIFIED: "Wniosek zweryfikowany",
  WAITING_LIST: "Wniosek na liście rezerwowej",
  ACCEPTED: "Wniosek zaakceptowany",
  REJECTED: "Wniosek odrzucony",
  WITHDRAWN: "Wniosek wycofany",
};

function resolveUserId(user) {
  if (!user || typeof user !== "object") return null;
  if (typeof user.id === "number") return user.id;
  if (typeof user.userId === "number") return user.userId;

  const parsedId = Number.parseInt(String(user.id ?? user.userId ?? ""), 10);
  return Number.isNaN(parsedId) ? null : parsedId;
}

function CandidateHomePage({ isLoggedIn, user }) {
  const [applications, setApplications] = useState([]);
  const [courseNames, setCourseNames] = useState({});
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applicationsError, setApplicationsError] = useState("");

  const userId = useMemo(() => resolveUserId(user), [user]);

  useEffect(() => {
    let isMounted = true;

    const loadApplications = async () => {
      if (!isLoggedIn || userId == null) {
        setApplications([]);
        return;
      }

      setLoadingApplications(true);
      setApplicationsError("");

      try {
        const data = await fetchApplicationsOfUser(userId);
        if (!isMounted) return;
        setApplications(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isMounted) return;
        setApplicationsError(
          error?.message || "Nie udało się pobrać bieżących aplikacji.",
        );
      } finally {
        if (isMounted) {
          setLoadingApplications(false);
        }
      }
    };

    loadApplications();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, userId]);

  useEffect(() => {
    let isMounted = true;

    const loadCourseNames = async () => {
      if (!isLoggedIn || !Array.isArray(applications) || applications.length === 0) {
        setCourseNames({});
        return;
      }

      const ids = Array.from(
        new Set(
          applications
            .map((a) => {
              const n = Number(a?.courseId);
              return Number.isNaN(n) ? null : n;
            })
            .filter((v) => v != null),
        ),
      );

      if (ids.length === 0) {
        setCourseNames({});
        return;
      }

      try {
        const pairs = await Promise.all(
          ids.map(async (id) => {
            try {
              const dto = await fetchCourseById(id);
              return [id, dto?.name || `Kierunek #${id}`];
            } catch {
              return [id, `Kierunek #${id}`];
            }
          }),
        );

        if (!isMounted) return;
        const map = {};
        pairs.forEach(([id, name]) => {
          map[id] = name;
        });
        setCourseNames(map);
      } catch {
        if (!isMounted) return;
        setCourseNames({});
      }
    };

    loadCourseNames();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, applications]);

  if (!isLoggedIn) {
    return (
      <section className="gate-view" aria-label="Brama dostępu dla gościa">
        <div className="guest-panel">
          <p className="guest-tag">Studia podyplomowe AGH</p>
          <h1>Witamy w portalu rekrutacji</h1>
          <p className="guest-subtitle">
            Zaloguj się, aby zarządzać aplikacjami, sprawdzać status dokumentów
            i otrzymywać najważniejsze komunikaty.
          </p>

          <div style={{ display: "flex", gap: "1rem" }}>
            <Link className="primary-btn" to="/auth">
              Zaloguj się
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="home-view">
      <header className="home-header">
        <p className="home-tag">Studia podyplomowe AGH</p>
        <h1>Strona główna</h1>
        <p className="home-subtitle">
          Jesteś zalogowany. W tym miejscu możesz sprawdzić status rekrutacji,
          przesyłać wymagane dokumenty i śledzić terminy.
        </p>
        <div className="home-actions">
          <Link className="primary-btn" to="/admission">
            Zapisz się na studia
          </Link>
          <Link className="ghost-link" to="/courses">
            Kierunki studiów
          </Link>
          <Link className="ghost-link" to="/messages">
            Wiadomości
          </Link>
        </div>
      </header>

      <section className="applications-section">
        <div className="applications-header">
          <h2>Bieżące aplikacje</h2>
          <span className="applications-count">{applications.length}</span>
        </div>

        {loadingApplications ? (
          <p className="applications-empty">Ładowanie aplikacji...</p>
        ) : null}

        {applicationsError ? (
          <p className="applications-error" role="alert">
            {applicationsError}
          </p>
        ) : null}

        {!loadingApplications && !applicationsError ? (
          <ul className="applications-list" aria-label="Bieżące aplikacje">
            {applications.map((application) => {
              const status = application.status || "SUBMITTED";
              const statusLabel = STATUS_LABELS[status] || status;
              const courseId = Number(application.courseId);
              const courseName =
                (!Number.isNaN(courseId) && courseNames[courseId]) ||
                "Nieznany kierunek";
              const university = application.university || "Brak danych";
              const isPaid = Boolean(application.isPaid);

              return (
                <li key={application.id || `${courseName}-${status}`}>
                  <article className="application-item">
                    <div className="application-item-main">
                      <h3>{courseName}</h3>
                      <p>
                        Uczelnia: <strong>{university}</strong>
                        {Number.isNaN(courseId) ? "" : ` • ID kierunku: ${courseId}`}
                      </p>
                    </div>
                    <div className="application-item-meta">
                      <span className="application-status">{statusLabel}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          className={
                            isPaid
                              ? "application-payment application-payment-paid"
                              : "application-payment application-payment-unpaid"
                          }
                        >
                          {isPaid ? "Opłacona" : "Nieopłacona"}
                        </span>
                        {!isPaid ? (
                          <Link
                            to={`/payment/${application.id}`}
                            className="primary-btn"
                            style={{
                              padding: "0.25rem 0.75rem",
                              fontSize: "0.875rem",
                              textDecoration: "none",
                            }}
                          >
                            Opłać
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : null}

        {!loadingApplications && !applicationsError && applications.length === 0 ? (
          <p className="applications-empty">Brak bieżących aplikacji.</p>
        ) : null}
      </section>
    </section>
  );
}

export default CandidateHomePage;
