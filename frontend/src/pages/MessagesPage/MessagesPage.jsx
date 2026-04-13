import { Link } from 'react-router-dom'
import './MessagesPage.css'

function MessagesPage() {
  return (
    <section className="messages-view">
      <div className="messages-card">
        <h1>Wiadomości</h1>
        <p className="messages-subtitle">
          Tutaj pojawia się cała komunikacja związana z rekrutacją.
        </p>
        <p className="messages-empty">Brak wiadomości.</p>

        <Link className="ghost-link" to="/">
          Wróć do strony głównej
        </Link>
      </div>
    </section>
  )
}

export default MessagesPage
