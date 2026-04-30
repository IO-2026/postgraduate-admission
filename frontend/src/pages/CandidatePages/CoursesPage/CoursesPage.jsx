import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchCourses } from "../../../services/courseApi";
import { formatDisplayDate } from "../../../utils/dateFormat";
import "./CoursesPage.css";

const AUTH_STORAGE_KEY = "pg-admission-auth";

function getAuthToken() {
  try {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!savedAuth) return null;
    const parsedAuth = JSON.parse(savedAuth);
    return parsedAuth?.token || null;
  } catch {
    return null;
  }
}

function getCoordinatorDetails(course) {
  const coordinator = course.coordinator || {};
  const firstName =
    coordinator.firstName || coordinator.name || course.coordinatorFirstName;
  const lastName =
    coordinator.lastName || coordinator.surname || course.coordinatorLastName;
  const fullName =
    course.coordinatorName ||
    [firstName, lastName].filter(Boolean).join(" ").trim();
  const email =
    course.coordinatorEmail || coordinator.email || course.coordinatorMail;

  return {
    name: fullName,
    email,
  };
}

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = getAuthToken();

  const { data: coordinators = [] } = useQuery(
    ["coordinatorsWithCourses", token],
    async () => {
      const response = await fetch("/api/admin/coordinators-with-courses", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error("Nie udało się pobrać koordynatorów");
      }
      return response.json();
    },
    {
      enabled: Boolean(token),
      retry: false,
      staleTime: 1000 * 60 * 5,
    },
  );

  const coordinatorByCourseId = new Map();
  coordinators.forEach((coordinator) => {
    (coordinator.courses || []).forEach((course) => {
      coordinatorByCourseId.set(String(course.id), {
        name: coordinator.name,
        email: coordinator.email,
      });
    });
  });

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
          {courses.map((course) => {
            const courseCoordinator = getCoordinatorDetails(course);
            const assignedCoordinator =
              coordinatorByCourseId.get(String(course.id)) || {};
            const coordinator = {
              name: courseCoordinator.name || assignedCoordinator.name,
              email: courseCoordinator.email || assignedCoordinator.email,
            };
            const hasCoordinator =
              Boolean(coordinator.name) || Boolean(coordinator.email);

            return (
              <div key={course.id} className="course-card">
                <div className="course-card-body">
                  <div className="course-card-header">
                    <div className="course-card-main">
                      <h3>{course.name}</h3>
                      <p className="course-description">
                        {course.description || "Brak opisu dla tego programu."}
                      </p>
                      <div className="course-meta">
                        {course.recruitmentStart && course.recruitmentEnd && (
                          <span className="meta-tag">
                            Rekrutacja:{" "}
                            {formatDisplayDate(course.recruitmentStart)} -{" "}
                            {formatDisplayDate(course.recruitmentEnd)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="course-card-side">
                      <span className="course-price">{course.price} PLN</span>
                      {hasCoordinator && (
                        <div className="course-coordinator">
                          <span className="course-coordinator-label">
                            Koordynator
                          </span>
                          {coordinator.name && (
                            <span className="course-coordinator-name">
                              {coordinator.name}
                            </span>
                          )}
                          {coordinator.email && (
                            <a
                              className="course-coordinator-email"
                              href={`mailto:${coordinator.email}`}
                            >
                              {coordinator.email}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CoursesPage;
