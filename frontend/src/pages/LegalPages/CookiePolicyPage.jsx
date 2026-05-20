import BackButton from "../../components/BackButton/BackButton";
import "./CookiePolicyPage.css";

function CookiePolicyPage() {
  return (
    <section className="legal-page">
      <BackButton to="/" label="Back to home" />
      <article className="legal-card">
        <header className="legal-header">
          <h1>Cookie Policy</h1>
          <p className="legal-meta">Last updated: May 20, 2026</p>
        </header>

        <div className="legal-section">
          <h2>What are cookies</h2>
          <p>
            Cookies are small text files stored on your device to keep the
            application running and remember your preferences.
          </p>
        </div>

        <div className="legal-section">
          <h2>Types of cookies</h2>
          <p>
            We use essential cookies for authentication and security, and
            optional cookies to understand how the preview is used. Optional
            cookies may be introduced later.
          </p>
        </div>

        <div className="legal-section">
          <h2>Managing preferences</h2>
          <p>
            You can accept all cookies or only essential cookies from the banner
            that appears on first visit. You can also clear cookies in your
            browser settings to reset your preference.
          </p>
        </div>

        <div className="legal-section">
          <h2>Updates</h2>
          <p>
            This policy may change as the product evolves. We will update the
            date above when changes are made.
          </p>
        </div>
      </article>
    </section>
  );
}

export default CookiePolicyPage;
