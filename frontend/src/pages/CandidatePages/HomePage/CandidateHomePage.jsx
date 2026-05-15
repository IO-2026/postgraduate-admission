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
          <Link className="ghost-link" to="/courses">
            Kierunki studiów
          </Link>
          <Link className="ghost-link" to="/messages">
            Wiadomości
          </Link>
          <Link className="ghost-link" to="/contact">
            Formularz kontaktowy
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

              let displayStatus = "przesłana";
              let statusColor = "#eab308";

              if (isWithdrawn) {
                displayStatus = "wycofana";
                statusColor = "#e11d48";
              } else if (isAccepted) {
                displayStatus = "zaakceptowana";
                statusColor = "#16a34a";
              }

              const courseId = Number(application.courseId);
              const courseName =
                (!Number.isNaN(courseId) && courseNames[courseId]) ||
                "Nieznany kierunek";
              const university = application.university || "Brak danych";

              return (
                <li key={application.id || `${courseName}-${application.id}`}>
                  <article className="application-item">
                    <div className="application-item-main">
                      <h3>{courseName}</h3>
                      <p>
                        Uczelnia: <strong>{university}</strong>
                        {Number.isNaN(courseId)
                          ? ""
                          : ` • ID kierunku: ${courseId}`}
                      </p>
                      <p className="application-date">
                        Data złożenia:{" "}
                        <strong>
                          {formatDate(application.submissionDateTime)}
                        </strong>
                      </p>

                    </div>

                    <div
                      className="application-item-indicators"
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          !isWithdrawn && isAccepted && isDiplomaVerified && isDeclarationVerified && isEntryFeePaid && isSemesterPaid
                            ? "auto 1fr"
                            : [
                                true,
                                !isWithdrawn,
                                isAccepted && !isWithdrawn,
                                isEntryFeePaid && !isWithdrawn,
                                isAccepted && isSemesterPaid && !isWithdrawn,
                              ].filter(Boolean).length > 3
                              ? "auto 1fr auto 1fr"
                              : "auto 1fr",
                        gap: "6px 10px",
                        alignItems: "center",
                        fontSize: "0.85rem",
                      }}
                    >
                      {!isWithdrawn && isAccepted && isDiplomaVerified && isDeclarationVerified && isEntryFeePaid && isSemesterPaid ? (
                        <>
                          <span style={{ color: "#000000ff", textAlign: "right" }}>Aplikacja:</span>
                          <div>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                backgroundColor: "#16a34a20",
                                color: "#16a34a",
                                fontWeight: "bold",
                                display: "inline-block",
                              }}
                            >
                              kandydat przyjęty
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span style={{ color: "#000000ff", textAlign: "right" }}>Aplikacja:</span>
                          <div>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                backgroundColor: `${statusColor}20`,
                                color: statusColor,
                                display: "inline-block",
                              }}
                            >
                              {displayStatus}
                            </span>
                          </div>
                          
                          {!isWithdrawn && (
                            <>
                              <span style={{ color: "#000000ff", textAlign: "right" }}>Dyplom:</span>
                              <div>
                                <span
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    backgroundColor: isDiplomaVerified ? "#16a34a20" : "#eab30820",
                                    color: isDiplomaVerified ? "#16a34a" : "#eab308",
                                    display: "inline-block",
                                  }}
                                >
                                  {isDiplomaVerified ? "zweryfikowany" : "w trakcie weryfikacji"}
                                </span>
                              </div>
                            </>
                          )}
                          
                          {isAccepted && !isWithdrawn && (
                            <>
                              <span style={{ color: "#000000ff", textAlign: "right" }}>Oświadczenie:</span>
                              <div>
                                <span
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    backgroundColor: isDeclarationVerified ? "#16a34a20" : "#eab30820",
                                    color: isDeclarationVerified ? "#16a34a" : "#eab308",
                                    display: "inline-block",
                                  }}
                                >
                                  {isDeclarationVerified ? "zweryfikowane" : "w trakcie weryfikacji"}
                                </span>
                              </div>
                            </>
                          )}

                          {isEntryFeePaid && !isWithdrawn && (
                            <>
                              <span style={{ color: "#000000ff", textAlign: "right" }}>Wpisowe:</span>
                              <div>
                                <span
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    backgroundColor: "#16a34a20",
                                    color: "#16a34a",
                                    display: "inline-block",
                                  }}
                                >
                                  opłacone
                                </span>
                              </div>
                            </>
                          )}

                          {isAccepted && isSemesterPaid && !isWithdrawn && (
                            <>
                              <span style={{ color: "#000000ff", textAlign: "right" }}>Semestr:</span>
                              <div>
                                <span
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    backgroundColor: "#16a34a20",
                                    color: "#16a34a",
                                    display: "inline-block",
                                  }}
                                >
                                  opłacony
                                </span>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    <div className="application-item-meta">
                      {/* OPŁATA WPISOWA */}
                      {!isEntryFeePaid && !isWithdrawn && (
                        <button
                          className="primary-btn application-pay-btn"
                          onClick={() => handlePayEntryFee(application.id)}
                        >
                          Opłać wpisowe
                        </button>
                      )}

                      {/* OPŁATA ZA SEMESTR */}
                      {isAccepted && !isSemesterPaid && !isWithdrawn && (
                        <button
                          className="primary-btn application-pay-btn"
                          onClick={() => handlePaySemester(application.id)}
                        >
                          Opłać I semestr
                        </button>
                      )}

                      {/* REZYGNACJA */}
                      {!isWithdrawn && (
                        <button
                          className="primary-btn danger-btn application-pay-btn"
                          onClick={() => handleWithdraw(application.id)}
                        >
                          Zrezygnuj
                        </button>
                      )}
                    </div>
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
