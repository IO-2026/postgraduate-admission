import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAvailableRecipients,
  sendMessage,
} from "../../../services/messageApi.js";
import "./SendMessagePage.css";

function SendMessagePage({ user }) {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [toAll, setToAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const data = await getAvailableRecipients(user);
        setRecipients(data);
      } catch (err) {
        setError(err.message || "Nie udało się pobrać listy odbiorców.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchCandidates();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!subject.trim()) {
      setError("Temat jest wymagany.");
      return;
    }
    if (!content.trim()) {
      setError("Treść wiadomości jest wymagana.");
      return;
    }
    if (!toAll && selectedIds.length === 0) {
      setError(
        "Wybierz co najmniej jednego odbiorcę lub zaznacz 'Wszyscy kandydaci'.",
      );
      return;
    }

    setSending(true);
    try {
      await sendMessage({
        subject: subject.trim(),
        content: content.trim(),
        toAllCandidates: toAll,
        recipientIds: toAll ? undefined : selectedIds,
      });
      setSuccess("Wiadomość została wysłana!");
      setSubject("");
      setContent("");
      setSelectedIds([]);
      setToAll(false);
    } catch (err) {
      setError(err.message || "Wystąpił błąd podczas wysyłania.");
    } finally {
      setSending(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === recipients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(recipients.map((r) => r.id));
    }
  };

  const toggleRecipient = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  if (loading)
    return <div className="loading-state">Ładowanie listy kandydatów...</div>;

  return (
    <section className="send-message-view">
      <div className="send-message-top-actions">
        <Link className="ghost-link send-message-back-link" to="/">
          <svg
            className="send-message-back-icon"
            viewBox="0 0 24 24"
            fill="none"
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
      <div className="send-message-card">
        <h1>Wyślij wiadomość do kandydatów</h1>
        <form onSubmit={handleSubmit} className="send-message-form">
          <div className="form-group">
            <label htmlFor="subject">Temat</label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">Treść wiadomości</label>
            <textarea
              id="content"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              maxLength={4000}
            />
          </div>

          {!toAll && (
            <div className="recipients-list">
              <div className="recipients-header">
                <span>Wybierz odbiorców:</span>
                <button
                  type="button"
                  className="ghost-btn-small"
                  onClick={toggleSelectAll}
                >
                  {selectedIds.length === recipients.length
                    ? "Odznacz wszystkich"
                    : "Zaznacz wszystkich"}
                </button>
              </div>
              <div className="recipients-grid">
                {recipients.map((candidate) => (
                  <label key={candidate.id} className="recipient-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(candidate.id)}
                      onChange={() => toggleRecipient(candidate.id)}
                    />
                    {candidate.name} {candidate.surname} ({candidate.email})
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-info">{success}</div>}

          <div className="form-actions">
            <button type="submit" className="primary-btn" disabled={sending}>
              {sending ? "Wysyłanie..." : "Wyślij wiadomość"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default SendMessagePage;
