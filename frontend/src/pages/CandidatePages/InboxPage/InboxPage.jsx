import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchInbox, markAsRead } from "../../../services/messageApi";
import BackButton from "../../../components/BackButton/BackButton";
import "./InboxPage.css";

function InboxPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMsg, setSelectedMsg] = useState(null);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await fetchInbox();
      setMessages(data);
    } catch (err) {
      setError(err.message || "Nie udało się pobrać wiadomości.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleMarkAsRead = async (recipientId) => {
    try {
      await markAsRead(recipientId);
      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.recipientId === recipientId ? { ...msg, isRead: true } : msg,
        ),
      );
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
      <BackButton />
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
                    <span className="inbox-sender">{msg.senderName}</span>
                    <span className="inbox-date">{formatDate(msg.sentAt)}</span>
                  </div>
                  <div className="inbox-subject">{msg.subject}</div>
                </div>
              ))}
            </div>
            {selectedMsg && (
              <div className="inbox-detail">
                <div className="inbox-detail-header">
                  <h3>{selectedMsg.subject}</h3>
                  <p className="inbox-detail-meta">
                    Od: {selectedMsg.senderName} |{" "}
                    {formatDate(selectedMsg.sentAt)}
                  </p>
                </div>
                <div className="inbox-detail-content">
                  {selectedMsg.content.split("\n").map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default InboxPage;
