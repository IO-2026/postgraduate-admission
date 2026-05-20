import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchCourseCandidates,
  fetchCourses,
  updateCourse,
} from "../../../services/courseApi";
import {
  getApplication,
  verifyDiploma,
  verifyDeclaration,
  acceptApplication,
  getApplicationDiplomaUrl,
} from "../../../services/applicationApi";
import { generateValidAcademicYears } from "../../../utils/academicYearUtils";
import BackButton from "../../../components/BackButton/BackButton";
import "./CourseManagementPage.css";

const INITIAL_FORM_STATE = {
  id: "",
  name: "",
  description: "",
  price: "",
  placesLimit: "",
  academicYear: null,
  recruitmentStart: "",
  recruitmentEnd: "",
  coordinatorId: "",
  coordinatorName: "",
  coordinatorEmail: "",
};

function CourseManagementPage() {
  const { courseId } = useParams();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidatesError, setCandidatesError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCourse() {
      try {
        setLoading(true);
        setError("");
        const courses = await fetchCourses();
        const course = (courses || []).find(
          (item) => String(item.id) === String(courseId),
        );

        if (!course) {
          throw new Error("Nie znaleziono wybranego kierunku.");
        }

        if (isMounted) {
          setFormData({
            id: course.id ?? "",
            name: course.name || "",
            description: course.description || "",
            price: course.price ?? "",
            placesLimit: course.placesLimit ?? "",
            academicYear: course.academicYear || null,
            recruitmentStart: course.recruitmentStart || "",
            recruitmentEnd: course.recruitmentEnd || "",
            coordinatorId: course.coordinatorId ?? "",
            coordinatorName: course.coordinatorName || "",
            coordinatorEmail: course.coordinatorEmail || "",
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Nie udało się pobrać danych kierunku.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCourse();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  useEffect(() => {
    let isMounted = true;

    async function loadCandidates() {
      try {
        setCandidatesLoading(true);
        setCandidatesError("");
        const data = await fetchCourseCandidates(courseId);
        if (isMounted && Array.isArray(data)) {
          const candidatesWithDates = await Promise.all(
            data.map(async (candidate) => {
              try {
                if (candidate.applicationId) {
                  const appData = await getApplication(candidate.applicationId);
                  return {
                    ...candidate,
                    submissionDateTime: appData.submissionDateTime || null,
                  };
                }
              } catch (e) {
                console.error("Error fetching application details for candidate", candidate.id, e);
              }
              return candidate;
            })
          );
          setCandidates(candidatesWithDates);
        } else if (isMounted) {
          setCandidates([]);
        }
      } catch (err) {
        if (isMounted) {
          setCandidatesError(err.message || "Nie udało się pobrać kandydatów.");
        }
      } finally {
        if (isMounted) {
          setCandidatesLoading(false);
        }
      }
    }

    loadCandidates();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const [candidateActionsLoading, setCandidateActionsLoading] = useState({});
  const [candidateDiplomaLoading, setCandidateDiplomaLoading] = useState({});
  const [candidateError, setCandidateError] = useState({});

  const handleVerifyDiploma = async (candidateId, applicationId) => {
    setCandidateError((prev) => ({ ...prev, [candidateId]: "" }));
    try {
      setCandidateActionsLoading((prev) => ({ ...prev, [candidateId]: true }));
      await verifyDiploma(applicationId);
      setCandidates((prevCandidates) =>
        prevCandidates.map((c) =>
          c.id === candidateId ? { ...c, isDiplomaVerified: true } : c
        )
      );
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
      setCandidates((prevCandidates) =>
        prevCandidates.map((c) =>
          c.id === candidateId ? { ...c, isDeclarationVerified: true } : c
        )
      );
    } catch (err) {
      setCandidateError((prev) => ({
        ...prev,
        [candidateId]: err.message || "Nie udało się zweryfikować oświadczenia.",
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
      setCandidates((prevCandidates) =>
        prevCandidates.map((c) =>
          c.id === candidateId ? { ...c, isAccepted: true } : c
        )
      );
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

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!formData.name.trim()) {
      setFormError("Podaj nazwę kierunku.");
      return;
    }

    if (formData.price === "" || Number.isNaN(Number(formData.price))) {
      setFormError("Podaj poprawną cenę.");
      return;
    }

    if (
      formData.placesLimit === "" ||
      Number.isNaN(Number(formData.placesLimit)) ||
      Number(formData.placesLimit) < 1
    ) {
      setFormError("Limit miejsc jest wymagany i musi wynosić co najmniej 1.");
      return;
    }

    if (!formData.academicYear) {
      setFormError("Rok akademicki jest wymagany.");
      return;
    }

    const price = parseFloat(formData.price);
    if (price < 0 || price > 100000) {
      setFormError("Cena musi być między 0 a 100000.");
      return;
    }

    if (
      formData.recruitmentStart &&
      formData.recruitmentEnd &&
      formData.recruitmentStart > formData.recruitmentEnd
    ) {
      setFormError(
        "Data rozpoczęcia rekrutacji nie może być późniejsza od daty zakończenia.",
      );
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description,
        price: parseFloat(formData.price),
        placesLimit: parseInt(formData.placesLimit, 10),
        ...(formData.academicYear && {
          academicYear: parseInt(formData.academicYear, 10),
        }),
        ...(formData.recruitmentStart && {
          recruitmentStart: formData.recruitmentStart,
        }),
        ...(formData.recruitmentEnd && {
          recruitmentEnd: formData.recruitmentEnd,
        }),
        ...(formData.coordinatorId !== "" && {
          coordinatorId: Number(formData.coordinatorId),
        }),
      };

      const updatedCourse = await updateCourse(courseId, payload);
      setFormData((prev) => ({
        ...prev,
        id: updatedCourse.id ?? prev.id,
        name: updatedCourse.name || "",
        description: updatedCourse.description || "",
        price: updatedCourse.price ?? prev.price,
        placesLimit: updatedCourse.placesLimit ?? prev.placesLimit,
        academicYear: updatedCourse.academicYear || null,
        recruitmentStart: updatedCourse.recruitmentStart || "",
        recruitmentEnd: updatedCourse.recruitmentEnd || "",
        coordinatorId: updatedCourse.coordinatorId ?? prev.coordinatorId,
        coordinatorName: updatedCourse.coordinatorName || prev.coordinatorName,
        coordinatorEmail:
          updatedCourse.coordinatorEmail || prev.coordinatorEmail,
      }));
      setSuccessMessage("Zapisano zmiany kierunku.");
    } catch (err) {
      setFormError(err.message || "Nie udało się zapisać zmian.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="course-management-view">
      <BackButton label="Wróć do strony koordynatora" />

      <header className="course-management-header">
        <h1>Zarządzanie kierunkiem</h1>
        <p>Kierunek #{courseId}</p>
      </header>

      {loading ? (
        <div className="course-management-state">
          Ładowanie danych kierunku...
        </div>
      ) : error ? (
        <div className="course-management-state course-management-error">
          {error}
        </div>
      ) : (
        <form className="course-management-form" onSubmit={handleSubmit}>
          <div className="course-management-form-grid">
            <div className="course-management-field">
              <label htmlFor="course-id">ID kierunku</label>
              <input id="course-id" value={formData.id} disabled />
            </div>

            <div className="course-management-field">
              <label htmlFor="course-coordinator-id">ID koordynatora</label>
              <input
                id="course-coordinator-id"
                value={formData.coordinatorId || "Brak danych"}
                disabled
              />
            </div>

            <div className="course-management-field course-management-field-wide">
              <label htmlFor="course-name">Nazwa kierunku</label>
              <input
                id="course-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="course-management-field">
              <label htmlFor="course-price">Cena (PLN)</label>
              <input
                id="course-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                onWheel={(e) => e.target.blur()}
                required
              />
            </div>

            <div className="course-management-field">
              <label htmlFor="course-places-limit">Limit miejsc</label>
              <input
                id="course-places-limit"
                name="placesLimit"
                type="number"
                min="1"
                step="1"
                value={formData.placesLimit}
                onChange={handleInputChange}
                onWheel={(e) => e.target.blur()}
                required
              />
            </div>

            <div className="course-management-field">
              <label htmlFor="course-academic-year">Rok akademicki</label>
              <select
                id="course-academic-year"
                name="academicYear"
                value={formData.academicYear || ""}
                onChange={handleInputChange}
              >
                <option value="">Wybierz rok akademicki</option>
                {generateValidAcademicYears().map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="course-management-field">
              <label htmlFor="course-recruitment-start">
                Data rozpoczęcia rekrutacji
              </label>
              <input
                id="course-recruitment-start"
                name="recruitmentStart"
                type="date"
                value={formData.recruitmentStart}
                onChange={handleInputChange}
              />
            </div>

            <div className="course-management-field">
              <label htmlFor="course-recruitment-end">
                Data zakończenia rekrutacji
              </label>
              <input
                id="course-recruitment-end"
                name="recruitmentEnd"
                type="date"
                value={formData.recruitmentEnd}
                onChange={handleInputChange}
              />
            </div>

            <div className="course-management-field course-management-field-wide">
              <label htmlFor="course-description">Opis</label>
              <textarea
                id="course-description"
                name="description"
                rows="6"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {formError ? (
            <div className="course-management-message course-management-error">
              {formError}
            </div>
          ) : null}
          {successMessage ? (
            <div className="course-management-message course-management-success">
              {successMessage}
            </div>
          ) : null}

          <div className="course-management-actions">
            <button
              type="submit"
              className="course-management-submit"
              disabled={submitting}
            >
              {submitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </button>
          </div>
        </form>
      )}

      <section className="course-candidates-panel">
        <div className="course-candidates-header">
          <div>
            <h2>Kandydaci</h2>
            <p>Lista osób zapisanych na ten kierunek.</p>
          </div>
          <span className="course-candidates-count">{candidates.length}</span>
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
          <div className="course-candidates-list">
            {candidates.map((candidate) => {
              const fullName = [candidate.name, candidate.surname]
                .filter(Boolean)
                .join(" ");

              // Statusy aplikacji
              const isWithdrawn = Boolean(candidate.isWithdrawn);
              const isAccepted = Boolean(candidate.isAccepted);
              const isEntryFeePaid = Boolean(candidate.isEntryFeePaid);
              const isSemesterPaid = Boolean(candidate.isSemesterPaid);
              const isDiplomaVerified = Boolean(candidate.isDiplomaVerified);
              const isDeclarationVerified = Boolean(
                candidate.isDeclarationVerified,
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

              const isFullyAccepted =
                !isWithdrawn &&
                isAccepted &&
                isDiplomaVerified &&
                isDeclarationVerified &&
                isEntryFeePaid &&
                isSemesterPaid;

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
                          isDiplomaVerified ? "status-badge--success" : "status-badge--disabled"
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
                          isDeclarationVerified ? "status-badge--success" : "status-badge--disabled"
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
                          isEntryFeePaid ? "status-badge--success" : "status-badge--disabled"
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
                          isSemesterPaid ? "status-badge--success" : "status-badge--disabled"
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
                      disabled={isWithdrawn || !candidate.applicationId || candidateDiplomaLoading[candidate.id]}
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
                      {isDeclarationVerified ? "Oświadczenie zweryfikowane" : "Zweryfikuj oświadczenie"}
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
                        !isDiplomaVerified ||
                        !isEntryFeePaid ||
                        isWithdrawn ||
                        !candidate.applicationId ||
                        candidateActionsLoading[candidate.id]
                      }
                    >
                      {isAccepted ? "Wniosek zaakceptowany" : "Akceptuj wniosek"}
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
            })}
          </div>
        )}
      </section>
    </section>
  );
}

export default CourseManagementPage;
