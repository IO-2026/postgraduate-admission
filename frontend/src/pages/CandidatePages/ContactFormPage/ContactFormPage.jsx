import { useState } from "react";
import BackButton from "../../../components/BackButton/BackButton";
import { sendContactForm } from "../../../services/contactApi";
import "./ContactFormPage.css";

function ContactFormPage() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!subject.trim()) {
      setError("Temat jest wymagany.");
      return;
    }
    if (!content.trim()) {
      setError("Treść wiadomości jest wymagana.");
      return;
    }

    setLoading(true);
    try {
      await sendContactForm({
        subject: subject.trim(),
        content: content.trim(),
      });
      setSuccess(true);
      setSubject("");
      setContent("");
    } catch (err) {
      setError(err.message || "Wystąpił błąd podczas wysyłania.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact-form-view">
      <BackButton />
      <div className="contact-form-card">
        <h1>Formularz kontaktowy</h1>
        <p className="contact-subtitle">
          Masz pytanie dotyczące rekrutacji lub oferty studiów? Napisz do nas –
          odpowiemy na przypisany do konta adres e-mail.
        </p>

        {success && (
          <div className="contact-success">
            <p>
              Wiadomość została wysłana! Odpowiemy najszybciej, jak to możliwe.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="subject">Temat</label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Treść wiadomości</label>
            <textarea
              id="content"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={4000}
              required
              disabled={loading}
            />
          </div>

          {error && <div className="contact-error">{error}</div>}

          <div className="contact-actions">
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Wysyłanie..." : "Wyślij wiadomość"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default ContactFormPage;
