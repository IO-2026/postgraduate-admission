import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchCourseCandidates,
  fetchCourses,
  updateCourse,
  closeCourseRecruitment,
} from "../../../services/courseApi";
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
  isRecruitmentOpen: true,
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
  const [isClosing, setIsClosing] = useState(false);

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
            isRecruitmentOpen: course.isRecruitmentOpen ?? true,
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
        if (isMounted) {
          setCandidates(Array.isArray(data) ? data : []);
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
        isRecruitmentOpen:
          updatedCourse.isRecruitmentOpen ?? prev.isRecruitmentOpen,
      }));
      setSuccessMessage("Zapisano zmiany kierunku.");
    } catch (err) {
      setFormError(err.message || "Nie udało się zapisać zmian.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const acceptedAndPaid = candidates.filter(
      (c) => c.isAccepted === true && !c.isWithdrawn && (c.isEntryFeePaid === true || c.isSemesterPaid === true),
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

  const handleCloseRecruitment = async () => {
    if (
      !window.confirm(
        "Czy na pewno chcesz zamknąć rekrutację na ten kierunek? Kandydaci stracą możliwość aplikowania.",
      )
    ) {
      return;
    }

    try {
      setIsClosing(true);
      setFormError("");
      setSuccessMessage("");

      await closeCourseRecruitment(courseId);

      setFormData((prev) => ({ ...prev, isRecruitmentOpen: false }));
      setSuccessMessage("Rekrutacja została pomyślnie zamknięta.");
    } catch (err) {
      setFormError(
        err.message || "Wystąpił błąd podczas zamykania rekrutacji.",
      );
    } finally {
      setIsClosing(false);
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

          <div
            className="course-management-actions"
            style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}
          >
            {formData.isRecruitmentOpen ? (
              <button
                type="button"
                className="course-management-submit"
                style={{ backgroundColor: "#e11d48", borderColor: "#e11d48" }}
                onClick={handleCloseRecruitment}
                disabled={isClosing || submitting}
              >
                {isClosing ? "Zamykanie..." : "Zamknij rekrutację"}
              </button>
            ) : (
              <span
                style={{
                  color: "#e11d48",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Rekrutacja zamknięta
              </span>
            )}

            <button
              type="submit"
              className="course-management-submit"
              disabled={submitting || isClosing}
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
            <span className="course-candidates-count">{candidates.length}</span>
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
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isFullyAccepted
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
                    {isFullyAccepted ? (
                      <>
                        <span style={{ color: "#6b7280", textAlign: "right" }}>
                          Aplikacja:
                        </span>
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
                        <span style={{ color: "#6b7280", textAlign: "right" }}>
                          Aplikacja:
                        </span>
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
                            <span
                              style={{ color: "#6b7280", textAlign: "right" }}
                            >
                              Dyplom:
                            </span>
                            <div>
                              <span
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: isDiplomaVerified
                                    ? "#16a34a20"
                                    : "#eab30820",
                                  color: isDiplomaVerified
                                    ? "#16a34a"
                                    : "#eab308",
                                  display: "inline-block",
                                }}
                              >
                                {isDiplomaVerified
                                  ? "zweryfikowany"
                                  : "w trakcie weryfikacji"}
                              </span>
                            </div>
                          </>
                        )}

                        {isAccepted && !isWithdrawn && (
                          <>
                            <span
                              style={{ color: "#6b7280", textAlign: "right" }}
                            >
                              Oświadczenie:
                            </span>
                            <div>
                              <span
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: isDeclarationVerified
                                    ? "#16a34a20"
                                    : "#eab30820",
                                  color: isDeclarationVerified
                                    ? "#16a34a"
                                    : "#eab308",
                                  display: "inline-block",
                                }}
                              >
                                {isDeclarationVerified
                                  ? "zweryfikowane"
                                  : "w trakcie weryfikacji"}
                              </span>
                            </div>
                          </>
                        )}

                        {isEntryFeePaid && !isWithdrawn && (
                          <>
                            <span
                              style={{ color: "#6b7280", textAlign: "right" }}
                            >
                              Wpisowe:
                            </span>
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
                            <span
                              style={{ color: "#6b7280", textAlign: "right" }}
                            >
                              Semestr:
                            </span>
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

                  <div className="course-candidate-actions">
                    <Link
                      to={`/coordinator/courses/${courseId}/applications/${candidate.applicationId}/manage`}
                      className="candidate-edit-application"
                    >
                      Edytuj aplikację
                    </Link>
                  </div>
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
