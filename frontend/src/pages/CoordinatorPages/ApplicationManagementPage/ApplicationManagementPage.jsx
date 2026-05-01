import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getApplication, updateApplicationStatus, updateApplication } from "../../../services/applicationApi";
import "./ApplicationManagementPage.css";

function ApplicationManagementPage() {
  const { courseId, applicationId } = useParams();
  
  const [applicationData, setApplicationData] = useState({
    id: applicationId,
    status: "SUBMITTED",
    isPaid: false,
    applicantPesel: "",
    applicantDateOfBirth: "",
    addressStreet: "",
    addressPostalCode: "",
    addressCity: "",
    previousDegree: "",
    fieldOfStudy: "",
    university: "",
    graduationYear: "",
    diplomaUrl: "",
    notes: "",
    truthfulnessConsent: false,
    gdprConsent: false,
    userName: "",
    userSurname: "",
    userEmail: "",
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadApplicationData() {
      try {
        setLoading(true);
        setError("");
        const data = await getApplication(applicationId);
        
        if (isMounted) {
          setApplicationData({
            id: data.id || data.applicationId || applicationId,
            status: data.status || "SUBMITTED",
            isPaid: data.isPaid || false,
            applicantPesel: data.applicantPesel || "",
            applicantDateOfBirth: data.applicantDateOfBirth || "",
            addressStreet: data.addressStreet || "",
            addressPostalCode: data.addressPostalCode || "",
            addressCity: data.addressCity || "",
            previousDegree: data.previousDegree || "",
            fieldOfStudy: data.fieldOfStudy || "",
            university: data.university || "",
            graduationYear: data.graduationYear || "",
            diplomaUrl: data.diplomaUrl || "",
            notes: data.notes || "",
            truthfulnessConsent: data.truthfulnessConsent || false,
            gdprConsent: data.gdprConsent || false,
            userName: data.user?.name || "",
            userSurname: data.user?.surname || "",
            userEmail: data.user?.email || "",
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Nie udało się pobrać danych aplikacji");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadApplicationData();

    return () => {
      isMounted = false;
    };
  }, [applicationId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setApplicationData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setSuccessMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setError("");

    try {
      setSubmitting(true);
      if (isEditMode) {
        await updateApplication(applicationData);
        setSuccessMessage("Zaktualizowano dane aplikacji.");
        setIsEditMode(false);
      } else {
        await updateApplicationStatus(applicationId, applicationData.status);
        setSuccessMessage("Zapisano zmiany w aplikacji.");
      }
    } catch (err) {
      setError(err.message || "Nie udało się zapisać zmian.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="application-management-view">
        <div className="application-management-state">Ładowanie danych aplikacji...</div>
      </section>
    );
  }

  if (error && !applicationData.userName) {
    return (
      <section className="application-management-view">
        <Link className="application-management-back-link" to={`/coordinator/courses/${courseId}/manage`}>
          <svg
            className="application-management-back-icon"
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
          Wróć do zarządzania kierunkiem
        </Link>
        <div className="application-management-state application-management-error">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="application-management-view">
      <Link className="application-management-back-link" to={`/coordinator/courses/${courseId}/manage`}>
        <svg
          className="application-management-back-icon"
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
        Wróć do zarządzania kierunkiem
      </Link>

      <header className="application-management-header">
        <h1>Zarządzanie aplikacją</h1>
        <p>
          {applicationData.userName && applicationData.userSurname
            ? `${applicationData.userName} ${applicationData.userSurname} • `
            : ""}
          Aplikacja #{applicationId}
        </p>
      </header>

      <form className="application-management-form" onSubmit={handleSubmit}>
        <div className="application-management-section">
          <h3>Informacje podstawowe</h3>
          <div className="application-management-form-grid">
            <div className="application-management-field">
              <label htmlFor="app-status">Status</label>
              <select
                id="app-status"
                name="status"
                value={applicationData.status}
                onChange={handleChange}
              >
                <option value="SUBMITTED">Wniosek przyjęty</option>
                <option value="VERIFIED">Wniosek zweryfikowany</option>
                <option value="WAITING_LIST">Wniosek na liście rezerwowej</option>
                <option value="ACCEPTED">Wniosek zaakceptowany</option>
                <option value="REJECTED">Wniosek odrzucony</option>
                <option value="WITHDRAWN">Wniosek wycofany</option>
              </select>
            </div>

            <div className="application-management-field">
              <label>Opłacone</label>
              <div className="application-management-readonly">
                {applicationData.isPaid ? "Tak" : "Nie"}
              </div>
            </div>
          </div>
        </div>

        <div className="application-management-section">
          <h3>Dane Kandydata</h3>
          <div className="application-management-form-grid">
            <div className="application-management-field">
              <label htmlFor="userName">Imię</label>
              <div className="application-management-readonly">
                {applicationData.userName || "Brak danych"}
              </div>
            </div>

            <div className="application-management-field">
              <label htmlFor="userSurname">Nazwisko</label>
              <div className="application-management-readonly">
                {applicationData.userSurname || "Brak danych"}
              </div>
            </div>

            <div className="application-management-field application-management-field-wide">
              <label htmlFor="userEmail">E-mail</label>
              <div className="application-management-readonly">
                {applicationData.userEmail || "Brak danych"}
              </div>
            </div>

            <div className="application-management-field">
              <label htmlFor="applicantPesel">PESEL</label>
              {isEditMode ? (
                <input
                  id="applicantPesel"
                  type="text"
                  name="applicantPesel"
                  value={applicationData.applicantPesel}
                  onChange={handleChange}
                  className="application-management-input"
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.applicantPesel || "Brak danych"}
                </div>
              )}
            </div>

            <div className="application-management-field">
              <label htmlFor="applicantDateOfBirth">Data urodzenia</label>
              {isEditMode ? (
                <input
                  id="applicantDateOfBirth"
                  type="date"
                  name="applicantDateOfBirth"
                  value={applicationData.applicantDateOfBirth}
                  onChange={handleChange}
                  className="application-management-input"
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.applicantDateOfBirth || "Brak danych"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="application-management-section">
          <h3>Adres</h3>
          <div className="application-management-form-grid">
            <div className="application-management-field application-management-field-wide">
              <label htmlFor="addressStreet">Ulica i numer</label>
              {isEditMode ? (
                <input
                  id="addressStreet"
                  type="text"
                  name="addressStreet"
                  value={applicationData.addressStreet}
                  onChange={handleChange}
                  className="application-management-input"
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.addressStreet || "Brak danych"}
                </div>
              )}
            </div>

            <div className="application-management-field">
              <label htmlFor="addressPostalCode">Kod pocztowy</label>
              {isEditMode ? (
                <input
                  id="addressPostalCode"
                  type="text"
                  name="addressPostalCode"
                  value={applicationData.addressPostalCode}
                  onChange={handleChange}
                  className="application-management-input"
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.addressPostalCode || "Brak danych"}
                </div>
              )}
            </div>

            <div className="application-management-field">
              <label htmlFor="addressCity">Miejscowość</label>
              {isEditMode ? (
                <input
                  id="addressCity"
                  type="text"
                  name="addressCity"
                  value={applicationData.addressCity}
                  onChange={handleChange}
                  className="application-management-input"
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.addressCity || "Brak danych"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="application-management-section">
          <h3>Wykształcenie</h3>
          <div className="application-management-form-grid">
            <div className="application-management-field">
              <label htmlFor="previousDegree">Poprzedni stopień naukowy</label>
              {isEditMode ? (
                <input
                  id="previousDegree"
                  type="text"
                  name="previousDegree"
                  value={applicationData.previousDegree}
                  onChange={handleChange}
                  className="application-management-input"
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.previousDegree || "Brak danych"}
                </div>
              )}
            </div>

            <div className="application-management-field">
              <label htmlFor="fieldOfStudy">Kierunek ukończonych studiów</label>
              {isEditMode ? (
                <input
                  id="fieldOfStudy"
                  type="text"
                  name="fieldOfStudy"
                  value={applicationData.fieldOfStudy}
                  onChange={handleChange}
                  className="application-management-input"
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.fieldOfStudy || "Brak danych"}
                </div>
              )}
            </div>

            <div className="application-management-field">
              <label htmlFor="university">Uczelnia</label>
              {isEditMode ? (
                <input
                  id="university"
                  type="text"
                  name="university"
                  value={applicationData.university}
                  onChange={handleChange}
                  className="application-management-input"
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.university || "Brak danych"}
                </div>
              )}
            </div>

            <div className="application-management-field">
              <label htmlFor="graduationYear">Rok ukończenia</label>
              {isEditMode ? (
                <input
                  id="graduationYear"
                  type="number"
                  name="graduationYear"
                  value={applicationData.graduationYear}
                  onChange={handleChange}
                  className="application-management-input"
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.graduationYear || "Brak danych"}
                </div>
              )}
            </div>

            <div className="application-management-field application-management-field-wide">
              <label htmlFor="diplomaUrl">Link do dyplomu (URL)</label>
              {isEditMode ? (
                <input
                  id="diplomaUrl"
                  type="url"
                  name="diplomaUrl"
                  value={applicationData.diplomaUrl}
                  onChange={handleChange}
                  className="application-management-input"
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.diplomaUrl ? (
                    <a href={applicationData.diplomaUrl} target="_blank" rel="noopener noreferrer">
                      {applicationData.diplomaUrl}
                    </a>
                  ) : (
                    "Brak danych"
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="application-management-section">
            <h3>Zdjęcie dyplomu</h3>
            <div className="application-management-diploma-placeholder">
              <div className="application-management-diploma-placeholder-content">
                <svg className="application-management-diploma-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <p>Zdjęcie dyplomu</p>
                <span>Zdjęcie dyplomu będzie wyświetlane tutaj</span>
              </div>
            </div>
          </div>
        </div>

        <div className="application-management-section">
          <h3>Uwagi</h3>
          <div className="application-management-form-grid">
            <div className="application-management-field application-management-field-wide">
              <label htmlFor="notes">Notatki dla koordynatora</label>
              {isEditMode ? (
                <textarea
                  id="notes"
                  name="notes"
                  value={applicationData.notes}
                  onChange={handleChange}
                  className="application-management-input application-management-textarea"
                  rows="4"
                />
              ) : (
                <div className="application-management-readonly application-management-readonly-multiline">
                  {applicationData.notes || "Brak notatek"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="application-management-section">
          <h3>Zgody</h3>
          <div className="application-management-form-grid">
            <div className="application-management-field application-management-field-checkbox">
              <label htmlFor="truthfulnessConsent">Zgoda na rzetelność informacji</label>
              {isEditMode ? (
                <input
                  id="truthfulnessConsent"
                  type="checkbox"
                  name="truthfulnessConsent"
                  checked={applicationData.truthfulnessConsent}
                  onChange={handleChange}
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.truthfulnessConsent ? "Tak" : "Nie"}
                </div>
              )}
            </div>

            <div className="application-management-field application-management-field-checkbox">
              <label htmlFor="gdprConsent">Zgoda na przetwarzanie danych (RODO)</label>
              {isEditMode ? (
                <input
                  id="gdprConsent"
                  type="checkbox"
                  name="gdprConsent"
                  checked={applicationData.gdprConsent}
                  onChange={handleChange}
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.gdprConsent ? "Tak" : "Nie"}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="application-management-message application-management-error">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="application-management-message application-management-success">
            {successMessage}
          </div>
        )}

        <div className="application-management-actions">
          {isEditMode && (
            <button
              type="button"
              className="application-management-cancel"
              onClick={toggleEditMode}
              disabled={submitting}
            >
              Anuluj
            </button>
          )}
          <button
            type="submit"
            className="application-management-submit"
            disabled={submitting}
          >
            {submitting ? "Zapisywanie..." : isEditMode ? "Zapisz dane" : "Zapisz zmiany"}
          </button>
          {!isEditMode && (
            <button
              type="button"
              className="application-management-edit"
              onClick={toggleEditMode}
              disabled={submitting}
            >
              Edytuj dane
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default ApplicationManagementPage;
