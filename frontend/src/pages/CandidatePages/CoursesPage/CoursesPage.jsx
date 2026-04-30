import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCourses } from "../../../services/courseApi";
import "./CoursesPage.css";

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      </div>
      <header className="courses-header">
        <p className="courses-tag">Studia podyplomowe AGH</p>
        <h1>Kierunki studiów</h1>
        <p className="courses-subtitle">
          Zapoznaj się z naszą autorską ofertą studiów podyplomowych. Wybieraj
          spośród innowacyjnych programów edukacyjnych dopasowanych do rynku
          pracy.
        </p>

      </header>

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
                      Rekrutacja: {course.recruitmentStart} -{" "}
                      {course.recruitmentEnd}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CoursesPage;
