import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

function buildInitialValue(type) {
  if (type === 'checkbox') {
    return false
  }

  if (type === 'file') {
    return null
  }

  return ''
}

function normalizeFormData(fields) {
  return fields.reduce((acc, field) => {
    acc[field.name] = buildInitialValue(field.type)
    return acc
  }, {})
}

function runPlannedValidation(data, fields) {
  const errors = {}

  for (const field of fields) {
    if (!field.required) {
      continue
    }

    const value = data[field.name]

    if (field.type === 'checkbox') {
      if (!value) {
        errors[field.name] = 'Musisz zaakceptowac to pole.'
      }

      continue
    }

    if (field.type === 'file') {
      if (!(value instanceof File)) {
        errors[field.name] = 'Wymagany plik.'
      }

      continue
    }

    if (String(value ?? '').trim() === '') {
      errors[field.name] = 'Pole wymagane.'
    }
  }

  return errors
}

function App() {
  const [formMeta, setFormMeta] = useState(null)
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [submitResult, setSubmitResult] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    async function loadForm() {
      setIsLoading(true)
      setApiError('')

      try {
        const response = await fetch(`${API_BASE_URL}/api/admission/form`)

        if (!response.ok) {
          throw new Error('Nie udalo sie pobrac definicji formularza.')
        }

        const payload = await response.json()
        setFormMeta(payload)
        setFormData(normalizeFormData(payload.fields ?? []))
      } catch {
        setApiError(
          'Brak polaczenia z backendem.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadForm()
  }, [])

  const fields = useMemo(() => formMeta?.fields ?? [], [formMeta])

  function updateField(name, value) {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const plannedErrors = runPlannedValidation(formData, fields)
    setValidationErrors(plannedErrors)

    if (Object.keys(plannedErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    setApiError('')
    setSubmitResult(null)

    try {
      const hasFileField = fields.some((field) => field.type === 'file')

      const requestBody = hasFileField
        ? (() => {
            const dataPayload = {}

            for (const field of fields) {
              if (field.type === 'file') {
                continue
              }

              dataPayload[field.name] = formData[field.name]
            }

            const multipart = new FormData()
            multipart.append(
              'data',
              new Blob([JSON.stringify(dataPayload)], {
                type: 'application/json',
              }),
            )

            const diploma = formData.diploma
            if (diploma instanceof File) {
              multipart.append('diploma', diploma)
            }

            const profilePicture = formData.profilePicture
            if (profilePicture instanceof File) {
              multipart.append('profilePicture', profilePicture)
            }

            return multipart
          })()
        : JSON.stringify(formData)

      const response = await fetch(`${API_BASE_URL}/api/admission/form/submit`, {
        method: 'POST',
        headers: hasFileField
          ? undefined
          : {
              'Content-Type': 'application/json',
            },
        body: requestBody,
      })

      if (!response.ok) {
        let errorMessage = 'Nie udalo sie wyslac formularza.'

        try {
          const errorPayload = await response.json()
          if (errorPayload?.message) {
            errorMessage = errorPayload.message
          }
        } catch {
          // ignore parsing errors, fall back to generic message
        }

        throw new Error(errorMessage)
      }

      const payload = await response.json()
      setSubmitResult(payload)
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Nie udalo sie wyslac formularza. Sprobuj ponownie pozniej.'
      setApiError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function renderField(field) {
    const value = formData[field.name]

    if (field.type === 'file') {
      const accept =
        field.name === 'diploma'
          ? 'application/pdf'
          : field.name === 'profilePicture'
            ? 'image/png'
            : undefined

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
      )
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          id={field.name}
          name={field.name}
          value={value ?? ''}
          placeholder={field.placeholder ?? ''}
          onChange={(event) => updateField(field.name, event.target.value)}
          rows={4}
        />
      )
    }

    if (field.type === 'select') {
      return (
        <select
          id={field.name}
          name={field.name}
          value={value ?? ''}
          onChange={(event) => updateField(field.name, event.target.value)}
        >
          <option value="">Wybierz opcje</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === 'checkbox') {
      return (
        <label className="checkbox-field" htmlFor={field.name}>
          <input
            id={field.name}
            name={field.name}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => updateField(field.name, event.target.checked)}
          />
          <span>{field.label}</span>
        </label>
      )
    }

    return (
      <input
        id={field.name}
        name={field.name}
        type={field.type}
        value={value ?? ''}
        placeholder={field.placeholder ?? ''}
        onChange={(event) => updateField(field.name, event.target.value)}
      />
    )
  }

  return (
    <main className="admission-page">
      <section className="admission-shell">
        <header className="form-header">
          <p className="eyebrow">Postgraduate Admission</p>
          <h1>{formMeta?.title ?? 'Formularz rekrutacyjny'}</h1>
          <p>
            {formMeta?.description ??
              'Scaffolding formularza jest gotowy do podpiecia walidacji i zapisu danych.'}
          </p>
        </header>

        {isLoading && <p className="status">Ladowanie formularza...</p>}

        {!isLoading && (
          <form className="admission-form" onSubmit={handleSubmit} noValidate>
            {fields.map((field) => (
              <div className="field-wrap" key={field.name}>
                {field.type !== 'checkbox' && (
                  <label htmlFor={field.name}>
                    {field.label}
                    {field.required ? ' *' : ''}
                  </label>
                )}

                {renderField(field)}
                

                {field.validationHint && (
                  <p className="hint">Plan walidacji: {field.validationHint}</p>
                )}

                {validationErrors[field.name] && (
                  <p className="field-error">{validationErrors[field.name]}</p>
                )}
              </div>
            ))}

            <div className="form-actions">
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Wysylanie...' : 'Wyslij formularz'}
              </button>
            </div>
          </form>
        )}

        {apiError && <p className="error-box">{apiError}</p>}

        {submitResult && (
          <article className="submit-box">
            <h2>Status wysylki: {submitResult.status}</h2>
            <p>{submitResult.message}</p>
            <p>
              Numer zgloszenia: <strong>{submitResult.submissionId}</strong>
            </p>
            <p>{submitResult.nextStep}</p>
          </article>
        )}
      </section>
    </main>
  )
}

export default App
