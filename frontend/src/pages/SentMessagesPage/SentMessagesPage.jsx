import {useEffect, useState} from "react";
import {getSentMessages} from "../../services/messageApi";
import "./SentMessagesPage.css";

function SentMessagesPage() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState(null);

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

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) return <div className="loading-state">Ładowanie wysłanych wiadomości...</div>;
    if (error) return <div className="error-state">{error}</div>;

    return (
        <section className="sent-messages-view">
            <div className="sent-messages-card">
                <h1>Wysłane wiadomości</h1>
                {messages.length === 0 ? (
                    <p className="sent-messages-empty">Nie wysłałeś jeszcze żadnej wiadomości.</p>
                ) : (
                    <div className="sent-messages-list">
                        {messages.map((msg) => (
                            <div key={msg.messageId} className="sent-message-item">
                                <div className="sent-message-summary" onClick={() => toggleExpand(msg.messageId)}>
                                    <div className="sent-message-header">
                                        <span className="sent-message-subject">{msg.subject}</span>
                                        <span className="sent-message-date">{formatDate(msg.sentAt)}</span>
                                    </div>
                                    <div className="sent-message-recipients-count">
                                        {msg.recipients.length} odbiorc{msg.recipients.length === 1 ? "a" : "ów"}
                                    </div>
                                </div>
                                {expandedId === msg.messageId && (
                                    <div className="sent-message-details">
                                        <div className="sent-message-content">
                                            <strong>Treść:</strong>
                                            <p>{msg.content}</p>
                                        </div>
                                        <div className="sent-message-recipients">
                                            <strong>Odbiorcy:</strong>
                                            <ul>
                                                {msg.recipients.map((rec) => (
                                                    <li key={rec.recipientId}>
                                                        {rec.recipientNameAndSurname || `ID: ${rec.recipientId}`}
                                                        {rec.recipientEmail && ` (${rec.recipientEmail})`}
                                                        <span
                                                            className={`recipient-status ${rec.isRead ? "read" : "unread"}`}>
                              {rec.isRead ? "✓ przeczytano" : "○ nieprzeczytana"}
                            </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default SentMessagesPage;