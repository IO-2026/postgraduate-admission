import "./AdmissionPage.css";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { submitApplication } from "../../services/admissionApi";

const AUTH_STORAGE_KEY = "pg-admission-auth";
const DEFAULT_COURSE_ID = 1;
const REQUIRED_ERROR = "To pole jest wymagane.";
const CONSENT_ERROR_MESSAGES = {
  truthfulnessConsent: "Wymagana zgoda na prawdziwość danych.",
  gdprConsent: "Wymagana zgoda RODO.",
};

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function loadAuthState() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  return parsed;
}

function getDraftStorageKey(courseId) {
  return `pg-admission-draft:${courseId}`;
}

function loadDraft(courseId) {
  const raw = localStorage.getItem(getDraftStorageKey(courseId));
  if (!raw) {
    return null;
  }
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  return parsed;
}

function saveDraft(courseId, draft) {
  localStorage.setItem(getDraftStorageKey(courseId), JSON.stringify(draft));
}

function clearDraft(courseId) {
  localStorage.removeItem(getDraftStorageKey(courseId));
}

function isBlank(value) {
  return String(value ?? "").trim() === "";
}

function isValidPesel(value) {
  const pesel = String(value || "").trim();
  if (!/^\d{11}$/.test(pesel)) {
    return false;
  }

  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const sum = weights.reduce(
    (acc, weight, index) => acc + Number.parseInt(pesel[index], 10) * weight,
    0,
  );
  const checksum = (10 - (sum % 10)) % 10;
  return checksum === Number.parseInt(pesel[10], 10);
}

function isPastDate(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return false;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!url.hostname) {
      return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateYear(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return REQUIRED_ERROR;
  }

  if (!/^\d+$/.test(raw)) {
    return "Rok ukończenia jest nieprawidłowy.";
  }

  const year = Number.parseInt(raw, 10);
  if (year < 1900 || year > 2100) {
    return "Rok ukończenia jest nieprawidłowy.";
  }

  return "";
}

function validateDraft({ account, draft }) {
  const errors = {};

  const requiredFields = [
    ["name", account.name],
    ["surname", account.surname],
    ["telNumber", account.telNumber],
    ["dateOfBirth", account.dateOfBirth],
    ["pesel", account.pesel],
    ["street", draft.street],
    ["postalCode", draft.postalCode],
    ["city", draft.city],
    ["university", draft.university],
  ];

  requiredFields.forEach(([field, value]) => {
    if (isBlank(value)) {
      errors[field] = REQUIRED_ERROR;
    }
  });

  if (!isBlank(account.dateOfBirth) && !isPastDate(account.dateOfBirth)) {
    errors.dateOfBirth = "Data urodzenia musi być w przeszłości.";
  }

  if (isBlank(account.pesel)) {
    errors.pesel = "PESEL jest wymagany.";
  } else if (!isValidPesel(account.pesel)) {
    errors.pesel = "Podaj poprawny numer PESEL.";
  }

  const street = String(draft.street || "").trim();
  if (!street) {
    errors.street = REQUIRED_ERROR;
  } else if (street.length < 2 || street.length > 120) {
    errors.street = "Ulica musi mieć od 2 do 120 znaków.";
  }

  const postalCode = String(draft.postalCode || "").trim();
  if (!postalCode) {
    errors.postalCode = REQUIRED_ERROR;
  } else if (!/^\d{2}-\d{3}$/.test(postalCode)) {
    errors.postalCode = "Podaj poprawny kod pocztowy (np. 30-059).";
  }

  const city = String(draft.city || "").trim();
  if (!city) {
    errors.city = REQUIRED_ERROR;
  } else if (city.length < 2 || city.length > 80) {
    errors.city = "Miasto musi mieć od 2 do 80 znaków.";
  }

  const previousDegree = String(draft.previousDegree || "").trim();
  if (!previousDegree) {
    errors.previousDegree = REQUIRED_ERROR;
  } else if (previousDegree.length > 120) {
    errors.previousDegree = "Nazwa ukończonych studiów jest za długa.";
  }

  const fieldOfStudy = String(draft.fieldOfStudy || "").trim();
  if (!fieldOfStudy) {
    errors.fieldOfStudy = REQUIRED_ERROR;
  } else if (fieldOfStudy.length > 120) {
    errors.fieldOfStudy = "Nazwa kierunku jest za długa.";
  }

  const yearError = validateYear(draft.graduationYear);
  if (yearError) {
    errors.graduationYear = yearError;
  }

  const university = String(draft.university || "").trim();
  if (!university) {
    errors.university = REQUIRED_ERROR;
  } else if (university.length < 2 || university.length > 200) {
    errors.university = "Nazwa uczelni musi mieć od 2 do 200 znaków.";
  }

  if (!draft.truthfulnessConsent) {
    errors.truthfulnessConsent = CONSENT_ERROR_MESSAGES.truthfulnessConsent;
  }

  if (!draft.gdprConsent) {
    errors.gdprConsent = CONSENT_ERROR_MESSAGES.gdprConsent;
  }

  return errors;
}

