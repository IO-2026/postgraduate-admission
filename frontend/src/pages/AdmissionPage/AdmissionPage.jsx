import "./AdmissionPage.css";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { submitApplication } from "../../services/admissionApi";

const AUTH_STORAGE_KEY = "pg-admission-auth";
const DEFAULT_COURSE_ID = 1;

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

function updateAuthUser(patch) {
  const current = loadAuthState();
  if (!current) {
    return;
  }

  const currentUser =
    current.user && typeof current.user === "object" ? current.user : {};
  const nextUser = {
    ...currentUser,
    ...patch,
  };

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      ...current,
      user: nextUser,
    }),
  );
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
    ["diplomaUrl", draft.diplomaUrl],
  ];

  for (const [key, value] of requiredFields) {
    if (!String(value || "").trim()) {
      errors[key] = "To pole jest wymagane.";
    }
  }

  if (!draft.truthfulnessConsent) {
    errors.truthfulnessConsent = "Wymagana zgoda.";
  }

  if (!draft.gdprConsent) {
    errors.gdprConsent = "Wymagana zgoda.";
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

function AdmissionPage() {
  const courseId = DEFAULT_COURSE_ID;
  const authState = useMemo(loadAuthState, []);
  const token = authState?.token || null;
  const user = authState?.user || null;
  const userId = user?.id ?? null;

  const [account, setAccount] = useState(() => getAccountDefaults(user));
  const [draft, setDraft] = useState(() =>
    getDraftDefaults(loadDraft(courseId)),
  );
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitInfo, setSubmitInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAccount(getAccountDefaults(user));
  }, [user]);

  useEffect(() => {
    saveDraft(courseId, draft);
  }, [courseId, draft]);

  const onAccountInput = (event) => {
    const { name, value } = event.target;
    setAccount((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };
      return next;
    });

    updateAuthUser({ [name]: value });
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
    setSubmitError("");
    setSubmitInfo("");

    const validationErrors = validateDraft({ account, draft });
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSubmitError("Uzupełnij wymagane pola.");
      return;
    }

    if (!token || !userId) {
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
          userId,
          applicant: {
            name: String(account.name).trim(),
            surname: String(account.surname).trim(),
            telNumber: String(account.telNumber).trim(),
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
      setSubmitInfo("Wniosek został wysłany.");
    } catch (requestError) {
      setSubmitError(requestError?.message || "Nie udało się wysłać wniosku.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const missingSession = !token || !userId;

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
              Brakuje danych sesji (token lub identyfikator użytkownika).
              Zaloguj się ponownie.
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
                <input type="email" value={account.email} disabled readOnly />
              </label>

              <div className="admission-grid">
                <label>
                  Imię
                  <input
                    type="text"
                    name="name"
                    value={account.name}
                    onChange={onAccountInput}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.name)}
                  />
                </label>

                <label>
                  Nazwisko
                  <input
                    type="text"
                    name="surname"
                    value={account.surname}
                    onChange={onAccountInput}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.surname)}
                  />
                </label>
              </div>

              <div className="admission-grid">
                <label>
                  Numer telefonu
                  <input
                    type="tel"
                    name="telNumber"
                    value={account.telNumber}
                    onChange={onAccountInput}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.telNumber)}
                  />
                </label>

                <label>
                  Data urodzenia
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={account.dateOfBirth}
                    onChange={onAccountInput}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.dateOfBirth)}
                  />
                </label>
              </div>

              <label>
                PESEL
                <input
                  type="text"
                  name="pesel"
                  value={account.pesel}
                  onChange={onAccountInput}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.pesel)}
                />
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
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.university)}
                />
              </label>

              <div className="admission-grid">
                <label>
                  Ulica i numer
                  <input
                    type="text"
                    name="street"
                    value={draft.street}
                    onChange={onDraftInput}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.street)}
                  />
                </label>

                <label>
                  Kod pocztowy
                  <input
                    type="text"
                    name="postalCode"
                    value={draft.postalCode}
                    onChange={onDraftInput}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.postalCode)}
                  />
                </label>
              </div>

              <label>
                Miasto
                <input
                  type="text"
                  name="city"
                  value={draft.city}
                  onChange={onDraftInput}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.city)}
                />
              </label>

              <div className="admission-grid">
                <label>
                  Poprzedni stopień
                  <input
                    type="text"
                    name="previousDegree"
                    value={draft.previousDegree}
                    onChange={onDraftInput}
                    disabled={isSubmitting}
                  />
                </label>

                <label>
                  Kierunek ukończonych studiów
                  <input
                    type="text"
                    name="fieldOfStudy"
                    value={draft.fieldOfStudy}
                    onChange={onDraftInput}
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              <label>
                Rok ukończenia
                <input
                  type="text"
                  name="graduationYear"
                  value={draft.graduationYear}
                  onChange={onDraftInput}
                  disabled={isSubmitting}
                />
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
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.diplomaUrl)}
                />
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
                  aria-invalid={Boolean(errors.truthfulnessConsent)}
                />
                <span>Oświadczam, że dane są prawdziwe.</span>
              </label>

              <label className="admission-checkbox">
                <input
                  type="checkbox"
                  name="gdprConsent"
                  checked={draft.gdprConsent}
                  onChange={onDraftCheckbox}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.gdprConsent)}
                />
                <span>
                  Wyrażam zgodę na przetwarzanie moich danych osobowych w celu
                  przeprowadzenia rekrutacji (RODO).
                </span>
              </label>
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
                disabled={isSubmitting}
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
          </form>
        )}
      </div>
    </section>
  );
}

export default AdmissionPage;
