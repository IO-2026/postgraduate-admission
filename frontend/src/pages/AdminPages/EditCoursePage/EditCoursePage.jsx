import { API_URL } from "../../../config/api";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCourseById, updateCourse } from "../../../services/courseApi";
import { generateValidAcademicYears } from "../../../utils/academicYearUtils";
import { authFetch } from "../../../config/auth";
import BackButton from "../../../components/BackButton/BackButton";
import "../HomePage/HomePage.css";
import "../CoursesPage/AdminCoursesPage.css";
import "./EditCoursePage.css";

const INITIAL_FORM_STATE = {
  name: "",
  description: "",
  price: "",
  placesLimit: "",
  academicYear: null,
  recruitmentStart: "",
  recruitmentEnd: "",
  coordinatorEmail: "",
  isRecruitmentOpen: true,
};

function EditCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState(null);

  const [coordinators, setCoordinators] = useState([]);
  const [coordinatorsLoading, setCoordinatorsLoading] = useState(false);
  const [coordinatorsError, setCoordinatorsError] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [courseCoordinatorId, setCourseCoordinatorId] = useState(null);

  useEffect(() => {
    loadCoordinators();
    loadCourseDetails();
  }, [courseId]);

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

  const loadCourseDetails = async () => {
    try {
      setCourseLoading(true);
      setCourseError(null);
      const course = await fetchCourseById(courseId);
      setFormData({
        name: course.name || "",
        description: course.description || "",
        price: course.price || "",
        placesLimit: course.placesLimit ?? "",
        academicYear: course.academicYear || null,
        recruitmentStart: course.recruitmentStart || "",
        recruitmentEnd: course.recruitmentEnd || "",
        coordinatorEmail: "",
        isRecruitmentOpen: course.isRecruitmentOpen ?? true,
      });
      setCourseCoordinatorId(course.coordinatorId);
    } catch (error) {
      setCourseError(error.message);
    } finally {
      setCourseLoading(false);
    }
  };

  const coordinatorEmailById = useMemo(() => {
    const map = new Map();
    (coordinators || []).forEach((coordinator) => {
      if (coordinator?.id == null) return;
      map.set(String(coordinator.id), coordinator?.email || "");
    });
    return map;
  }, [coordinators]);

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

  useEffect(() => {
    if (courseCoordinatorId && coordinators.length > 0) {
      const email = coordinatorEmailById.get(String(courseCoordinatorId)) || "";
      if (email) {
        setFormData((prev) => ({ ...prev, coordinatorEmail: email }));
      }
    }
  }, [courseCoordinatorId, coordinators, coordinatorEmailById]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
        isRecruitmentOpen: formData.isRecruitmentOpen,
        ...(formData.academicYear && {
          academicYear: parseInt(formData.academicYear, 10),
        }),
        ...(formData.recruitmentStart && {
          recruitmentStart: formData.recruitmentStart,
        }),
        ...(formData.recruitmentEnd && {
          recruitmentEnd: formData.recruitmentEnd,
        }),
        coordinatorId: coordinatorId || null,
      };

      await updateCourse(courseId, payload);
      navigate("/", { replace: true });
    } catch (requestError) {
      console.error("Error updating course:", requestError);
      setFormError("Wystapil blad podczas zapisywania kierunku.");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <section className="admin-edit-course-view" aria-label="Edycja kierunku">
      <BackButton label="Wróć do panelu administratora" to="/" />

      <header className="admin-home-header">
        <p className="admin-home-tag">Studia podyplomowe AGH</p>
        <h1>Edytuj kierunek</h1>
        <p className="admin-home-subtitle">
          Zmień szczegóły programu studiów podyplomowych.
        </p>
      </header>

      {courseLoading ? (
        <div className="loading-state">Ladowanie szczegolow kierunku...</div>
      ) : courseError ? (
        <div className="error-state">{courseError}</div>
      ) : (
        <div className="course-form-container">
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
              <label>Status rekrutacji</label>
              <select
                name="isRecruitmentOpen"
                value={formData.isRecruitmentOpen ? "true" : "false"}
                onChange={(e) =>
                  handleInputChange({
                    target: {
                      name: "isRecruitmentOpen",
                      value: e.target.value === "true",
                    },
                  })
                }
                style={
                  formData.isRecruitmentOpen === false
                    ? {
                        borderColor: "#e11d48",
                        color: "#e11d48",
                        fontWeight: "bold",
                      }
                    : {}
                }
              >
                <option
                  value="true"
                  style={{ color: "#1f2937", fontWeight: "normal" }}
                >
                  Otwarta
                </option>
                <option
                  value="false"
                  style={{ color: "#1f2937", fontWeight: "normal" }}
                >
                  Zamknięta
                </option>
              </select>
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
                onClick={() => navigate("/")}
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
    </section>
  );
}

export default EditCoursePage;
