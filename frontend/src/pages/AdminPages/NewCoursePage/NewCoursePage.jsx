import { API_URL } from "../../../config/api";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCourse } from "../../../services/courseApi";
import { generateValidAcademicYears } from "../../../utils/academicYearUtils";
import { authFetch } from "../../../config/auth";
import "../HomePage/HomePage.css";
import "../CoursesPage/AdminCoursesPage.css";
import "./NewCoursePage.css";

const INITIAL_FORM_STATE = {
  name: "",
  description: "",
  price: "",
  placesLimit: "",
  academicYear: null,
  recruitmentStart: "",
  recruitmentEnd: "",
  coordinatorEmail: "",
};

function NewCoursePage() {
  const navigate = useNavigate();
  const [coordinators, setCoordinators] = useState([]);
  const [coordinatorsLoading, setCoordinatorsLoading] = useState(false);
  const [coordinatorsError, setCoordinatorsError] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    loadCoordinators();
  }, []);

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

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setFormError("");
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

      await createCourse(payload);
      resetForm();
      navigate("/", { replace: true });
    } catch (requestError) {
      console.error("Error creating course:", requestError);
      setFormError("Wystapil blad podczas zapisywania kierunku.");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <section className="admin-new-course-view" aria-label="Nowy kierunek">
      <header className="admin-home-header">
        <p className="admin-home-tag">Studia podyplomowe AGH</p>
        <h1>Nowy kierunek</h1>
        <p className="admin-home-subtitle">
          Dodaj nowy kierunek do oferty studiów podyplomowych.
        </p>
      </header>

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
              onWheel={(e) => e.target.blur()}
              required
              placeholder="np. 4500"
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
              placeholder="np. 40"
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
              {formSubmitting ? "Zapisywanie..." : "Utwórz kierunek"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default NewCoursePage;
