import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../../services/courseApi";
import { formatDisplayDate } from "../../../utils/dateFormat";
import "./AdminCoursesPage.css";

const INITIAL_FORM_STATE = {
  name: "",
  description: "",
  price: "",
  recruitmentStart: "",
  recruitmentEnd: "",
  coordinatorEmail: "",
};

function getToken() {
  try {
    const savedAuth = localStorage.getItem("pg-admission-auth");
    if (!savedAuth) return null;
    const parsedAuth = JSON.parse(savedAuth);
    return parsedAuth?.token || null;
  } catch {
    return null;
  }
}

function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [coordinatorsLoading, setCoordinatorsLoading] = useState(false);
  const [coordinatorsError, setCoordinatorsError] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCoordinators = async () => {
    try {
      setCoordinatorsLoading(true);
      setCoordinatorsError(null);
      const token = getToken();
      const response = await fetch("/api/admin/coordinators-with-courses", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error("Nie udalo sie pobrac koordynatorow");
      }
      const data = await response.json();
      setCoordinators(data || []);
    } catch (err) {
      setCoordinatorsError(err?.message || "Blad podczas pobierania");
    } finally {
      setCoordinatorsLoading(false);
    }
  };

  const coordinatorByEmail = useMemo(() => {
    const map = new Map();
    (coordinators || []).forEach((coord) => {
      const email = coord?.email ? coord.email.trim().toLowerCase() : "";
      if (email) map.set(email, coord.id);
    });
    return map;
  }, [coordinators]);

  const coordinatorEmailById = useMemo(() => {
    const map = new Map();
    (coordinators || []).forEach((coord) => {
      if (coord?.id == null) return;
      map.set(String(coord.id), coord?.email || "");
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

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setEditingId(null);
    setIsFormOpen(false);
    setFormError("");
  };

  const handleEdit = (course) => {
    setFormData({
      name: course.name || "",
      description: course.description || "",
      price: course.price || "",
      recruitmentStart: course.recruitmentStart || "",
      recruitmentEnd: course.recruitmentEnd || "",
      coordinatorEmail:
        coordinatorEmailById.get(String(course.coordinatorId)) || "",
    });
    setEditingId(course.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Czy na pewno chcesz usunac ten kierunek?")) return;
    try {
      await deleteCourse(id);
      await loadCourses();
    } catch (requestError) {
      console.error("Error deleting course:", requestError);
      alert("Nie udalo sie usunac kierunku.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormSubmitting(true);

    if (!formData.name || !formData.price || isNaN(formData.price)) {
      setFormError(
        "Wypelnij poprawnie nazwe i cene (musi byc liczba).",
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
        ...(formData.recruitmentStart && {
          recruitmentStart: formData.recruitmentStart,
        }),
        ...(formData.recruitmentEnd && {
          recruitmentEnd: formData.recruitmentEnd,
        }),
        ...(coordinatorId != null && { coordinatorId }),
      };

      if (editingId) {
        await updateCourse(editingId, payload);
      } else {
        await createCourse(payload);
      }

      resetForm();
      await loadCourses();
    } catch (requestError) {
      console.error("Error saving course:", requestError);
      setFormError("Wystapil blad podczas zapisywania kierunku.");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <section className="courses-view">
      <div className="courses-top-actions">
        <Link className="ghost-link courses-back-link" to="/">
          <svg
            className="courses-back-icon"
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
          Wróć do strony głównej
        </Link>
        {!isFormOpen && (
          <button
            className="primary-btn add-course-btn add-course-btn--top"
            onClick={() => setIsFormOpen(true)}
          >
            + Dodaj kierunek
          </button>
        )}
      </div>
      <header className="courses-header">
        <p className="courses-tag">Studia podyplomowe AGH</p>
        <h1>Kierunki studiów</h1>
        <p className="courses-subtitle">
          Zarządzaj ofertą kierunków studiów podyplomowych oraz harmonogramem
          rekrutacji.
        </p>
      </header>

      {isFormOpen && (
        <div className="course-form-container">
          <h2>{editingId ? "Edytuj kierunek" : "Nowy kierunek"}</h2>
          <form className="course-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nazwa kierunku</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="np. Zarzadzanie projektami IT"
              />
            </div>
            <div className="form-group">
              <label>Cena (PLN)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                placeholder="np. 4500"
              />
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
                  .filter((coord) => coord?.email)
                  .map((coord) => (
                    <option key={coord.id} value={coord.email}>
                      {coord.name ? `${coord.name} (${coord.email})` : coord.email}
                    </option>
                  ))}
              </select>
              {coordinatorsError ? (
                <div className="form-error">{coordinatorsError}</div>
              ) : null}
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={resetForm}
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
                  {course.recruitmentStart && course.recruitmentEnd && (
                    <span className="meta-tag">
                      Rekrutacja: {formatDisplayDate(course.recruitmentStart)} -{" "}
                      {formatDisplayDate(course.recruitmentEnd)}
                    </span>
                  )}
                  {course.coordinatorId ? (
                    <span className="meta-tag">
                      Koordynator: {" "}
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

export default AdminCoursesPage;
