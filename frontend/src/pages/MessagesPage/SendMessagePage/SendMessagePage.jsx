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
import BackButton from "../../../components/BackButton/BackButton";
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
  const [recipientSearch, setRecipientSearch] = useState("");

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
        if (user?.role === "Coordinator" || user?.roleName === "Coordinator") {
          data = await fetchCoursesOfCoordinator(user.id);
        } else if (user?.role === "Admin" || user?.roleName === "Admin") {
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
    const base = activeTab === "all" ? recipients : courseCandidates;
    if (!recipientSearch.trim()) return base;
    const term = recipientSearch.trim().toLowerCase();
    return base.filter((c) => {
      const full =
        `${c.name || ""} ${c.surname || ""} ${c.email || ""}`.toLowerCase();
      return full.includes(term);
    });
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
      <BackButton />
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
                  Wszyscy
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

                <input
                  type="search"
                  className="recipients-search"
                  placeholder="Szukaj po imieniu, nazwisku lub e-mailu…"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                />

                <div className="recipients-table-container">
                  {activeTab === "course" && loadingCourseCandidates ? (
                    <span className="recipients-empty">
                      Ładowanie kandydatów...
                    </span>
                  ) : getDisplayedCandidates().length > 0 ? (
                    <table className="recipients-table">
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}></th>
                          <th>Imię i nazwisko</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getDisplayedCandidates().map((candidate) => (
                          <tr
                            key={candidate.id}
                            className={
                              selectedIds.includes(candidate.id)
                                ? "selected"
                                : ""
                            }
                            onClick={() => toggleRecipient(candidate.id)}
                          >
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(candidate.id)}
                                onChange={() => toggleRecipient(candidate.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td>
                              {candidate.name} {candidate.surname}
                            </td>
                            <td>{candidate.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <span className="recipients-empty">
                      Brak kandydatów do wyświetlenia.
                    </span>
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
