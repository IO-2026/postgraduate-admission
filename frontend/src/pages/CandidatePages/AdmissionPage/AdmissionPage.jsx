import "./AdmissionPage.css";
import "../CoursesPage/CoursesPage.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import BackButton from "../../../components/BackButton/BackButton";
import { useEffect, useMemo, useState } from "react";
import { submitApplication } from "../../../services/admissionApi.js";
import { fetchCourses } from "../../../services/courseApi";
import { fetchApplicationsOfUser } from "../../../services/applicationApi";
import { formatDisplayDate } from "../../../utils/dateFormat";

function resolveUserId(user) {
  if (!user || typeof user !== "object") return null;
  if (typeof user.id === "number") return user.id;
  if (typeof user.userId === "number") return user.userId;

  const parsedId = Number.parseInt(String(user.id ?? user.userId ?? ""), 10);
  return Number.isNaN(parsedId) ? null : parsedId;
}
const REQUIRED_ERROR = "To pole jest wymagane.";
const MAX_DIPLOMA_BYTES = 10 * 1024 * 1024;
const PDF_MIME_TYPE = "application/pdf";
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

function isValidPesel(value, dateOfBirth) {
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
  if (checksum !== Number.parseInt(pesel[10], 10)) {
    return false;
  }

  if (!dateOfBirth || String(dateOfBirth).trim() === "") {
    return false;
  }

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return false;
  }

  let year = Number(pesel.substring(0, 2));
  let month = Number(pesel.substring(2, 4));
  const day = Number(pesel.substring(4, 6));

  let century = 1900;

  if (month > 80) {
    century = 1800;
    month -= 80;
  } else if (month > 60) {
    century = 2200;
    month -= 60;
  } else if (month > 40) {
    century = 2100;
    month -= 40;
  } else if (month > 20) {
    century = 2000;
    month -= 20;
  }

  year = century + year;

  const peselDate = new Date(year, month - 1, day);

  return (
    peselDate.getFullYear() === dob.getFullYear() &&
    peselDate.getMonth() === dob.getMonth() &&
    peselDate.getDate() === dob.getDate()
  );
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

function validateGraduationYear(gy, dob) {
  const gy_raw = String(gy || "").trim();
  if (!gy_raw) {
    return REQUIRED_ERROR;
  }

  if (!/^\d+$/.test(gy_raw)) {
    return "Rok ukończenia jest nieprawidłowy.";
  }

  const year = Number.parseInt(gy_raw, 10);
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    return "Rok ukończenia jest nieprawidłowy.";
  }
  const dobYear = new Date(dob).getFullYear();
  if (year < dobYear) {
    return "Rok ukończenia nie może być wcześniejszy niż rok urodzenia.";
  }

  return "";
}

