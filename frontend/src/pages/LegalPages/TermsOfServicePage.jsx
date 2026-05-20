import BackButton from "../../components/BackButton/BackButton";
import "./TermsOfServicePage.css";

function TermsOfServicePage() {
  return (
    <section className="legal-page">
      <BackButton to="/" label="Back to home" />
      <article className="legal-card">
        <header className="legal-header">
          <h1>Terms of Service</h1>
          <p className="legal-meta">Last updated: May 20, 2026</p>
        </header>

        <div className="legal-section">
          <h2>Introduction</h2>
          <p>
            These terms describe how this admissions platform can be used during
            the preview phase. They will be updated before any public release.
          </p>
        </div>

        <div className="legal-section">
          <h2>Eligibility</h2>
          <p>
            You must provide accurate information and have authority to submit
            an application. Access may be limited to invited users.
          </p>
        </div>

        <div className="legal-section">
          <h2>Accounts and security</h2>
          <p>
            Keep login credentials private and notify administrators of any
            suspected misuse. We may suspend accounts to protect the system.
          </p>
        </div>

        <div className="legal-section">
          <h2>Payments</h2>
          <p>
            Any payment information shown in the preview is for demonstration
            only. Fees and rules will be finalized later.
          </p>
        </div>

        <div className="legal-section">
          <h2>Acceptable use</h2>
          <p>
            Do not attempt to disrupt the service, scrape data, or access areas
            without authorization. We can remove content or accounts that
            violate these terms.
          </p>
        </div>

        <div className="legal-section">
          <h2>Changes</h2>
          <p>
            We may update these terms at any time. Continued use means you
            accept the updated version.
          </p>
        </div>
      </article>
    </section>
  );
}

export default TermsOfServicePage;