function getAccountDefaults(user) {
  const safeUser = user && typeof user === "object" ? user : {};

  return {
    email: safeUser.email || "",
    name: safeUser.name || "",
    surname: safeUser.surname || "",
    telNumber: safeUser.telNumber || "",
    dateOfBirth: safeUser.dateOfBirth || "",
    pesel: safeUser.pesel || "",
  };
}

function getDraftDefaults(existingDraft) {
  const safeDraft =
    existingDraft && typeof existingDraft === "object" ? existingDraft : {};

  return {
    university: safeDraft.university || "",
    street: safeDraft.street || "",
    postalCode: safeDraft.postalCode || "",
    city: safeDraft.city || "",
    previousDegree: safeDraft.previousDegree || "",
    fieldOfStudy: safeDraft.fieldOfStudy || "",
    graduationYear: safeDraft.graduationYear || "",
    notes: safeDraft.notes || "",
    truthfulnessConsent: Boolean(safeDraft.truthfulnessConsent),
    gdprConsent: Boolean(safeDraft.gdprConsent),
  };
}

function AdmissionPage() {
  const courseId = DEFAULT_COURSE_ID;
  const authState = useMemo(loadAuthState, []);
  const token = authState?.token || null;
  const user = authState?.user || null;

  const [account, setAccount] = useState(() => getAccountDefaults(user));
  const [draft, setDraft] = useState(() =>
    getDraftDefaults(loadDraft(courseId)),
  );
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitInfo, setSubmitInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diplomaFile, setDiplomaFile] = useState(null);

  useEffect(() => {
    setAccount(getAccountDefaults(user));
  }, [user]);

  useEffect(() => {
    saveDraft(courseId, draft);
  }, [courseId, draft]);

  useEffect(() => {
    setErrors(validateDraft({ account, draft }));
  }, [account, draft]);

  const onFieldBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const onAccountInput = (event) => {
    const { name, value } = event.target;
    setAccount((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onDraftInput = (event) => {
    const { name, value } = event.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const onDraftCheckbox = (event) => {
    const { name, checked } = event.target;
    setDraft((prev) => ({ ...prev, [name]: checked }));
  };

  const onDiplomaFileInput = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setDiplomaFile(selectedFile);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError("");
    setSubmitInfo("");

    const validationErrors = validateDraft({ account, draft });
    if (!diplomaFile) {
      validationErrors.diplomaFile = "Plik dyplomu jest wymagany.";
    } else if (diplomaFile.type !== "application/pdf") {
      validationErrors.diplomaFile = "Dozwolony jest tylko plik PDF.";
    } else if (diplomaFile.size > 10 * 1024 * 1024) {
      validationErrors.diplomaFile = "Plik dyplomu jest za duży (maks. 10MB).";
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSubmitError("Uzupełnij wymagane pola.");
      return;
    }

    if (!token) {
      setSubmitError("Sesja wygasła. Zaloguj się ponownie.");
      return;
    }

    setIsSubmitting(true);

    try {
      const previousDegree = String(draft.previousDegree || "").trim();
      const fieldOfStudy = String(draft.fieldOfStudy || "").trim();
      const notes = String(draft.notes || "").trim();
      const graduationYearRaw = String(draft.graduationYear || "").trim();
      const graduationYear = graduationYearRaw
        ? Number.parseInt(graduationYearRaw, 10)
        : null;

      await submitApplication(
        {
          applicant: {
            dateOfBirth: String(account.dateOfBirth).trim(),
            pesel: String(account.pesel).trim(),
            address: {
              street: String(draft.street).trim(),
              postalCode: String(draft.postalCode).trim(),
              city: String(draft.city).trim(),
            },
          },
          education: {
            previousDegree: previousDegree || null,
            fieldOfStudy: fieldOfStudy || null,
            graduationYear:
              Number.isFinite(graduationYear) && graduationYear > 0
                ? graduationYear
                : null,
          },
          details: {
            courseId,
            university: String(draft.university).trim(),
            notes: notes || null,
            truthfulnessConsent: Boolean(draft.truthfulnessConsent),
            gdprConsent: Boolean(draft.gdprConsent),
          },
        },
        diplomaFile,
        token,
      );

      clearDraft(courseId);
      setDraft(getDraftDefaults(null));
      setDiplomaFile(null);
      setErrors({});
      setTouched({});
      setSubmitAttempted(false);
      setSubmitInfo("Wniosek został wysłany.");
    } catch (requestError) {
      setSubmitError(requestError?.message || "Nie udało się wysłać wniosku.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const missingSession = !token;
  const hasValidationErrors = Object.keys(errors).length > 0;

  const showFieldError = (name) => {
    if (!errors[name]) {
      return false;
    }
    return submitAttempted || Boolean(touched[name]);
  };

  const getInputAriaInvalid = (name) => showFieldError(name);

  const renderFieldError = (name) =>
    showFieldError(name) ? <p className="field-error">{errors[name]}</p> : null;

  return (
    <section className="admission-view" aria-label="Strona rekrutacji">
      <header className="admission-header">
        <p className="admission-tag">Studia podyplomowe AGH</p>
        <h1>Wniosek rekrutacyjny</h1>
        <p className="admission-subtitle">
          Wybrany kierunek: <strong>ID {courseId}</strong>
        </p>
      </header>

      <div className="admission-card">
        {missingSession ? (
          <div className="admission-session">
            <p className="form-error" role="alert">
              Brakuje danych sesji (token). Zaloguj się ponownie.
            </p>
            <div className="admission-actions">
              <Link className="primary-btn" to="/auth">
                Przejdź do logowania
              </Link>
              <Link className="ghost-link" to="/">
                Wróć do strony głównej
              </Link>
            </div>
          </div>
        ) : (
          <form className="admission-form" onSubmit={onSubmit} noValidate>
            <section className="admission-section" aria-label="Dane konta">
              <h2>Dane konta</h2>

              <label>
                E-mail
                <input type="email" value={account.email} readOnly />
              </label>

              <label>
                Data urodzenia
                <input
                  type="date"
                  name="dateOfBirth"
                  value={account.dateOfBirth}
                  onChange={onAccountInput}
                  onBlur={onFieldBlur}
                  disabled={isSubmitting}
                  aria-invalid={getInputAriaInvalid("dateOfBirth")}
                />
                {renderFieldError("dateOfBirth")}
              </label>

              <label>
                PESEL
                <input
                  type="text"
                  name="pesel"
                  value={account.pesel}
                  onChange={onAccountInput}
                  onBlur={onFieldBlur}
                  disabled={isSubmitting}
                  aria-invalid={getInputAriaInvalid("pesel")}
                />
                {renderFieldError("pesel")}
              </label>
            </section>

            <section className="admission-section" aria-label="Dane do wniosku">
              <h2>Dane do wniosku</h2>

              <label>
                Uczelnia
                <input
                  type="text"
                  name="university"
                  value={draft.university}
                  onChange={onDraftInput}
                  onBlur={onFieldBlur}
                  disabled={isSubmitting}
                  aria-invalid={getInputAriaInvalid("university")}
                />
                {renderFieldError("university")}
              </label>

              <div className="admission-grid">
                <label>
                  Ulica i numer
                  <input
                    type="text"
                    name="street"
                    value={draft.street}
                    onChange={onDraftInput}
                    onBlur={onFieldBlur}
                    disabled={isSubmitting}
                    aria-invalid={getInputAriaInvalid("street")}
                  />
                  {renderFieldError("street")}
                </label>

                <label>
                  Kod pocztowy
                  <input
                    type="text"
                    name="postalCode"
                    value={draft.postalCode}
                    onChange={onDraftInput}
                    onBlur={onFieldBlur}
                    disabled={isSubmitting}
                    aria-invalid={getInputAriaInvalid("postalCode")}
                  />
                  {renderFieldError("postalCode")}
                </label>
              </div>

              <label>
                Miasto
                <input
                  type="text"
                  name="city"
                  value={draft.city}
                  onChange={onDraftInput}
                  onBlur={onFieldBlur}
                  disabled={isSubmitting}
                  aria-invalid={getInputAriaInvalid("city")}
                />
                {renderFieldError("city")}
              </label>

              <div className="admission-grid">
                <label>
                  Poprzedni stopień
                  <input
                    type="text"
                    name="previousDegree"
                    value={draft.previousDegree}
                    onChange={onDraftInput}
                    onBlur={onFieldBlur}
                    disabled={isSubmitting}
                    aria-invalid={getInputAriaInvalid("previousDegree")}
                  />
                  {renderFieldError("previousDegree")}
                </label>

                <label>
                  Kierunek ukończonych studiów
                  <input
                    type="text"
                    name="fieldOfStudy"
                    value={draft.fieldOfStudy}
                    onChange={onDraftInput}
                    onBlur={onFieldBlur}
                    disabled={isSubmitting}
                    aria-invalid={getInputAriaInvalid("fieldOfStudy")}
                  />
                  {renderFieldError("fieldOfStudy")}
                </label>
              </div>

              <label>
                Rok ukończenia
                <input
                  type="text"
                  name="graduationYear"
                  value={draft.graduationYear}
                  onChange={onDraftInput}
                  onBlur={onFieldBlur}
                  disabled={isSubmitting}
                  aria-invalid={getInputAriaInvalid("graduationYear")}
                />
                {renderFieldError("graduationYear")}
              </label>
            </section>

            <section className="admission-section" aria-label="Dokumenty">
              <h2>Dokumenty</h2>

              <label>
                Skan dyplomu (PDF)
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={onDiplomaFileInput}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.diplomaFile)}
                />
                {renderFieldError("diplomaFile")}
              </label>
              <p className="admission-hint">
                Dozwolony format: PDF. Maksymalny rozmiar pliku: 10MB.
              </p>
            </section>

            <section className="admission-section" aria-label="Zgody">
              <h2>Zgody</h2>

              <label className="admission-checkbox">
                <input
                  type="checkbox"
                  name="truthfulnessConsent"
                  checked={draft.truthfulnessConsent}
                  onChange={onDraftCheckbox}
                  disabled={isSubmitting}
                  aria-invalid={getInputAriaInvalid("truthfulnessConsent")}
                />
                <span>Oświadczam, że dane są prawdziwe.</span>
              </label>
              {renderFieldError("truthfulnessConsent")}

              <label className="admission-checkbox">
                <input
                  type="checkbox"
                  name="gdprConsent"
                  checked={draft.gdprConsent}
                  onChange={onDraftCheckbox}
                  disabled={isSubmitting}
                  aria-invalid={getInputAriaInvalid("gdprConsent")}
                />
                <span>
                  Wyrażam zgodę na przetwarzanie moich danych osobowych w celu
                  przeprowadzenia rekrutacji (RODO).
                </span>
              </label>
              {renderFieldError("gdprConsent")}
            </section>

            {submitError ? (
              <p className="form-error" role="alert">
                {submitError}
              </p>
            ) : null}
            {submitInfo ? <p className="form-info">{submitInfo}</p> : null}

            <div className="admission-actions">
              <button
                type="submit"
                className="primary-btn"
                disabled={isSubmitting || hasValidationErrors}
              >
                {isSubmitting ? "Wysyłanie..." : "Wyślij wniosek"}
              </button>
              <Link className="ghost-link" to="/">
                Wróć do strony głównej
              </Link>
              <Link className="ghost-link" to="/messages">
                Wiadomości
              </Link>
            </div>
            {!isSubmitting && hasValidationErrors ? (
              <p className="admission-disabled-note">
                Uzupełnij błędy powyżej, aby wysłać wniosek.
              </p>
            ) : null}
          </form>
        )}
      </div>
    </section>
  );
}

export default AdmissionPage;