function validateDraft({ account, draft, diplomaFile }) {
  const errors = {};

  if (isBlank(account.dateOfBirth)) {
    errors.dateOfBirth = REQUIRED_ERROR;
  } else if (!isPastDate(account.dateOfBirth)) {
    errors.dateOfBirth = "Data urodzenia musi być w przeszłości.";
  }

  if (isBlank(account.pesel)) {
    errors.pesel = "PESEL jest wymagany.";
  } else if (!account.dateOfBirth) {
    errors.pesel = "Najpierw podaj datę urodzenia.";
  } else if (!isValidPesel(account.pesel, account.dateOfBirth)) {
    errors.pesel = "Podaj poprawny numer PESEL zgodny z datą urodzenia.";
  }

  const placeOfBirth = String(account.placeOfBirth || "").trim();
  if (!placeOfBirth) {
    errors.placeOfBirth = REQUIRED_ERROR;
  } else if (placeOfBirth.length < 2 || placeOfBirth.length > 100) {
    errors.placeOfBirth = "Miejsce urodzenia musi mieć od 2 do 100 znaków.";
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

  const yearError = validateGraduationYear(
    draft.graduationYear,
    account.dateOfBirth,
  );
  if (yearError) {
    errors.graduationYear = yearError;
  }

  const university = String(draft.university || "").trim();
  if (!university) {
    errors.university = REQUIRED_ERROR;
  } else if (university.length < 2 || university.length > 200) {
    errors.university = "Nazwa uczelni musi mieć od 2 do 200 znaków.";
  }

  if (!diplomaFile) {
    errors.diplomaFile = REQUIRED_ERROR;
  } else if (diplomaFile.type !== PDF_MIME_TYPE) {
    errors.diplomaFile = "Dozwolony jest wyłącznie plik PDF.";
  } else if (diplomaFile.size > MAX_DIPLOMA_BYTES) {
    errors.diplomaFile = "Plik PDF nie może przekraczać 10 MB.";
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
    placeOfBirth: safeUser.placeOfBirth || "",
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
    newsletterConsent: Boolean(safeDraft.newsletterConsent),
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

function AdmissionPage({ isLoggedIn, user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseIdParam = searchParams.get("courseId");
  const courseId = courseIdParam ? parseInt(courseIdParam, 10) : null;

  const [account, setAccount] = useState(() => getAccountDefaults(user));
  const [draft, setDraft] = useState(() =>
    getDraftDefaults(loadDraft(courseId)),
  );
  const [diplomaFile, setDiplomaFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitInfo, setSubmitInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");
  const [appliedCourseIds, setAppliedCourseIds] = useState([]);
  const selectedCourse = useMemo(
    () => courses.find((course) => Number(course.id) === Number(courseId)),
    [courses, courseId],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccount(getAccountDefaults(user));
  }, [user]);

  useEffect(() => {
    if (courseId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(getDraftDefaults(loadDraft(courseId)));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDiplomaFile(null);
    }
  }, [courseId]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadApplications = async () => {
      const userId = resolveUserId(user);
      if (!isLoggedIn || !userId) return;

      try {
        const data = await fetchApplicationsOfUser(userId);
        if (!isActive) return;
        if (Array.isArray(data)) {
          setAppliedCourseIds(data.map((app) => Number(app.courseId)));
        }
      } catch {
        // Ignore error
      }
    };

    loadApplications();

    return () => {
      isActive = false;
    };
  }, [user, isLoggedIn]);

  useEffect(() => {
    if (courseId) {
      saveDraft(courseId, draft);
    }
  }, [courseId, draft]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors(validateDraft({ account, draft, diplomaFile }));
  }, [account, draft, diplomaFile]);

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

  const onDiplomaChange = (event) => {
    const file = event.target.files && event.target.files[0];
    setDiplomaFile(file || null);
    setTouched((prev) => ({ ...prev, diplomaFile: true }));
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

    const validationErrors = validateDraft({ account, draft, diplomaFile });
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSubmitError("Uzupełnij wymagane pola.");
      return;
    }

    if (!isLoggedIn) {
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

      const payload = {
        university: String(draft.university).trim(),
        courseId,
        candidateDateOfBirth: String(account.dateOfBirth).trim(),
        candidatePlaceOfBirth: String(account.placeOfBirth).trim(),
        candidatePesel: String(account.pesel).trim(),
        addressStreet: String(draft.street).trim(),
        addressPostalCode: String(draft.postalCode).trim(),
        addressCity: String(draft.city).trim(),
        previousDegree: previousDegree || null,
        fieldOfStudy: fieldOfStudy || null,
        graduationYear:
          Number.isFinite(graduationYear) && graduationYear > 0
            ? graduationYear
            : null,
        notes: notes || null,
        truthfulnessConsent: Boolean(draft.truthfulnessConsent),
        gdprConsent: Boolean(draft.gdprConsent),
        newsletterConsent: Boolean(draft.newsletterConsent),
      };

      await submitApplication({ payload, diplomaFile });

      clearDraft(courseId);
      setDiplomaFile(null);
      navigate("/admission/success");
    } catch (requestError) {
      setSubmitError(requestError?.message || "Nie udało się wysłać wniosku.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const missingSession = !isLoggedIn;
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
      <BackButton
        to={courseId ? "/admission" : "/"}
        label={courseId ? "Wróć do wyboru kierunku" : "Wróć do strony głównej"}
      />
      <header className="admission-header">
        <p className="admission-tag">Studia podyplomowe AGH</p>
        <h1>Wniosek rekrutacyjny</h1>
        {courseId ? (
          <p className="admission-subtitle">
            Wybrany kierunek:{" "}
            <strong>
              {selectedCourse?.name ||
                (coursesLoading ? "Ładowanie..." : "Wybrany kierunek")}
            </strong>
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
                          {course.description ||
                            "Brak opisu dla tego programu."}
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
                            <span>
                              Od{" "}
                              <strong>
                                {formatDisplayDate(course.recruitmentStart)}
                              </strong>
                            </span>
                            <span>
                              Do{" "}
                              <strong>
                                {formatDisplayDate(course.recruitmentEnd)}
                              </strong>
                            </span>
                          </span>
                        </span>
                      )}
                    </div>
                    {isLoggedIn ? (
                      <div className="course-card-actions">
                        {appliedCourseIds.includes(Number(course.id)) ? (
                          <button
                            disabled
                            className="primary-btn"
                            style={{ opacity: 0.6, cursor: "not-allowed" }}
                          >
                            Już aplikowano
                          </button>
                        ) : (
                          <Link
                            to={`/admission?courseId=${course.id}`}
                            className="primary-btn"
                          >
                            Aplikuj
                          </Link>
                        )}
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
                Sesja wygasła. Zaloguj się ponownie.
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
              <p className="admission-hint">
                Pola oznaczone gwiazdką (
                <span className="required-star">*</span>) są wymagane.
              </p>
              <section className="admission-section" aria-label="Dane konta">
                <h2>Dane kandydata</h2>

                <label>
                  <span>
                    E-mail <span className="required-star">*</span>
                  </span>
                  <input type="email" value={account.email} readOnly />
                </label>

                <label>
                  <span>
                    Data urodzenia <span className="required-star">*</span>
                  </span>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={account.candidateDateOfBirth}
                    onChange={onAccountInput}
                    onBlur={onFieldBlur}
                    disabled={isSubmitting}
                    aria-invalid={getInputAriaInvalid("dateOfBirth")}
                  />
                  {renderFieldError("dateOfBirth")}
                </label>

                <div className="admission-grid">
                  <label>
                    <span>
                      PESEL <span className="required-star">*</span>
                    </span>
                    <input
                      type="text"
                      name="pesel"
                      value={account.candidatePesel}
                      onChange={onAccountInput}
                      onBlur={onFieldBlur}
                      disabled={isSubmitting}
                      aria-invalid={getInputAriaInvalid("pesel")}
                    />
                    {renderFieldError("pesel")}
                  </label>

                  <label>
                    <span>
                      Miejsce urodzenia <span className="required-star">*</span>
                    </span>
                    <input
                      type="text"
                      name="placeOfBirth"
                      value={account.candidatePlaceOfBirth}
                      onChange={onAccountInput}
                      onBlur={onFieldBlur}
                      disabled={isSubmitting}
                      aria-invalid={getInputAriaInvalid("placeOfBirth")}
                    />
                    {renderFieldError("placeOfBirth")}
                  </label>
                </div>
              </section>

              <section
                className="admission-section"
                aria-label="Dane do wniosku"
              >
                <h2>Informacje o ukończonej uczelni</h2>

                <label>
                  <span>
                    Uczelnia <span className="required-star">*</span>
                  </span>
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
                    <span>
                      Ulica i numer budynku{" "}
                      <span className="required-star">*</span>
                    </span>
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
                    <span>
                      Kod pocztowy <span className="required-star">*</span>
                    </span>
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
                  <span>
                    Miasto <span className="required-star">*</span>
                  </span>
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
                    <span>
                      Otrzymany tytuł <span className="required-star">*</span>
                    </span>
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
                    <span>
                      Kierunek <span className="required-star">*</span>
                    </span>
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
                  <span>
                    Rok ukończenia <span className="required-star">*</span>
                  </span>
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
                  <span>
                    Dyplom (PDF) <span className="required-star">*</span>
                  </span>
                  <input
                    type="file"
                    name="diplomaFile"
                    accept="application/pdf"
                    onChange={onDiplomaChange}
                    disabled={isSubmitting}
                    aria-invalid={getInputAriaInvalid("diplomaFile")}
                  />
                  {renderFieldError("diplomaFile")}
                </label>
                <p className="admission-hint">
                  Dodaj skan dyplomu w formacie PDF (maksymalnie 10 MB).
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
                  <span>
                    Oświadczam, że dane są prawdziwe.{" "}
                    <span className="required-star">*</span>
                  </span>
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
                    przeprowadzenia rekrutacji (RODO).{" "}
                    <span className="required-star">*</span>
                  </span>
                </label>
                {renderFieldError("gdprConsent")}

                <label className="admission-checkbox">
                  <input
                    type="checkbox"
                    name="newsletterConsent"
                    checked={draft.newsletterConsent}
                    onChange={onDraftCheckbox}
                    disabled={isSubmitting}
                    aria-invalid={getInputAriaInvalid("newsletterConsent")}
                  />
                  <span>
                    Zgadzam się na otrzymywanie informacji o nowych kierunkach i
                    ofertach edukacyjnych (newsletter).
                  </span>
                </label>
                {renderFieldError("newsletterConsent")}
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
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

export default AdmissionPage;
