import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  fetchCourseCandidates,
  fetchCourses,
} from "../../../services/courseApi";
import {
  verifyDiploma,
  verifyDeclaration,
  acceptApplication,
  getApplicationDiplomaUrl,
} from "../../../services/applicationApi";
import BackButton from "../../../components/BackButton/BackButton";
import "./CourseManagementPage.css";

function CourseManagementPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [courseName, setCourseName] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidatesError, setCandidatesError] = useState("");
  const [candidateActionsLoading, setCandidateActionsLoading] = useState({});
  const [candidateDiplomaLoading, setCandidateDiplomaLoading] = useState({});
  const [candidateError, setCandidateError] = useState({});

  useEffect(() => {
    let isMounted = true;

    async function loadCourse() {
      try {
        const courses = await fetchCourses();
        const course = (courses || []).find(
          (item) => String(item.id) === String(courseId),
        );

        if (!course) {
          throw new Error("Nie znaleziono wybranego kierunku.");
        }

        if (isMounted) {
          setCourse(course);
          setCourseName(course.name || "");
        }
      } catch (err) {
        if (isMounted) {
          console.error("Błąd podczas ładowania kursu:", err);
        }
      }
    }

    loadCourse();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const loadCandidates = useCallback(async () => {
    try {
      setCandidatesLoading(true);
      setCandidatesError("");

      const data = await fetchCourseCandidates(courseId);
      const candidatesWithDates = Array.isArray(data) ? data : [];

      setCandidates(candidatesWithDates);
    } catch (err) {
      setCandidatesError(err.message || "Nie udało się pobrać kandydatów.");
    } finally {
      setCandidatesLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleVerifyDiploma = async (candidateId, applicationId) => {
    setCandidateError((prev) => ({ ...prev, [candidateId]: "" }));
    try {
      setCandidateActionsLoading((prev) => ({ ...prev, [candidateId]: true }));
      await verifyDiploma(applicationId);
      await loadCandidates();
    } catch (err) {
      setCandidateError((prev) => ({
        ...prev,
        [candidateId]: err.message || "Nie udało się zweryfikować dyplomu.",
      }));
    } finally {
      setCandidateActionsLoading((prev) => ({ ...prev, [candidateId]: false }));
    }
  };

  const handleVerifyDeclaration = async (candidateId, applicationId) => {
    setCandidateError((prev) => ({ ...prev, [candidateId]: "" }));
    try {
      setCandidateActionsLoading((prev) => ({ ...prev, [candidateId]: true }));
      await verifyDeclaration(applicationId);
      await loadCandidates();
    } catch (err) {
      setCandidateError((prev) => ({
        ...prev,
        [candidateId]:
          err.message || "Nie udało się zweryfikować oświadczenia.",
      }));
    } finally {
      setCandidateActionsLoading((prev) => ({ ...prev, [candidateId]: false }));
    }
  };

  const handleAcceptApplication = async (candidateId, applicationId) => {
    setCandidateError((prev) => ({ ...prev, [candidateId]: "" }));
    try {
      setCandidateActionsLoading((prev) => ({ ...prev, [candidateId]: true }));
      await acceptApplication(applicationId);
      await loadCandidates();
    } catch (err) {
      setCandidateError((prev) => ({
        ...prev,
        [candidateId]: err.message || "Nie udało się zaakceptować wniosku.",
      }));
    } finally {
      setCandidateActionsLoading((prev) => ({ ...prev, [candidateId]: false }));
    }
  };

  const handleDiplomaDownload = async (candidateId, applicationId) => {
    setCandidateError((prev) => ({ ...prev, [candidateId]: "" }));
    try {
      setCandidateDiplomaLoading((prev) => ({ ...prev, [candidateId]: true }));
      const response = await getApplicationDiplomaUrl(applicationId);
      const url = response?.url;
      if (!url) {
        throw new Error("Brak linku do dyplomu");
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setCandidateError((prev) => ({
        ...prev,
        [candidateId]: err.message || "Nie udało się pobrać dyplomu.",
      }));
    } finally {
      setCandidateDiplomaLoading((prev) => ({ ...prev, [candidateId]: false }));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const detailsElements = document.querySelectorAll(
        ".candidate-dropdown[open]",
      );
      detailsElements.forEach((details) => {
        if (!details.contains(event.target)) {
          details.removeAttribute("open");
        }
      });
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const sortedCandidates = [...candidates].sort((left, right) => {
    const leftWithdrawn = Boolean(left.isWithdrawn);
    const rightWithdrawn = Boolean(right.isWithdrawn);
    if (leftWithdrawn !== rightWithdrawn) {
      return leftWithdrawn ? 1 : -1;
    }

    const leftAccepted = Boolean(left.isAccepted);
    const rightAccepted = Boolean(right.isAccepted);
    if (leftAccepted !== rightAccepted) {
      return leftAccepted ? -1 : 1;
    }

    const leftSubmissionTime = left.submissionDateTime
      ? new Date(left.submissionDateTime).getTime()
      : Number.POSITIVE_INFINITY;
    const rightSubmissionTime = right.submissionDateTime
      ? new Date(right.submissionDateTime).getTime()
      : Number.POSITIVE_INFINITY;

    if (leftSubmissionTime !== rightSubmissionTime) {
      return leftSubmissionTime - rightSubmissionTime;
    }

    return Number(left.id || 0) - Number(right.id || 0);
  });

  const activeCandidates = sortedCandidates.filter(
    (c) => !c.isWithdrawn && !c.isWaitlisted,
  );
  const waitlistedCandidates = sortedCandidates.filter(
    (c) => !c.isWithdrawn && c.isWaitlisted,
  );
  const withdrawnCandidates = sortedCandidates.filter((c) => c.isWithdrawn);

  const handleExportCsv = () => {
    const acceptedAndPaid = candidates.filter(
      (c) =>
        c.isAccepted === true &&
        !c.isWithdrawn &&
        (c.isEntryFeePaid === true || c.isSemesterPaid === true),
    );

    if (acceptedAndPaid.length === 0) {
      alert(
        "Brak kandydatów spełniających kryteria (zaakceptowany i opłacony).",
      );
      return;
    }

    const headers = [
      "Imię i nazwisko",
      "Data urodzenia",
      "PESEL",
      "Nr telefonu",
      "Email",
      "Data zgłoszenia",
    ];

    const escapeCsv = (str) => {
      if (!str) return "";
      const stringified = String(str);
      if (
        stringified.includes(",") ||
        stringified.includes('"') ||
        stringified.includes("\n")
      ) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    const formatDate = (isoString) => {
      if (!isoString) return "";
      const date = new Date(isoString);
      return date.toLocaleString("pl-PL");
    };

    const formatShortDate = (isoString) => {
      if (!isoString) return "";
      const date = new Date(isoString);
      return date.toLocaleDateString("pl-PL");
    };

    const rows = acceptedAndPaid.map((c) => {
      const fullName = [c.name, c.surname].filter(Boolean).join(" ");
      return [
        escapeCsv(fullName),
        escapeCsv(formatShortDate(c.dateOfBirth)),
        escapeCsv(c.pesel),
        escapeCsv(c.telNumber),
        escapeCsv(c.email),
        escapeCsv(formatDate(c.submissionDateTime)),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `kierunek_${courseId}_przyjeci.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderCandidateCard = (candidate) => {
    const fullName = [candidate.name, candidate.surname]
      .filter(Boolean)
      .join(" ");

    // Statusy aplikacji
    const isWithdrawn = Boolean(candidate.isWithdrawn);
    const isAccepted = Boolean(candidate.isAccepted);
    const isWaitlisted = Boolean(candidate.isWaitlisted);
    const isEntryFeePaid = Boolean(candidate.isEntryFeePaid);
    const isSemesterPaid = Boolean(candidate.isSemesterPaid);
    const isDiplomaVerified = Boolean(candidate.isDiplomaVerified);
    const isDeclarationVerified = Boolean(candidate.isDeclarationVerified);

    let displayStatus = "przesłana";

    if (isWithdrawn) {
      displayStatus = "wycofana";
    } else if (isWaitlisted) {
      displayStatus = "lista rezerwowa";
    } else if (isAccepted) {
      displayStatus = "zaakceptowana";
    }

    return (
      <article key={candidate.id} className="course-candidate-card">
        <div className="course-candidate-main">
          <h3>{fullName || "Kandydat bez danych"}</h3>
          <a href={`mailto:${candidate.email}`}>{candidate.email}</a>
          {candidate.submissionDateTime && (
            <span className="course-candidate-date">
              {new Intl.DateTimeFormat("pl-PL", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(candidate.submissionDateTime))}
            </span>
          )}
        </div>

        <div className="course-candidate-statuses">
          {/* 1. Aplikacja */}
          <span className="course-candidate-status-label">Aplikacja:</span>
          <div>
            <span
              className={`status-badge ${
                isWithdrawn
                  ? "status-badge--withdrawn"
                  : isAccepted
                    ? "status-badge--accepted"
                    : isWaitlisted
                      ? "status-badge--waitlisted"
                      : "status-badge--submitted"
              }`}
            >
              {displayStatus}
            </span>
          </div>

          {/* 2. Dyplom */}
          <span className="course-candidate-status-label">Dyplom:</span>
          <div>
            <span
              className={`status-badge ${
                isDiplomaVerified
                  ? "status-badge--success"
                  : "status-badge--disabled"
              }`}
            >
              {isDiplomaVerified ? "zweryfikowany" : "niezweryfikowany"}
            </span>
          </div>

          {/* 3. Oświadczenie */}
          <span className="course-candidate-status-label">Oświadczenie:</span>
          <div>
            <span
              className={`status-badge ${
                isDeclarationVerified
                  ? "status-badge--success"
                  : "status-badge--disabled"
              }`}
            >
              {isDeclarationVerified ? "zweryfikowane" : "niezweryfikowane"}
            </span>
          </div>

          {/* 4. Wpisowe */}
          <span className="course-candidate-status-label">Wpisowe:</span>
          <div>
            <span
              className={`status-badge ${
                isEntryFeePaid
                  ? "status-badge--success"
                  : "status-badge--disabled"
              }`}
            >
              {isEntryFeePaid ? "opłacone" : "nieopłacone"}
            </span>
          </div>

          {/* 5. Semestr */}
          <span className="course-candidate-status-label">Semestr:</span>
          <div>
            <span
              className={`status-badge ${
                isSemesterPaid
                  ? "status-badge--success"
                  : "status-badge--disabled"
              }`}
            >
              {isSemesterPaid ? "opłacony" : "nieopłacony"}
            </span>
          </div>
        </div>

        <div className="course-candidate-actions">
          {/* Show diploma button */}
          <button
            type="button"
            className="candidate-action-btn candidate-action-btn--secondary"
            onClick={() =>
              handleDiplomaDownload(candidate.id, candidate.applicationId)
            }
            disabled={
              isWithdrawn ||
              !candidate.applicationId ||
              candidateDiplomaLoading[candidate.id]
            }
          >
            {candidateDiplomaLoading[candidate.id]
              ? "Pobieranie..."
              : "Wyświetl dyplom"}
          </button>

          {/* Verify diploma button */}
          <button
            type="button"
            className="candidate-action-btn candidate-action-btn--outline"
            onClick={() =>
              handleVerifyDiploma(candidate.id, candidate.applicationId)
            }
            disabled={
              isDiplomaVerified ||
              isWithdrawn ||
              !candidate.applicationId ||
              candidateActionsLoading[candidate.id]
            }
          >
            {isDiplomaVerified ? "Dyplom zweryfikowany" : "Zweryfikuj dyplom"}
          </button>

          {/* Verify declaration button */}
          <button
            type="button"
            className="candidate-action-btn candidate-action-btn--outline"
            onClick={() =>
              handleVerifyDeclaration(candidate.id, candidate.applicationId)
            }
            disabled={
              !isAccepted ||
              isDeclarationVerified ||
              isWithdrawn ||
              !candidate.applicationId ||
              candidateActionsLoading[candidate.id]
            }
          >
            {isDeclarationVerified
              ? "Oświadczenie zweryfikowane"
              : "Zweryfikuj oświadczenie"}
          </button>

          {/* Accept application button */}
          <button
            type="button"
            className="candidate-action-btn candidate-action-btn--primary"
            onClick={() =>
              handleAcceptApplication(candidate.id, candidate.applicationId)
            }
            disabled={
              isAccepted ||
              isWaitlisted ||
              !isDiplomaVerified ||
              !isEntryFeePaid ||
              isWithdrawn ||
              !candidate.applicationId ||
              candidateActionsLoading[candidate.id]
            }
          >
            {isAccepted
              ? "Wniosek zaakceptowany"
              : isWaitlisted
                ? "Na liście rezerwowej"
                : "Akceptuj wniosek"}
          </button>

          {candidateError[candidate.id] && (
            <div className="candidate-card-error">
              {candidateError[candidate.id]}
            </div>
          )}
        </div>

        <Link
          to={`/coordinator/courses/${courseId}/applications/${candidate.applicationId}/manage`}
          className="candidate-edit-arrow-btn"
          aria-label="Edytuj aplikację"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </Link>
      </article>
    );
  };

  return (
    <section className="course-management-view">
      <BackButton label="Wróć do strony koordynatora" />

      <header className="course-management-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1>Zarządzanie kierunkiem</h1>
            <p
              style={{
                margin: "0.25rem 0",
                fontSize: "1.1rem",
                fontWeight: "500",
                paddingLeft: "15px",
              }}
            >
              Kierunek #{courseId} - {courseName}
            </p>
            {course && (
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-light)",
                  marginTop: "0.25rem",
                  paddingLeft: "15px",
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  <strong>Rok akademicki:</strong>{" "}
                  {course.academicYear
                    ? `${course.academicYear}/${course.academicYear + 1}`
                    : "-"}
                </span>
                <span>
                  <strong>Cena:</strong>{" "}
                  {course.price ? `${course.price} PLN` : "-"}
                </span>
                <span>
                  <strong>Limit miejsc:</strong> {course.placesLimit || "-"}
                </span>
                <span>
                  <strong>Rekrutacja:</strong>{" "}
                  {course.isRecruitmentOpen ? (
                    <span style={{ color: "#16a34a" }}>Otwarta</span>
                  ) : (
                    <span style={{ color: "#dc2626" }}>Zamknięta</span>
                  )}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="candidate-action-btn candidate-action-btn--primary"
            onClick={() => navigate(`/coordinator/courses/${courseId}/edit`)}
          >
            Edytuj kierunek
          </button>
        </div>
      </header>

      <section className="course-candidates-panel">
        <div className="course-candidates-header">
          <div>
            <h2>Kandydaci</h2>
            <p>Lista osób biorących udział w rekrutacji na ten kierunek.</p>
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="primary-btn"
              onClick={handleExportCsv}
            >
              Eksportuj przyjętych (CSV)
            </button>
            <span className="course-candidates-count">
              {activeCandidates.length}
            </span>
          </div>
        </div>

        {candidatesLoading ? (
          <div className="course-management-state">Ładowanie kandydatów...</div>
        ) : candidatesError ? (
          <div className="course-management-state course-management-error">
            {candidatesError}
          </div>
        ) : candidates.length === 0 ? (
          <div className="course-management-state">
            Brak kandydatów zapisanych na ten kierunek.
          </div>
        ) : (
          <>
            {activeCandidates.length > 0 ? (
              <div className="course-candidates-list">
                {activeCandidates.map(renderCandidateCard)}
              </div>
            ) : (
              <div className="course-management-state">
                Brak aktywnych kandydatów.
              </div>
            )}

            {waitlistedCandidates.length > 0 && (
              <>
                <div
                  className="course-candidates-header"
                  style={{ marginTop: "2rem" }}
                >
                  <div>
                    <h2>Lista rezerwowa</h2>
                    <p>Kandydaci na liście rezerwowej.</p>
                  </div>
                  <span className="course-candidates-count">
                    {waitlistedCandidates.length}
                  </span>
                </div>
                <div className="course-candidates-list">
                  {waitlistedCandidates.map(renderCandidateCard)}
                </div>
              </>
            )}

            {withdrawnCandidates.length > 0 && (
              <>
                <div
                  className="course-candidates-header"
                  style={{ marginTop: "2rem" }}
                >
                  <div>
                    <h2>Zrezygnowali</h2>
                    <p>Kandydaci, którzy wycofali się z rekrutacji.</p>
                  </div>
                  <span className="course-candidates-count">
                    {withdrawnCandidates.length}
                  </span>
                </div>
                <div className="course-candidates-list">
                  {withdrawnCandidates.map(renderCandidateCard)}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </section>
  );
}

export default CourseManagementPage;
