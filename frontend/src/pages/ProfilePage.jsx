import { Link } from 'react-router-dom'

function ProfilePage({ onLogout }) {
  return (
    <section className="profile-view">
      <div className="profile-card">
        <h1>Profile</h1>
        <p className="profile-subtitle">
          Manage your account settings and sign out from your admission session.
        </p>

        <div className="profile-actions">
          <Link className="primary-btn" to="/">
            Back to home
          </Link>
          <button type="button" className="ghost-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </section>
  )
}

export default ProfilePage
