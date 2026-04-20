import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../services/courseApi";
import "./CoursesPage.css";

function CoursesPage({ isLoggedIn }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    recruitmentStart: "",
    recruitmentEnd: "",
    coordinatorId: "1",
  });
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    loadCourses();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      recruitmentStart: "",
      recruitmentEnd: "",
      coordinatorId: "1",
    });
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
      coordinatorId: course.coordinatorId || "1",
    });
    setEditingId(course.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Czy na pewno chcesz usunąć ten kierunek?")) return;
    try {
      await deleteCourse(id);
      await loadCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Nie udało się usunąć kierunku.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSubmitting(true);

    if (!formData.name || !formData.price || isNaN(formData.price)) {
      setFormError("Wypełnij poprawnie nazwę i cenę (musi być liczbą).");
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
        ...(formData.coordinatorId && {
          coordinatorId: parseInt(formData.coordinatorId, 10),
        }),
      };

      if (editingId) {
        await updateCourse(editingId, payload);
      } else {
        await createCourse(payload);
      }

      resetForm();
      await loadCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      setFormError("Wystąpił błąd podczas zapisywania kierunku.");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <section className="courses-view">
      <header className="courses-header">
        <Link className="back-link" to="/">
          &larr; Wróć do strony głównej
        </Link>
        <h1>Kierunki studiów</h1>
        <p className="courses-subtitle">
          Zapoznaj się z naszą autorską ofertą studiów podyplomowych. Wybieraj
          spośród innowacyjnych programów edukacyjnych dopasowanych do rynku
          pracy.
        </p>

        {isLoggedIn && !isFormOpen && (
          <button
            className="primary-btn add-course-btn"
            onClick={() => setIsFormOpen(true)}
          >
            + Dodaj nowy kierunek
          </button>
        )}
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
                placeholder="np. Zarządzanie projektami IT"
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
                placeholder="Krótki opis programu..."
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
              <label>ID Koordynatora</label>
              <input
                type="number"
                name="coordinatorId"
                value={formData.coordinatorId}
                onChange={handleInputChange}
                placeholder="np. 1"
              />
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
        <div className="loading-state">Ładowanie kierunków...</div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : courses.length === 0 ? (
        <div className="empty-state">Brak dostępnych kierunków studiów.</div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
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
                    Rekrutacja: {course.recruitmentStart} -{" "}
                    {course.recruitmentEnd}
                  </span>
                )}
                {course.coordinatorId && (
                  <span className="meta-tag">
                    Koordynator ID: {course.coordinatorId}
                  </span>
                )}
              </div>
              {isLoggedIn && (
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
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CoursesPage;
