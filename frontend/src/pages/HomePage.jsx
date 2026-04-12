import { Link } from 'react-router-dom'

function HomePage({ isLoggedIn, onLogout }) {
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
        <p className="home-tag">Postgraduate Admission 2026</p>
        <h1>Home</h1>
        <p className="home-subtitle">
          You are signed in. Use this area to check application status, upload
          required files, and track your deadlines.
        </p>
        <button type="button" className="ghost-btn" onClick={onLogout}>
          Logout
        </button>
      </header>

      <div className="home-grid">
        <article className="home-card">
          <h2>Application Checklist</h2>
          <p>2 out of 5 steps completed</p>
        </article>
        <article className="home-card">
          <h2>Upcoming Deadline</h2>
          <p>Document verification ends on 20 April 2026</p>
        </article>
        <article className="home-card">
          <h2>Messages</h2>
          <p>1 unread message from Admissions Office</p>
        </article>
      </div>
    </section>
  )
}

export default HomePage
