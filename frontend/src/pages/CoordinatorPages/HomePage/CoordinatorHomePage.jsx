import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCoursesOfCoordinator } from "../../../services/courseApi";
import { formatDisplayDate } from "../../../utils/dateFormat";
import "./CoordinatorHomePage.css";

function CoordinatorHomePage({ user }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const coordinatorId = user?.id;

  useEffect(() => {
    if (!coordinatorId) {
      setCourses([]);
      setError("Nie udało się ustalić identyfikatora koordynatora.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadCoordinatorCourses() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchCoursesOfCoordinator(coordinatorId);
        if (isMounted) {
          setCourses(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Nie udało się pobrać kierunków.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCoordinatorCourses();

    return () => {
      isMounted = false;
    };
  }, [coordinatorId]);

  return (
    <section className="coordinator-home-view">
      <header className="coordinator-home-header">
        <h1>Strona koordynatora</h1>
        <p>Twoje kierunki studiów podyplomowych.</p>
      </header>

      {loading ? (
        <div className="coordinator-state">Ładowanie kierunków...</div>
      ) : error ? (
        <div className="coordinator-state coordinator-state-error">{error}</div>
      ) : courses.length === 0 ? (
        <div className="coordinator-state">
          Nie przypisano jeszcze żadnych kierunków.
        </div>
      ) : (
        <div className="coordinator-courses-grid">
          {courses.map((course) => (
            <article key={course.id} className="coordinator-course-card">
              <div className="coordinator-course-main">
                <div className="coordinator-course-card-header">
                  <h2>{course.name}</h2>
                </div>
                <p className="coordinator-course-description">
                  {course.description || "Brak opisu dla tego programu."}
                </p>
                <div className="coordinator-course-meta">
                  {course.recruitmentStart && course.recruitmentEnd ? (
                    <span>
                      Rekrutacja: {formatDisplayDate(course.recruitmentStart)} -{" "}
                      {formatDisplayDate(course.recruitmentEnd)}
                    </span>
                  ) : (
                    <span>Termin rekrutacji nie został podany.</span>
                  )}
                </div>
              </div>
              <div className="coordinator-course-side">
                {course.price != null && (
                  <span className="coordinator-course-price">
                    {course.price} PLN
                  </span>
                )}
                <Link
                  className="coordinator-manage-link"
                  to={`/coordinator/courses/${course.id}/manage`}
                >
                  Zarządzaj
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default CoordinatorHomePage;
