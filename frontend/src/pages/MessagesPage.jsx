import { Link } from 'react-router-dom'

function MessagesPage() {
  return (
    <section className="messages-view">
      <div className="messages-card">
        <h1>Messages</h1>
        <p className="messages-subtitle">
          All your admission-related communication appears here.
        </p>
        <p className="messages-empty">No messages yet.</p>

        <Link className="ghost-link" to="/">
          Back to home
        </Link>
      </div>
    </section>
  )
}

export default MessagesPage
