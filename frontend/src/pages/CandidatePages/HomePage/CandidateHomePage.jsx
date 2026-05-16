import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchApplicationsOfUser,
  withdrawApplication,
  payEntryFee,
  paySemester,
} from "../../../services/applicationApi";
import { fetchCourseById } from "../../../services/courseApi";
import "./CandidateHomePage.css";

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
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".application-menu-container")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userId = useMemo(() => resolveUserId(user), [user]);

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm("Czy na pewno chcesz zrezygnować z tego zgłoszenia?")) {
      return;
    }

    try {
      setLoadingApplications(true);
      await withdrawApplication(applicationId);
      const data = await fetchApplicationsOfUser(userId);
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      alert(error.message || "Wystąpił błąd podczas rezygnacji.");
    } finally {
      setLoadingApplications(false);
    }
  };

  const handlePayEntryFee = async (applicationId) => {
    if (!window.confirm("Czy chcesz potwierdzić dokonanie opłaty wpisowej?")) {
      return;
    }

    try {
      setLoadingApplications(true);
      await payEntryFee(applicationId);
      const data = await fetchApplicationsOfUser(userId);
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      alert(error.message || "Wystąpił błąd podczas opłacania wpisowego.");
    } finally {
      setLoadingApplications(false);
    }
  };

  const handlePaySemester = async (applicationId) => {
    if (
      !window.confirm(
        "Czy chcesz potwierdzić dokonanie opłaty za pierwszy semestr?",
      )
    ) {
      return;
    }

    try {
      setLoadingApplications(true);
      await paySemester(applicationId);
      const data = await fetchApplicationsOfUser(userId);
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      alert(error.message || "Wystąpił błąd podczas opłacania semestru.");
    } finally {
      setLoadingApplications(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Brak daty";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

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
      if (
        !isLoggedIn ||
        !Array.isArray(applications) ||
        applications.length === 0
      ) {
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
              const isWithdrawn = Boolean(application.isWithdrawn);
              const isAccepted = Boolean(application.isAccepted);
              const isEntryFeePaid = Boolean(application.isEntryFeePaid);
              const isSemesterPaid = Boolean(application.isSemesterPaid);
              const isDiplomaVerified = Boolean(application.isDiplomaVerified);
              const isDeclarationVerified = Boolean(
                application.isDeclarationVerified,
              );

              const courseId = Number(application.courseId);
              const courseName =
                (!Number.isNaN(courseId) && courseNames[courseId]) ||
                "Nieznany kierunek";

              return (
                <li key={application.id || `${courseName}-${application.id}`}>
                  <article className="application-item application-item--vertical">
                    <div className="application-item-top">
                      <div className="application-item-main">
                        <h3>{courseName}</h3>
                        <p className="application-date">
                          Data złożenia:{" "}
                          <strong>
                            {formatDate(application.submissionDateTime)}
                          </strong>
                        </p>
                      </div>

                      <div className="application-item-actions">
                        {!isEntryFeePaid && !isWithdrawn && (
                          <button
                            className="primary-btn application-pay-btn"
                            onClick={() => handlePayEntryFee(application.id)}
                          >
                            Opłać wpisowe
                          </button>
                        )}
                        {isAccepted && !isSemesterPaid && !isWithdrawn && (
                          <button
                            className="primary-btn application-pay-btn"
                            onClick={() => handlePaySemester(application.id)}
                          >
                            Opłać I semestr
                          </button>
                        )}
                        {!isWithdrawn && (
                          <div
                            className="application-menu-container"
                            style={{ position: "relative" }}
                          >
                            <button
                              className="application-menu-btn"
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === application.id
                                    ? null
                                    : application.id,
                                )
                              }
                              aria-label="Więcej opcji"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                              </svg>
                            </button>
                            {openMenuId === application.id && (
                              <div className="application-dropdown-menu">
                                <button
                                  className="application-dropdown-item danger"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleWithdraw(application.id);
                                  }}
                                >
                                  Zrezygnuj
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {isWithdrawn ? (
                      <div className="application-withdrawn-badge">
                        Aplikacja wycofana
                      </div>
                    ) : (
                      <div className="application-timeline">
                        {[
                          { label: "Aplikacja wysłana", done: true },
                          { label: "Wpisowe wpłacone", done: isEntryFeePaid },
                          {
                            label: "Dyplom potwierdzony",
                            done: isDiplomaVerified,
                          },
                          { label: "Zaakceptowany", done: isAccepted },
                          { label: "Semestr opłacony", done: isSemesterPaid },
                          {
                            label: "Oświadczenie dostarczone",
                            done: isDeclarationVerified,
                          },
                          {
                            label: "Przyjęty",
                            done:
                              isAccepted &&
                              isEntryFeePaid &&
                              isDiplomaVerified &&
                              isSemesterPaid &&
                              isDeclarationVerified,
                          },
                        ].map((step, idx, arr) => (
                          <div key={idx} className="timeline-step">
                            <div className="timeline-step-track">
                              <div
                                className={`timeline-line ${idx > 0 && step.done ? "done" : ""}`}
                                style={
                                  idx === 0
                                    ? { visibility: "hidden" }
                                    : undefined
                                }
                              />
                              <div
                                className={`timeline-dot ${step.done ? "done" : ""}`}
                              >
                                {step.done && (
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                              <div
                                className={`timeline-line ${idx < arr.length - 1 && arr[idx + 1].done ? "done" : ""}`}
                                style={
                                  idx === arr.length - 1
                                    ? { visibility: "hidden" }
                                    : undefined
                                }
                              />
                            </div>
                            <span
                              className={`timeline-label ${step.done ? "done" : ""}`}
                            >
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        ) : null}

        {!loadingApplications &&
        !applicationsError &&
        applications.length === 0 ? (
          <p className="applications-empty">Brak bieżących aplikacji.</p>
        ) : null}
      </section>
    </section>
  );
}

export default CandidateHomePage;
