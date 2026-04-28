import "./AdmissionPage.css";
import "../../CoursesPage/CoursesPage.css";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { submitApplication } from "./admissionApi";
import { fetchCourses } from "../../../services/courseApi";

const AUTH_STORAGE_KEY = "pg-admission-auth";
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
  if (!courseId) return null;
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
  if (!courseId) return;
  localStorage.setItem(getDraftStorageKey(courseId), JSON.stringify(draft));
}

function clearDraft(courseId) {
  if (!courseId) return;
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

  if (isBlank(account.dateOfBirth)) {
    errors.dateOfBirth = REQUIRED_ERROR;
  } else if (!isPastDate(account.dateOfBirth)) {
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

  const diplomaUrl = String(draft.diplomaUrl || "").trim();
  if (!diplomaUrl) {
    errors.diplomaUrl = REQUIRED_ERROR;
  } else if (!isValidHttpUrl(diplomaUrl)) {
    errors.diplomaUrl = "Podaj poprawny link do dyplomu (http/https).";
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
    diplomaUrl: safeDraft.diplomaUrl || "",
    notes: safeDraft.notes || "",
    truthfulnessConsent: Boolean(safeDraft.truthfulnessConsent),
    gdprConsent: Boolean(safeDraft.gdprConsent),
  };
}

function isValidDate(value) {
  return !Number.isNaN(new Date(value).getTime());
}

function isRecruitmentOpen(start, end) {
  if (!isValidDate(start) || !isValidDate(end)) {
    return false;
  }

  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  return now >= startDate && now <= endDate;
}

function AdmissionPage() {
  const [searchParams] = useSearchParams();
  const courseIdParam = searchParams.get("courseId");
  const courseId = courseIdParam ? parseInt(courseIdParam, 10) : null;

  const authState = useMemo(loadAuthState, []);
  const token = authState?.token || null;
  const user = authState?.user || null;
  const isLoggedIn = Boolean(authState?.isLoggedIn);

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
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");

  useEffect(() => {
    setAccount(getAccountDefaults(user));
  }, [user]);

  useEffect(() => {
    if (courseId) {
      setDraft(getDraftDefaults(loadDraft(courseId)));
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      return undefined;
    }

    let isActive = true;

    const loadCourses = async () => {
      setCoursesLoading(true);
      setCoursesError("");

      try {
        const data = await fetchCourses();
        if (!isActive) {
          return;
        }
        setCourses(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isActive) {
          return;
        }
        setCoursesError(
          error?.message || "Nie udało się pobrać kierunków studiów.",
        );
      } finally {
        if (isActive) {
          setCoursesLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      isActive = false;
    };
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      saveDraft(courseId, draft);
    }
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

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError("");
    setSubmitInfo("");

    if (!courseId) {
      setSubmitError("Wybierz kierunek przed złożeniem wniosku.");
      return;
    }

    const validationErrors = validateDraft({ account, draft });
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
            diplomaUrl: String(draft.diplomaUrl).trim(),
            notes: notes || null,
            truthfulnessConsent: Boolean(draft.truthfulnessConsent),
            gdprConsent: Boolean(draft.gdprConsent),
          },
        },
        token,
      );

      clearDraft(courseId);
      setDraft(getDraftDefaults(null));
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
      <div className="admission-top-actions">
        <Link className="ghost-link admission-back-link" to="/">
          <svg
            className="admission-back-icon"
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
      <header className="admission-header">
        <p className="admission-tag">Studia podyplomowe AGH</p>
        <h1>Wniosek rekrutacyjny</h1>
        {courseId ? (
          <p className="admission-subtitle">
            Wybrany kierunek: <strong>ID {courseId}</strong>
          </p>
        ) : (
          <p className="admission-subtitle">
            Wybierz kierunek, aby złożyć wniosek
          </p>
        )}
      </header>

      {!courseId ? (
        <div className="admission-course-picker">
          {coursesLoading ? (
            <div className="loading-state">Ładowanie kierunków...</div>
          ) : coursesError ? (
            <div className="error-state">{coursesError}</div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              Brak dostępnych kierunków studiów.
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map((course) => {
                const hasRecruitmentRange =
                  course.recruitmentStart && course.recruitmentEnd;
                const recruitmentOpen =
                  hasRecruitmentRange &&
                  isRecruitmentOpen(
                    course.recruitmentStart,
                    course.recruitmentEnd,
                  );

                return (
                <div key={course.id} className="course-card">
                  <div className="course-card-header">
                    <div className="course-title">
                      <h3>{course.name}</h3>
                      <p className="course-description">
                        {course.description || "Brak opisu dla tego programu."}
                      </p>
                    </div>
                    <span className="course-price">{course.price} PLN</span>
                  </div>
                  <div className="course-meta">
                    {hasRecruitmentRange && (
                      <span className="meta-tag meta-tag--dates">
                        <span className="meta-label">
                          {recruitmentOpen
                            ? "Rekrutacja otwarta"
                            : "Rekrutacja"}
                        </span>
                        <span className="meta-dates">
                          {course.recruitmentStart} - {course.recruitmentEnd}
                        </span>
                      </span>
                    )}
                    {course.coordinatorId && (
                      <span className="meta-tag">
                        Koordynator ID: {course.coordinatorId}
                      </span>
                    )}
                  </div>
                  {isLoggedIn ? (
                    <div className="course-card-actions">
                      <Link
                        to={`/admission?courseId=${course.id}`}
                        className="primary-btn"
                      >
                        Aplikuj
                      </Link>
                    </div>
                  ) : null}
                </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
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
                Link do dyplomu (PDF)
                <input
                  type="url"
                  name="diplomaUrl"
                  value={draft.diplomaUrl}
                  onChange={onDraftInput}
                  onBlur={onFieldBlur}
                  disabled={isSubmitting}
                  aria-invalid={getInputAriaInvalid("diplomaUrl")}
                />
                {renderFieldError("diplomaUrl")}
              </label>
              <p className="admission-hint">
                Na tym etapie wystarczy link. Przesyłanie plików zostanie dodane
                później.
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
      )}
    </section>
  );
}

export default AdmissionPage;
