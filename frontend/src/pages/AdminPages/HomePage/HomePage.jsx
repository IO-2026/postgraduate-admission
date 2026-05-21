import { Link } from "react-router-dom";
import { API_URL } from "../../../config/api";
import { useEffect, useMemo, useState } from "react";
import { fetchCourses, deleteCourse } from "../../../services/courseApi";
import { formatDisplayDate } from "../../../utils/dateFormat";
import { authFetch } from "../../../config/auth";
import "./HomePage.css";
import "../CoursesPage/AdminCoursesPage.css";

function AdminHomePage({ isLoggedIn }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [coordinatorsLoading, setCoordinatorsLoading] = useState(false);
  const [coordinatorsError, setCoordinatorsError] = useState(null);

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

  useEffect(() => {
    loadCourses();
    loadCoordinators();
  }, []);

  const coordinatorEmailById = useMemo(() => {
    const map = new Map();
    (coordinators || []).forEach((coordinator) => {
      if (coordinator?.id == null) return;
      map.set(String(coordinator.id), coordinator?.email || "");
    });
    return map;
  }, [coordinators]);

  const handleDelete = async (courseId) => {
    if (!window.confirm("Czy na pewno chcesz usunac ten kierunek?")) return;
    try {
      await deleteCourse(courseId);
      await loadCourses();
    } catch (requestError) {
      console.error("Error deleting course:", requestError);
      alert("Nie udalo sie usunac kierunku.");
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
                </div>
                <p className="course-description">
                  {course.description || "Brak opisu dla tego programu."}
                </p>
                <div className="course-meta">
                  {course.isRecruitmentOpen === false ? (
                    <span
                      className="meta-tag"
                      style={{ color: "#e11d48", fontWeight: "bold" }}
                    >
                      Rekrutacja: zamknięta
                    </span>
                  ) : course.recruitmentStart && course.recruitmentEnd ? (
                    <span className="meta-tag">
                      Rekrutacja: {formatDisplayDate(course.recruitmentStart)} -{" "}
                      {formatDisplayDate(course.recruitmentEnd)}
                    </span>
                  ) : (
                    <span className="meta-tag">
                      Termin rekrutacji nie został podany.
                    </span>
                  )}
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
                <span className="course-price" style={{ textAlign: "center" }}>
                  {course.price} PLN
                </span>
                <Link
                  className="secondary-btn edit-btn"
                  to={`/admin/courses/${course.id}/edit`}
                >
                  Edytuj
                </Link>
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
