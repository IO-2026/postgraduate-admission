import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchCourses, createCourse } from "../../services/courseApi";
import "./CoursesPage.css";

function CoursesPage({ isLoggedIn }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
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
      await createCourse({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
      });
      setFormData({ name: "", description: "", price: "" });
      setIsFormOpen(false);
      await loadCourses();
    } catch (err) {
      setFormError("Wystąpił błąd podczas dodawania kierunku.");
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
          <h2>Nowy kierunek</h2>
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

            {formError && <div className="form-error">{formError}</div>}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setIsFormOpen(false)}
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CoursesPage;
