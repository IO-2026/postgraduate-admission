import { Link } from 'react-router-dom'

function HomePage({ isLoggedIn }) {
  const applications = []

  if (!isLoggedIn) {
    return (
      <section className="gate-view" aria-label="Guest access gate">
        <Link className="primary-btn" to="/auth">
          Login
        </Link>
      </section>
    )
  }

  return (
    <section className="home-view">
      <header className="home-header">
        <Link className="profile-corner-btn" to="/profile" aria-label="Open profile">
          <svg
            className="profile-corner-icon"
            viewBox="0 0 24 24"
            fill="none"
            role="presentation"
            aria-hidden="true"
          >
            <path
              d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.2 0-7 2.1-7 5v1h14v-1c0-2.9-2.8-5-7-5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <p className="home-tag">Studia podyplomowe AGH</p>
        <h1>Home</h1>
        <p className="home-subtitle">
          You are signed in. Use this area to check application status, upload
          required files, and track your deadlines.
        </p>
        <div className="home-actions">
          <Link className="primary-btn" to="/admission">
            Open admission page
          </Link>
          <Link className="ghost-link" to="/messages">
            Messages
          </Link>
        </div>
      </header>

      <section className="applications-section">
        <div className="applications-header">
          <h2>Current applications</h2>
          <span className="applications-count">{applications.length}</span>
        </div>

        <ul className="applications-list" aria-label="Current applications"></ul>

        {applications.length === 0 ? (
          <p className="applications-empty">No current applications yet.</p>
        ) : null}
      </section>
    </section>
  )
}

export default HomePage
