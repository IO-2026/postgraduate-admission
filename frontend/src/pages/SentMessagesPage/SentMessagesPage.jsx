import { useEffect, useState } from "react";
import { getSentMessages } from "../../services/messageApi";
import "./SentMessagesPage.css";

function SentMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMsg, setSelectedMsg] = useState(null);

  useEffect(() => {
    const loadSentMessages = async () => {
      try {
        setLoading(true);
        const data = await getSentMessages();
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Nie udało się pobrać wysłanych wiadomości.");
      } finally {
        setLoading(false);
      }
    };
    loadSentMessages();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleOpenMessage = (msg) => {
    setSelectedMsg(msg);
  };

  if (loading)
    return (
      <div className="loading-state">Ładowanie wysłanych wiadomości...</div>
    );
  if (error) return <div className="error-state">{error}</div>;

  return (
    <section className="sent-messages-view">
      <div className="sent-messages-card">
        <h1>Wysłane wiadomości</h1>
        {messages.length === 0 ? (
          <p className="sent-messages-empty">
            Nie wysłałeś jeszcze żadnej wiadomości.
          </p>
        ) : (
          <div className="sent-messages-layout">
            <div className="sent-messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.messageId}
                  className={`sent-messages-item ${selectedMsg?.messageId === msg.messageId ? "active" : ""}`}
                  onClick={() => handleOpenMessage(msg)}
                >
                  <div className="sent-messages-item-header">
                    <span className="sent-messages-sender">
                      Do: {msg.recipients.length} odbiorc
                      {msg.recipients.length === 1 ? "a" : "ów"}
                    </span>
                    <span className="sent-messages-date">
                      {formatDate(msg.sentAt)}
                    </span>
                  </div>
                  <div className="sent-messages-subject">{msg.subject}</div>
                </div>
              ))}
            </div>

            {selectedMsg ? (
              <div className="sent-messages-detail animate-fade-in">
                <div className="sent-messages-detail-header">
                  <h3>{selectedMsg.subject}</h3>
                  <p className="sent-messages-detail-meta">
                    Wysłano: <strong>{formatDate(selectedMsg.sentAt)}</strong>
                  </p>
                </div>
                <div className="sent-messages-detail-content">
                  {selectedMsg.content.split("\n").map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>

                <div className="sent-messages-recipients-section">
                  <h4>Odbiorcy ({selectedMsg.recipients.length})</h4>
                  <ul className="sent-messages-recipients">
                    {selectedMsg.recipients.map((rec) => (
                      <li key={rec.recipientId}>
                        {rec.recipientName || `ID: ${rec.recipientId}`}
                        {rec.recipientEmail && ` (${rec.recipientEmail})`}
                        <span
                          className={`recipient-status ${rec.isRead ? "read" : "unread"}`}
                        >
                          {rec.isRead ? "przeczytano" : "nieprzeczytana"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="sent-messages-detail-placeholder animate-fade-in">
                <svg
                  className="placeholder-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <p>
                  Wybierz wiadomość z listy, aby odczytać jej treść i zobaczyć
                  odbiorców
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default SentMessagesPage;
