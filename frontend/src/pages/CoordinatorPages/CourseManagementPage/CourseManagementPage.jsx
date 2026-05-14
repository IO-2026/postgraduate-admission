import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchCourseCandidates,
  fetchCourses,
  updateCourse,
} from "../../../services/courseApi";
import { generateValidAcademicYears } from "../../../utils/academicYearUtils";
import BackButton from "../../../components/BackButton/BackButton";
import "./CourseManagementPage.css";

const INITIAL_FORM_STATE = {
  id: "",
  name: "",
  description: "",
  price: "",
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

              // Określenie głównego statusu
              let mainStatus = "W trakcie weryfikacji";
              if (isWithdrawn) {
                mainStatus = "Wycofana";
              } else if (isAccepted) {
                mainStatus = "Zaakceptowana";
              }

              // Określenie statusu płatności (priorytet: semestr > wpisowe)
              let paymentStatus = "Nieopłacone";
              let paymentClass = "course-candidate-unpaid";
              if (isSemesterPaid) {
                paymentStatus = "Semestr opłacony";
                paymentClass = "course-candidate-paid";
              } else if (isEntryFeePaid) {
                paymentStatus = "Wpisowe opłacone";
                paymentClass = "course-candidate-paid";
              }

              return (
                <article key={candidate.id} className="course-candidate-card">
                  <div className="course-candidate-main">
                    <h3>{fullName || "Kandydat bez danych"}</h3>
                    <a href={`mailto:${candidate.email}`}>{candidate.email}</a>

                    {/* Dodatkowe informacje o statusie */}
                    <div
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          background: isWithdrawn
                            ? "rgba(225, 29, 72, 0.1)"
                            : isAccepted
                              ? "rgba(22, 163, 74, 0.1)"
                              : "rgba(234, 179, 8, 0.1)",
                          color: isWithdrawn
                            ? "#e11d48"
                            : isAccepted
                              ? "#16a34a"
                              : "#eab308",
                        }}
                      >
                        {mainStatus}
                      </span>

                      {!isWithdrawn && (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: "#f3f4f6",
                            color: isDiplomaVerified ? "#16a34a" : "#6b7280",
                          }}
                        >
                          Dyplom:{" "}
                          {isDiplomaVerified
                            ? "✓ Zweryfikowany"
                            : "Weryfikacja..."}
                        </span>
                      )}

                      {isAccepted && !isWithdrawn && (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: "#f3f4f6",
                            color: isDeclarationVerified
                              ? "#16a34a"
                              : "#6b7280",
                          }}
                        >
                          Oświadczenie:{" "}
                          {isDeclarationVerified
                            ? "✓ Zweryfikowane"
                            : "Weryfikacja..."}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="course-candidate-meta">
                    <span>{mainStatus}</span>
                    <span className={paymentClass}>{paymentStatus}</span>
                    {isEntryFeePaid &&
                      !isSemesterPaid &&
                      !isWithdrawn &&
                      isAccepted && (
                        <span
                          style={{
                            borderRadius: "999px",
                            background: "rgba(251, 146, 60, 0.2)",
                            padding: "8px 12px",
                            color: "#9a3412",
                            fontSize: "0.9rem",
                            fontWeight: "600",
                          }}
                        >
                          Oczekuje na opłatę semestru
                        </span>
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
