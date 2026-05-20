import BackButton from "../../components/BackButton/BackButton";
import "./PrivacyPolicyPage.css";

function PrivacyPolicyPage() {
  return (
    <section className="legal-page">
      <BackButton to="/" label="Back to home" />
      <article className="legal-card">
        <header className="legal-header">
          <h1>Privacy Policy</h1>
          <p className="legal-meta">Last updated: May 20, 2026</p>
        </header>

        <div className="legal-section">
          <h2>Overview</h2>
          <p>
            This is a preview privacy policy for a pre-release application. The
            information here is a placeholder and will be updated before the
            product is launched.
          </p>
        </div>

        <div className="legal-section">
          <h2>Information we collect</h2>
          <p>
            We may collect account details, application forms, and usage data to
            operate the recruitment process. Sensitive information should be
            shared only when required for admissions.
          </p>
        </div>

        <div className="legal-section">
          <h2>How we use data</h2>
          <p>
            Data is used to manage applications, communicate with candidates,
            and improve the experience. We do not sell personal information.
          </p>
        </div>

        <div className="legal-section">
          <h2>Sharing and retention</h2>
          <p>
            Information is shared only with authorized staff and retained for as
            long as necessary to meet admissions and legal requirements.
          </p>
        </div>

        <div className="legal-section">
          <h2>Your choices</h2>
          <p>
            You may request access, correction, or removal of your data. Contact
            the admissions team for assistance.
          </p>
        </div>
      </article>
    </section>
  );
}

export default PrivacyPolicyPage;
