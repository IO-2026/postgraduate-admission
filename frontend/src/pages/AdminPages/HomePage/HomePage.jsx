import { Link } from "react-router-dom";
import { API_URL } from "../../../config/api";
import { useEffect, useMemo, useState } from "react";
import {
  fetchCourses,
  updateCourse,
  deleteCourse,
} from "../../../services/courseApi";
import { formatDisplayDate } from "../../../utils/dateFormat";
import { generateValidAcademicYears } from "../../../utils/academicYearUtils";
import { authFetch } from "../../../config/auth";
import "./HomePage.css";
import "../CoursesPage/AdminCoursesPage.css";

const INITIAL_EDIT_FORM_STATE = {
  name: "",
  description: "",
  price: "",
  placesLimit: "",
  academicYear: null,
  recruitmentStart: "",
  recruitmentEnd: "",
  coordinatorEmail: "",
};

function AdminHomePage({ isLoggedIn }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [coordinatorsLoading, setCoordinatorsLoading] = useState(false);
  const [coordinatorsError, setCoordinatorsError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_EDIT_FORM_STATE);
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    loadCourses();
    loadCoordinators();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await fetchCourses();
      setCourses(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCoordinators = async () => {
    try {
      setCoordinatorsLoading(true);
      setCoordinatorsError(null);
      const response = await authFetch(
        `${API_URL}/admin/coordinators-with-courses`,
      );
      if (!response.ok) {
        throw new Error("Nie udalo sie pobrac koordynatorow");
      }
      const data = await response.json();
      setCoordinators(data || []);
    } catch (requestError) {
      setCoordinatorsError(requestError?.message || "Blad podczas pobierania");
    } finally {
      setCoordinatorsLoading(false);
    }
  };

  const coordinatorByEmail = useMemo(() => {
    const map = new Map();
    (coordinators || []).forEach((coordinator) => {
      const email = coordinator?.email
        ? coordinator.email.trim().toLowerCase()
        : "";
      if (email) map.set(email, coordinator.id);
    });
    return map;
  }, [coordinators]);

  const coordinatorEmailById = useMemo(() => {
    const map = new Map();
    (coordinators || []).forEach((coordinator) => {
      if (coordinator?.id == null) return;
      map.set(String(coordinator.id), coordinator?.email || "");
    });
    return map;
  }, [coordinators]);

  useEffect(() => {
    if (!editingId || formData.coordinatorEmail) return;
    const course = (courses || []).find((item) => item.id === editingId);
    if (!course?.coordinatorId) return;
    const email = coordinatorEmailById.get(String(course.coordinatorId)) || "";
    if (!email) return;
    setFormData((prev) => ({ ...prev, coordinatorEmail: email }));
  }, [courses, coordinatorEmailById, editingId, formData.coordinatorEmail]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetEditForm = () => {
    setFormData(INITIAL_EDIT_FORM_STATE);
    setEditingId(null);
    setFormError("");
  };

  const handleEdit = (course) => {
    setFormData({
      name: course.name || "",
      description: course.description || "",
      price: course.price || "",
      placesLimit: course.placesLimit ?? "",
      academicYear: course.academicYear || null,
      recruitmentStart: course.recruitmentStart || "",
      recruitmentEnd: course.recruitmentEnd || "",
      coordinatorEmail:
        coordinatorEmailById.get(String(course.coordinatorId)) || "",
    });
    setEditingId(course.id);
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm("Czy na pewno chcesz usunac ten kierunek?")) return;
    try {
      await deleteCourse(courseId);
      await loadCourses();
      if (editingId === courseId) {
        resetEditForm();
      }
    } catch (requestError) {
      console.error("Error deleting course:", requestError);
      alert("Nie udalo sie usunac kierunku.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editingId) return;
    setFormError("");
    setFormSubmitting(true);

    if (!formData.name || !formData.price || isNaN(formData.price)) {
      setFormError("Wypelnij poprawnie nazwe i cene (musi byc liczba).");
      setFormSubmitting(false);
      return;
    }

    const price = parseFloat(formData.price);
    if (price < 0 || price > 100000) {
      setFormError("Cena musi być między 0 a 100000.");
      setFormSubmitting(false);
      return;
    }

    if (
      !formData.placesLimit ||
      isNaN(formData.placesLimit) ||
      parseInt(formData.placesLimit, 10) < 1
    ) {
      setFormError("Wypelnij poprawnie limit miejsc (minimum 1).");
      setFormSubmitting(false);
      return;
    }

    if (!formData.academicYear) {
      setFormError("Rok akademicki jest wymagany.");
      setFormSubmitting(false);
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
      setFormSubmitting(false);
      return;
    }

    const normalizedEmail = formData.coordinatorEmail
      ? formData.coordinatorEmail.trim().toLowerCase()
      : "";
    const coordinatorId = normalizedEmail
      ? coordinatorByEmail.get(normalizedEmail)
      : null;

    if (normalizedEmail && !coordinatorId) {
      setFormError("Nie znaleziono koordynatora o podanym e-mailu.");
      setFormSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: formData.name,
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
        ...(coordinatorId != null && { coordinatorId }),
      };

      await updateCourse(editingId, payload);
      resetEditForm();
      await loadCourses();
    } catch (requestError) {
      console.error("Error updating course:", requestError);
      setFormError("Wystapil blad podczas zapisywania kierunku.");
    } finally {
      setFormSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <section className="gate-view" aria-label="Brama dostępu dla gościa">
        <div className="guest-panel">
          <p className="guest-tag">Studia podyplomowe AGH</p>
          <h1>Witamy w portalu administratora</h1>
          <p className="guest-subtitle">
            Zaloguj się, aby zarządzać ofertą kierunków studiów podyplomowych i
            koordynatorami.
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
    <section className="admin-home-view" aria-label="Panel administratora">
      <header className="admin-home-header">
        <p className="admin-home-tag">Studia podyplomowe AGH</p>
        <h1>Panel administratora</h1>
        <p className="admin-home-subtitle">
          Zarządzaj ofertą kierunków studiów podyplomowych.
        </p>
      </header>

      {editingId && (
        <div className="course-form-container">
          <h2>Edytuj kierunek</h2>
          <form className="course-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nazwa kierunku</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Cena (PLN)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                onWheel={(e) => e.target.blur()}
                required
              />
            </div>
            <div className="form-group">
              <label>Limit miejsc</label>
              <input
                type="number"
                name="placesLimit"
                min="1"
                step="1"
                value={formData.placesLimit}
                onChange={handleInputChange}
                onWheel={(e) => e.target.blur()}
                required
              />
            </div>
            <div className="form-group">
              <label>Rok akademicki</label>
              <select
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
            <div className="form-group">
              <label>Opis</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Krotki opis programu..."
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Data rozpoczęcia rekrutacji</label>
                <input
                  type="date"
                  name="recruitmentStart"
                  value={formData.recruitmentStart}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Data zakończenia rekrutacji</label>
                <input
                  type="date"
                  name="recruitmentEnd"
                  value={formData.recruitmentEnd}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>E-mail koordynatora</label>
              <select
                name="coordinatorEmail"
                value={formData.coordinatorEmail}
                onChange={handleInputChange}
                disabled={coordinatorsLoading}
              >
                <option value="">-- Brak koordynatora --</option>
                {(coordinators || [])
                  .filter((coordinator) => coordinator?.email)
                  .map((coordinator) => (
                    <option key={coordinator.id} value={coordinator.email}>
                      {coordinator.name
                        ? `${coordinator.name} (${coordinator.email})`
                        : coordinator.email}
                    </option>
                  ))}
              </select>
              {coordinatorsError ? (
                <div className="form-error">{coordinatorsError}</div>
              ) : null}
            </div>

            {formError ? <div className="form-error">{formError}</div> : null}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={resetEditForm}
                disabled={formSubmitting}
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="primary-btn"
                disabled={formSubmitting}
              >
                {formSubmitting ? "Zapisywanie..." : "Zapisz kierunek"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Ladowanie kierunkow...</div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : courses.length === 0 ? (
        <div className="empty-state">Brak dostepnych kierunkow studiow.</div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <div className="course-card-body">
                <div className="course-card-header">
                  <h3>{course.name}</h3>
                  <span className="course-price">{course.price} PLN</span>
                </div>
                <p className="course-description">
                  {course.description || "Brak opisu dla tego programu."}
                </p>
                <div className="course-meta">
                  {course.recruitmentStart && course.recruitmentEnd ? (
                    <span className="meta-tag">
                      Rekrutacja: {formatDisplayDate(course.recruitmentStart)} -{" "}
                      {formatDisplayDate(course.recruitmentEnd)}
                    </span>
                  ) : null}
                  {course.placesLimit != null ? (
                    <span className="meta-tag">
                      Limit miejsc: {course.placesLimit}
                    </span>
                  ) : null}
                  {course.coordinatorId ? (
                    <span className="meta-tag">
                      Koordynator:{" "}
                      {coordinatorEmailById.get(String(course.coordinatorId)) ||
                        "brak danych"}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="course-card-actions">
                <button
                  className="secondary-btn edit-btn"
                  onClick={() => handleEdit(course)}
                >
                  Edytuj
                </button>
                <button
                  className="secondary-btn delete-btn"
                  onClick={() => handleDelete(course.id)}
                >
                  Usuń
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminHomePage;
