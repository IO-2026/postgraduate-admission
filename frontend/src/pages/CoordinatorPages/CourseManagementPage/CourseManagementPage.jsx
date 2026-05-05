import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchCourseCandidates,
  fetchCourses,
  updateCourse,
} from "../../../services/courseApi";
import "./CourseManagementPage.css";

const INITIAL_FORM_STATE = {
  id: "",
  name: "",
  description: "",
  price: "",
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
        price: updatedCourse.price ?? "",
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
      <Link className="course-management-back-link" to="/">
        <svg
          className="course-management-back-icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Wróć do strony koordynatora
      </Link>

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

              return (
                <article key={candidate.id} className="course-candidate-card">
                  <div className="course-candidate-main">
                    <h3>{fullName || "Kandydat bez danych"}</h3>
                    <a href={`mailto:${candidate.email}`}>{candidate.email}</a>
                  </div>
                  <div className="course-candidate-meta">
                    <span>{candidate.status || "Brak statusu"}</span>
                    <span
                      className={
                        (candidate.paid ?? candidate.isPaid)
                          ? "course-candidate-paid"
                          : "course-candidate-unpaid"
                      }
                    >
                      {(candidate.paid ?? candidate.isPaid)
                        ? "Opłacone"
                        : "Nieopłacone"}
                    </span>
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
