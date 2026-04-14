import { useEffect, useMemo, useState } from "react";
import "./AdmissionPage.css";

const FORM_BASE_PATH = "/api/admission/form";

function buildInitialValue(type) {
  if (type === "checkbox") {
    return false;
  }

  if (type === "file") {
    return null;
  }

  return "";
}

function normalizeFormData(fields) {
  return fields.reduce((acc, field) => {
    acc[field.name] = buildInitialValue(field.type);
    return acc;
  }, {});
}

function runPlannedValidation(data, fields) {
  const errors = {};

  for (const field of fields) {
    if (!field.required) {
      continue;
    }

    const value = data[field.name];

    if (field.type === "checkbox") {
      if (!value) {
        errors[field.name] = "Musisz zaakceptować to pole.";
      }

      continue;
    }

    if (field.type === "file") {
      if (!(value instanceof File)) {
        errors[field.name] = "Wymagany plik.";
      }

      continue;
    }

    if (String(value ?? "").trim() === "") {
      errors[field.name] = "Pole wymagane.";
    }
  }

  return errors;
}

async function parseResponsePayload(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function getPayloadErrorMessage(payload) {
  if (payload && typeof payload === "object" && payload.message) {
    return payload.message;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return "Nie udało się wysłać formularza.";
}

function AdmissionPage() {
  const [formMeta, setFormMeta] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [submitResult, setSubmitResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    async function loadForm() {
      setIsLoading(true);
      setApiError("");

      try {
        const response = await fetch(FORM_BASE_PATH);
        const payload = await parseResponsePayload(response);

        if (!response.ok) {
          throw new Error(getPayloadErrorMessage(payload));
        }

        setFormMeta(payload);
        setFormData(normalizeFormData(payload.fields ?? []));
      } catch (error) {
        setApiError(
          error instanceof Error && error.message
            ? error.message
            : "Brak połączenia z backendem.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadForm();
  }, []);

  const fields = useMemo(() => formMeta?.fields ?? [], [formMeta]);

  function updateField(name, value) {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const plannedErrors = runPlannedValidation(formData, fields);
    setValidationErrors(plannedErrors);

    if (Object.keys(plannedErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setApiError("");
    setSubmitResult(null);

    try {
      const hasFileField = fields.some((field) => field.type === "file");

      const requestBody = hasFileField
        ? (() => {
            const dataPayload = {};

            for (const field of fields) {
              if (field.type === "file") {
                continue;
              }

              dataPayload[field.name] = formData[field.name];
            }

            const multipart = new FormData();
            multipart.append(
              "data",
              new Blob([JSON.stringify(dataPayload)], {
                type: "application/json",
              }),
            );

            const diploma = formData.diploma;
            if (diploma instanceof File) {
              multipart.append("diploma", diploma);
            }

            const profilePicture = formData.profilePicture;
            if (profilePicture instanceof File) {
              multipart.append("profilePicture", profilePicture);
            }

            return multipart;
          })()
        : JSON.stringify(formData);

      const response = await fetch(`${FORM_BASE_PATH}/submit`, {
        method: "POST",
        headers: hasFileField
          ? undefined
          : {
              "Content-Type": "application/json",
            },
        body: requestBody,
      });

      const payload = await parseResponsePayload(response);

      if (!response.ok) {
        throw new Error(getPayloadErrorMessage(payload));
      }

      setSubmitResult(payload);
    } catch (error) {
      setApiError(
        error instanceof Error && error.message
          ? error.message
          : "Nie udało się wysłać formularza. Spróbuj ponownie później.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderField(field) {
    const value = formData[field.name];

    if (field.type === "file") {
      const accept =
        field.name === "diploma"
          ? "application/pdf"
          : field.name === "profilePicture"
            ? "image/png"
            : undefined;

      return (
        <input
          id={field.name}
          name={field.name}
          type="file"
          accept={accept}
          onChange={(event) =>
            updateField(field.name, event.target.files?.[0] ?? null)
          }
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <textarea
          id={field.name}
          name={field.name}
          value={value ?? ""}
          placeholder={field.placeholder ?? ""}
          onChange={(event) => updateField(field.name, event.target.value)}
          rows={4}
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          id={field.name}
          name={field.name}
          value={value ?? ""}
          onChange={(event) => updateField(field.name, event.target.value)}
        >
          <option value="">Wybierz opcję</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "checkbox") {
      return (
        <label className="admission-checkbox" htmlFor={field.name}>
          <input
            id={field.name}
            name={field.name}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => updateField(field.name, event.target.checked)}
          />
          <span>
            {field.label}
            {field.required ? " *" : ""}
          </span>
        </label>
      );
    }

    return (
      <input
        id={field.name}
        name={field.name}
        type={field.type}
        value={value ?? ""}
        placeholder={field.placeholder ?? ""}
        onChange={(event) => updateField(field.name, event.target.value)}
      />
    );
  }

  return (
    <section className="admission-view" aria-label="Strona rekrutacji">
      <div className="admission-shell">
        <header className="admission-header">
          <p className="admission-tag">Postgraduate Admission</p>
          <h1>{formMeta?.title ?? "Formularz rekrutacyjny"}</h1>
          <p className="admission-subtitle">
            {formMeta?.description ??
              "Formularz jest gotowy do podpięcia walidacji i zapisu danych."}
          </p>
        </header>

        {isLoading ? (
          <p className="admission-alert admission-alert--info">
            Ładowanie formularza...
          </p>
        ) : (
          <form className="admission-form" onSubmit={handleSubmit} noValidate>
            {fields.map((field) => (
              <div className="admission-field" key={field.name}>
                {field.type !== "checkbox" ? (
                  <label htmlFor={field.name}>
                    {field.label}
                    {field.required ? " *" : ""}
                  </label>
                ) : null}

                {renderField(field)}

                {field.validationHint ? (
                  <p className="admission-hint">
                    Plan walidacji: {field.validationHint}
                  </p>
                ) : null}

                {validationErrors[field.name] ? (
                  <p className="admission-error">
                    {validationErrors[field.name]}
                  </p>
                ) : null}
              </div>
            ))}

            <div className="admission-actions">
              <button
                type="submit"
                className="primary-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Wysyłanie..." : "Wyślij formularz"}
              </button>
            </div>
          </form>
        )}

        {apiError ? (
          <p className="admission-alert admission-alert--error">{apiError}</p>
        ) : null}

        {submitResult ? (
          <article className="admission-alert admission-alert--success">
            <h2>Status wysyłki: {submitResult.status}</h2>
            <p>{submitResult.message}</p>
            <p>
              Numer zgłoszenia: <strong>{submitResult.submissionId}</strong>
            </p>
          </article>
        ) : null}
      </div>
    </section>
  );
}

export default AdmissionPage;
