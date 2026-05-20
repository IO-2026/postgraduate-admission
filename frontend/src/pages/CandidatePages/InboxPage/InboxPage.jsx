import { useEffect, useState } from "react";
import { fetchInbox, markAsRead } from "../../../services/messageApi";
import "./InboxPage.css";

const INBOX_UNREAD_EVENT = "inbox-unread-count-updated";

function InboxPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMsg, setSelectedMsg] = useState(null);

  const publishUnreadCount = (items) => {
    const unread = Array.isArray(items)
      ? items.filter((message) => !message.isRead).length
      : 0;

    window.dispatchEvent(
      new CustomEvent(INBOX_UNREAD_EVENT, {
        detail: { count: unread },
      }),
    );
  };

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const data = await fetchInbox();
        const safeMessages = Array.isArray(data) ? data : [];
        setMessages(safeMessages);
        publishUnreadCount(safeMessages);
      } catch (err) {
        setError(err.message || "Nie udało się pobrać wiadomości.");
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, []);

  const handleMarkAsRead = async (recipientId) => {
    try {
      await markAsRead(recipientId);
      // Update local state
      setMessages((prev) => {
        const updatedMessages = prev.map((msg) =>
          msg.recipientId === recipientId ? { ...msg, isRead: true } : msg,
        );
        publishUnreadCount(updatedMessages);
        return updatedMessages;
      });
      if (selectedMsg?.recipientId === recipientId) {
        setSelectedMsg({ ...selectedMsg, isRead: true });
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleOpenMessage = (msg) => {
    setSelectedMsg(msg);
    if (!msg.isRead) {
      handleMarkAsRead(msg.recipientId);
    }
  };

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

  if (loading)
    return <div className="loading-state">Ładowanie wiadomości...</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <section className="inbox-view">
      <div className="inbox-card">
        <h1>Wiadomości</h1>
        {messages.length === 0 ? (
          <p className="inbox-empty">Brak wiadomości.</p>
        ) : (
          <div className="inbox-layout">
            <div className="inbox-list">
              {messages.map((msg) => (
                <div
                  key={msg.recipientId}
                  className={`inbox-item ${!msg.isRead ? "unread" : ""} ${selectedMsg?.recipientId === msg.recipientId ? "active" : ""}`}
                  onClick={() => handleOpenMessage(msg)}
                >
                  <div className="inbox-item-header">
                    <div className="inbox-sender-wrapper">
                      {!msg.isRead && <span className="inbox-unread-dot" aria-label="Nieprzeczytane"></span>}
                      <span className="inbox-sender">{msg.senderName}</span>
                    </div>
                    <span className="inbox-date">{formatDate(msg.sentAt)}</span>
                  </div>
                  <div className="inbox-subject">{msg.subject}</div>
                </div>
              ))}
            </div>
            {selectedMsg ? (
              <div className="inbox-detail animate-fade-in">
                <div className="inbox-detail-header">
                  <h3>{selectedMsg.subject}</h3>
                  <p className="inbox-detail-meta">
                    Od: <strong>{selectedMsg.senderName}</strong> |{" "}
                    {formatDate(selectedMsg.sentAt)}
                  </p>
                </div>
                <div className="inbox-detail-content">
                  {selectedMsg.content.split("\n").map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="inbox-detail-placeholder animate-fade-in">
                <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <p>Wybierz wiadomość z listy, aby odczytać jej treść</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default InboxPage;
