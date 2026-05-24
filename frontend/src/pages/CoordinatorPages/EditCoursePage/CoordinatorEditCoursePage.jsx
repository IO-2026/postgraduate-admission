import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchCourses,
  updateCourse,
  closeCourseRecruitment,
} from "../../../services/courseApi";
import { generateValidAcademicYears } from "../../../utils/academicYearUtils";
import BackButton from "../../../components/BackButton/BackButton";
import "./CoordinatorEditCoursePage.css";

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

function CoordinatorEditCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
      setTimeout(() => {
        navigate(`/coordinator/courses/${courseId}/manage`);
      }, 1500);
    } catch (err) {
      setFormError(err.message || "Nie udało się zapisać zmian.");
    } finally {
      setSubmitting(false);
    }
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
      <BackButton
        label="Wróć do zarządzania kierunkiem"
        to={`/coordinator/courses/${courseId}/manage`}
      />

      <header className="course-management-header">
        <h1>Edycja kierunku</h1>
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
    </section>
  );
}

export default CoordinatorEditCoursePage;
