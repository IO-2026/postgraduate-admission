import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  getApplication,
  getApplicationDiplomaUrl,
  updateApplication,
  verifyDiploma,
  verifyDeclaration,
  acceptApplication,
} from "../../../services/applicationApi";
import { fetchCourseCandidates } from "../../../services/courseApi";
import BackButton from "../../../components/BackButton/BackButton";
import "./ApplicationManagementPage.css";

function ApplicationManagementPage() {
  const { courseId, applicationId } = useParams();

  const [applicationData, setApplicationData] = useState({
    id: applicationId,
    userId: null,
    courseId: null,
    isWithdrawn: false,
    isAccepted: false,
    isEntryFeePaid: false,
    isSemesterPaid: false,
    isDiplomaVerified: false,
    isDeclarationVerified: false,
    candidatePesel: "",
    candidateDateOfBirth: "",
    addressStreet: "",
    addressPostalCode: "",
    addressCity: "",
    previousDegree: "",
    fieldOfStudy: "",
    university: "",
    graduationYear: "",
    candidatePlaceOfBirth: "",
    notes: "",
    truthfulnessConsent: false,
    gdprConsent: false,
    newsletterConsent: false,
    submissionDateTime: "",
    userName: "",
    userSurname: "",
    userEmail: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [diplomaLoading, setDiplomaLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadApplicationData() {
      try {
        setLoading(true);
        setError("");
        const [data, candidates] = await Promise.all([
          getApplication(applicationId),
          fetchCourseCandidates(courseId).catch(() => []),
        ]);

        const candidateInfo =
          candidates.find(
            (c) => String(c.applicationId) === String(applicationId),
          ) || {};

        if (isMounted) {
          setApplicationData({
            id: data.id || applicationId,
            userId: data.userId || null,
            courseId: data.courseId || null,
            isWithdrawn: data.isWithdrawn || false,
            isAccepted: data.isAccepted || false,
            isEntryFeePaid: data.isEntryFeePaid || false,
            isSemesterPaid: data.isSemesterPaid || false,
            isDiplomaVerified: data.isDiplomaVerified || false,
            isDeclarationVerified: data.isDeclarationVerified || false,
            candidatePesel: data.candidatePesel || "",
            candidateDateOfBirth: data.candidateDateOfBirth || "",
            addressStreet: data.addressStreet || "",
            addressPostalCode: data.addressPostalCode || "",
            addressCity: data.addressCity || "",
            previousDegree: data.previousDegree || "",
            fieldOfStudy: data.fieldOfStudy || "",
            university: data.university || "",
            graduationYear: data.graduationYear || "",
            candidatePlaceOfBirth: data.candidatePlaceOfBirth || "",
            notes: data.notes || "",
            truthfulnessConsent: data.truthfulnessConsent || false,
            gdprConsent: data.gdprConsent || false,
            newsletterConsent: data.newsletterConsent || false,
            submissionDateTime: data.submissionDateTime || "",
            userName: data.user?.name || candidateInfo.name || "",
            userSurname: data.user?.surname || candidateInfo.surname || "",
            userEmail: data.user?.email || candidateInfo.email || "",
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
  }, [applicationId, courseId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setApplicationData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleVerifyDiploma = async () => {
    setSuccessMessage("");
    setError("");

    try {
      setActionLoading(true);
      await verifyDiploma(applicationId);
      setApplicationData((prev) => ({
        ...prev,
        isDiplomaVerified: true,
      }));
      setSuccessMessage("Dyplom został zweryfikowany pomyślnie.");
    } catch (err) {
      setError(err.message || "Nie udało się zweryfikować dyplomu.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyDeclaration = async () => {
    setSuccessMessage("");
    setError("");

    try {
      setActionLoading(true);
      await verifyDeclaration(applicationId);
      setApplicationData((prev) => ({
        ...prev,
        isDeclarationVerified: true,
      }));
      setSuccessMessage("Oświadczenie zostało zweryfikowane pomyślnie.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptApplication = async () => {
    setSuccessMessage("");
    setError("");

    try {
      setActionLoading(true);
      await acceptApplication(applicationId);
      setApplicationData((prev) => ({
        ...prev,
        isAccepted: true,
      }));
      setSuccessMessage("Wniosek został zaakceptowany.");
    } catch (err) {
      setError(err.message || "Nie udało się zaakceptować wniosku.");
    } finally {
      setActionLoading(false);
    }
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
      }
    } catch (err) {
      setError(err.message || "Nie udało się zapisać zmian.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiplomaDownload = async () => {
    setError("");
    setSuccessMessage("");

    try {
      setDiplomaLoading(true);
      const response = await getApplicationDiplomaUrl(applicationId);
      const url = response?.url;
      if (!url) {
        throw new Error("Brak linku do dyplomu");
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message || "Nie udało się pobrać dyplomu.");
    } finally {
      setDiplomaLoading(false);
    }
  };

  // Określenie statusu tekstowego na podstawie flag
  const getStatusText = () => {
    if (applicationData.isWithdrawn) return "Wycofana";
    if (applicationData.isAccepted) return "Zaakceptowana";
    if (applicationData.isDiplomaVerified && applicationData.isEntryFeePaid)
      return "Gotowa do akceptacji";
    if (applicationData.isDiplomaVerified) return "Dyplom zweryfikowany";
    return "W trakcie weryfikacji";
  };

  // Sprawdzenie czy akcje są dostępne
  const isWithdrawn = applicationData.isWithdrawn;
  const isAccepted = applicationData.isAccepted;
  const canVerifyDiploma = !isWithdrawn && !applicationData.isDiplomaVerified;
  const canVerifyDeclaration =
    !isWithdrawn && !applicationData.isDeclarationVerified && isAccepted;
  const canAcceptApplication =
    !isWithdrawn &&
    !isAccepted &&
    applicationData.isDiplomaVerified &&
    applicationData.isEntryFeePaid;

  if (loading) {
    return (
      <section className="application-management-view">
        <div className="application-management-state">
          Ładowanie danych aplikacji...
        </div>
      </section>
    );
  }

  if (error && !applicationData.userName) {
    return (
      <section className="application-management-view">
        <BackButton
          to={`/coordinator/courses/${courseId}/manage`}
          label="Wróć do zarządzania kierunkiem"
        />
        <div className="application-management-state application-management-error">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="application-management-view">
      <BackButton
        to={`/coordinator/courses/${courseId}/manage`}
        label="Wróć do zarządzania kierunkiem"
      />

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
              <label>Status aplikacji</label>
              <div className="application-management-readonly">
                {getStatusText()}
              </div>
            </div>

            <div className="application-management-field">
              <label>Opłata wpisowa</label>
              <div className="application-management-readonly">
                {applicationData.isEntryFeePaid ? "Opłacona" : "Nieopłacona"}
              </div>
            </div>

            <div className="application-management-field">
              <label>Opłata za semestr</label>
              <div className="application-management-readonly">
                {applicationData.isSemesterPaid ? "Opłacona" : "Nieopłacona"}
              </div>
            </div>

            <div className="application-management-field">
              <label>Data złożenia</label>
              <div className="application-management-readonly">
                {applicationData.submissionDateTime
                  ? new Intl.DateTimeFormat("pl-PL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(applicationData.submissionDateTime))
                  : "Brak danych"}
              </div>
            </div>
          </div>
        </div>

        <div className="application-management-section">
          <h3>Akcje koordynatora</h3>
          <div className="application-management-form-grid">
            <div className="application-management-field">
              <label>Weryfikacja dyplomu</label>
              <div>
                {applicationData.isDiplomaVerified ? (
                  <div
                    className="application-management-readonly"
                    style={{ color: "#16a34a" }}
                  >
                    ✓ Dyplom zweryfikowany
                  </div>
                ) : (
                  <button
                    type="button"
                    className="application-management-submit"
                    onClick={handleVerifyDiploma}
                    disabled={actionLoading || !canVerifyDiploma || isWithdrawn}
                    style={{
                      backgroundColor: canVerifyDiploma
                        ? "var(--primary)"
                        : "#9ca3af",
                      cursor: canVerifyDiploma ? "pointer" : "not-allowed",
                    }}
                  >
                    {actionLoading ? "Weryfikowanie..." : "Zweryfikuj dyplom"}
                  </button>
                )}
              </div>
            </div>

            <div className="application-management-field">
              <label>Weryfikacja oświadczenia</label>
              <div>
                {applicationData.isDeclarationVerified ? (
                  <div
                    className="application-management-readonly"
                    style={{ color: "#16a34a" }}
                  >
                    ✓ Oświadczenie zweryfikowane
                  </div>
                ) : (
                  <button
                    type="button"
                    className="application-management-submit"
                    onClick={handleVerifyDeclaration}
                    disabled={
                      actionLoading || !canVerifyDeclaration || isWithdrawn
                    }
                    style={{
                      backgroundColor: canVerifyDeclaration
                        ? "var(--primary)"
                        : "#9ca3af",
                      cursor: canVerifyDeclaration ? "pointer" : "not-allowed",
                    }}
                  >
                    {actionLoading
                      ? "Weryfikowanie..."
                      : "Zweryfikuj oświadczenie"}
                  </button>
                )}
              </div>
              {!isAccepted && !isWithdrawn && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Oświadczenie można zweryfikować po zaakceptowaniu wniosku
                </div>
              )}
            </div>

            <div className="application-management-field application-management-field-wide">
              <label>Akceptacja wniosku</label>
              <div>
                {isAccepted ? (
                  <div
                    className="application-management-readonly"
                    style={{ color: "#16a34a" }}
                  >
                    ✓ Wniosek zaakceptowany
                  </div>
                ) : (
                  <button
                    type="button"
                    className="application-management-submit"
                    onClick={handleAcceptApplication}
                    disabled={
                      actionLoading || !canAcceptApplication || isWithdrawn
                    }
                    style={{
                      backgroundColor: canAcceptApplication
                        ? "#16a34a"
                        : "#9ca3af",
                      cursor: canAcceptApplication ? "pointer" : "not-allowed",
                    }}
                  >
                    {actionLoading ? "Akceptowanie..." : "Akceptuj wniosek"}
                  </button>
                )}
              </div>
              {!canAcceptApplication && !isAccepted && !isWithdrawn && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    marginTop: "4px",
                    whiteSpace: "pre-line",
                  }}
                >
                  {!applicationData.isDiplomaVerified &&
                    "• Wymagana weryfikacja dyplomu\n"}
                  {!applicationData.isEntryFeePaid &&
                    "• Wymagana opłata wpisowego"}
                </div>
              )}
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
              <label htmlFor="candidatePesel">PESEL</label>
              {isEditMode ? (
                <input
                  id="candidatePesel"
                  type="text"
                  name="candidatePesel"
                  value={applicationData.candidatePesel}
                  onChange={handleChange}
                  className="application-management-input"
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.candidatePesel || "Brak danych"}
                </div>
              )}
            </div>

            <div className="application-management-field">
              <label htmlFor="candidateDateOfBirth">Data urodzenia</label>
              {isEditMode ? (
                <input
                  id="candidateDateOfBirth"
                  type="date"
                  name="candidateDateOfBirth"
                  value={applicationData.candidateDateOfBirth}
                  onChange={handleChange}
                  className="application-management-input"
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.candidateDateOfBirth || "Brak danych"}
                </div>
              )}
            </div>

            <div className="application-management-field">
              <label htmlFor="placeOfBirth">Miejsce urodzenia</label>
              {isEditMode ? (
                <input
                  id="placeOfBirth"
                  type="text"
                  name="placeOfBirth"
                  value={applicationData.candidatePlaceOfBirth}
                  onChange={handleChange}
                  className="application-management-input"
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.candidatePlaceOfBirth || "Brak danych"}
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
                  onWheel={(e) => e.target.blur()}
                  className="application-management-input"
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.graduationYear || "Brak danych"}
                </div>
              )}
            </div>

            <div className="application-management-field application-management-field-wide">
              <label>Dyplom (PDF)</label>
              <div className="application-management-readonly">
                <button
                  type="button"
                  className="application-management-edit"
                  onClick={handleDiplomaDownload}
                  disabled={diplomaLoading}
                >
                  {diplomaLoading ? "Pobieranie..." : "Wyświetl dyplom"}
                </button>
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
              <label htmlFor="truthfulnessConsent">
                Zgoda na rzetelność informacji
              </label>
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
              <label htmlFor="gdprConsent">
                Zgoda na przetwarzanie danych (RODO)
              </label>
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

            <div className="application-management-field application-management-field-checkbox">
              <label htmlFor="newsletterConsent">Zgoda na newsletter</label>
              {isEditMode ? (
                <input
                  id="newsletterConsent"
                  type="checkbox"
                  name="newsletterConsent"
                  checked={applicationData.newsletterConsent}
                  onChange={handleChange}
                />
              ) : (
                <div className="application-management-readonly">
                  {applicationData.newsletterConsent ? "Tak" : "Nie"}
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
          {isEditMode && (
            <button
              type="submit"
              className="application-management-submit"
              disabled={submitting}
            >
              {submitting ? "Zapisywanie..." : "Zapisz dane"}
            </button>
          )}
          {!isEditMode && (
            <button
              type="button"
              className="application-management-edit"
              onClick={toggleEditMode}
              disabled={submitting || actionLoading}
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
