import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAvailableRecipients,
  sendMessage,
} from "../../../services/messageApi.js";
import {
  fetchCoursesOfCoordinator,
  fetchCourses,
  fetchCourseCandidates,
} from "../../../services/courseApi.js";
import "./SendMessagePage.css";

function SendMessagePage({ user }) {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);

  // New state for course-based recipients
  const [activeTab, setActiveTab] = useState("all"); // "all" | "course"
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseCandidates, setCourseCandidates] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingCourseCandidates, setLoadingCourseCandidates] = useState(false);

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

    const loadCourses = async () => {
      setLoadingCourses(true);
      try {
        let data = [];
        if (user?.role === "Coordinator") {
          data = await fetchCoursesOfCoordinator(user.id);
        } else if (user?.role === "Admin") {
          data = await fetchCourses();
        }
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId(data[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setLoadingCourses(false);
      }
    };

    if (user?.id) {
      fetchCandidates();
      loadCourses();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "course" && selectedCourseId) {
      const loadCourseCandidates = async () => {
        setLoadingCourseCandidates(true);
        try {
          const data = await fetchCourseCandidates(selectedCourseId);
          setCourseCandidates(data);
        } catch (err) {
          console.error("Failed to load course candidates:", err);
          setCourseCandidates([]);
        } finally {
          setLoadingCourseCandidates(false);
        }
      };
      loadCourseCandidates();
    }
  }, [activeTab, selectedCourseId]);

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

  const getDisplayedCandidates = () => {
    return activeTab === "all" ? recipients : courseCandidates;
  };

  const toggleSelectAll = () => {
    const displayed = getDisplayedCandidates();
    const displayedIds = displayed.map((c) => c.id);

    // Check if all currently displayed are selected
    const allDisplayedSelected = displayedIds.every((id) =>
      selectedIds.includes(id),
    );

    if (allDisplayedSelected) {
      // Unselect all displayed
      setSelectedIds(selectedIds.filter((id) => !displayedIds.includes(id)));
    } else {
      // Select all displayed, keeping existing selections
      const newSelections = displayedIds.filter(
        (id) => !selectedIds.includes(id),
      );
      setSelectedIds([...selectedIds, ...newSelections]);
    }
  };

  const toggleRecipient = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const areAllDisplayedSelected = () => {
    const displayed = getDisplayedCandidates();
    if (displayed.length === 0) return false;
    return displayed.every((c) => selectedIds.includes(c.id));
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
              style={{ resize: "vertical" }}
            />
          </div>

          {!toAll && (
            <div className="recipients-section">
              <label>Odbiorcy</label>
              <div className="recipients-tabs">
                <button
                  type="button"
                  className={activeTab === "all" ? "primary-btn" : "ghost-btn"}
                  onClick={() => setActiveTab("all")}
                >
                  Wszyscy dostępni
                </button>
                <button
                  type="button"
                  className={
                    activeTab === "course" ? "primary-btn" : "ghost-btn"
                  }
                  onClick={() => setActiveTab("course")}
                >
                  Według kierunku
                </button>

                {activeTab === "course" && (
                  <div className="course-selector">
                    {loadingCourses ? (
                      <span>Ładowanie kierunków...</span>
                    ) : courses.length > 0 ? (
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="form-select"
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>Brak dostępnych kierunków.</span>
                    )}
                  </div>
                )}
              </div>

              <div className="recipients-list">
                <div className="recipients-header">
                  <span>
                    Wybierz odbiorców {activeTab === "course" && `(Kierunek)`}:
                  </span>
                  <button
                    type="button"
                    className="ghost-btn-small"
                    onClick={toggleSelectAll}
                    disabled={activeTab === "course" && loadingCourseCandidates}
                  >
                    {areAllDisplayedSelected()
                      ? "Odznacz wszystkich"
                      : "Zaznacz wszystkich"}
                  </button>
                </div>

                <div className="recipients-grid">
                  {activeTab === "course" && loadingCourseCandidates ? (
                    <span>Ładowanie kandydatów...</span>
                  ) : getDisplayedCandidates().length > 0 ? (
                    getDisplayedCandidates().map((candidate) => (
                      <label key={candidate.id} className="recipient-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(candidate.id)}
                          onChange={() => toggleRecipient(candidate.id)}
                        />
                        {candidate.name} {candidate.surname} ({candidate.email})
                      </label>
                    ))
                  ) : (
                    <span>Brak kandydatów do wyświetlenia.</span>
                  )}
                </div>
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
