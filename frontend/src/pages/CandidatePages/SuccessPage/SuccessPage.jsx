import { Link } from "react-router-dom";
import "./SuccessPage.css";

function SuccessPage() {
  return (
    <section
      className="success-view"
      aria-label="Potwierdzenie wysłania wniosku"
    >
      <div className="success-container">
        <div className="success-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1>Wniosek wysłany pomyślnie!</h1>

        <p className="success-message">
          Dziękujemy za złożenie wniosku. Twoja aplikacja została przyjęta i
          będzie rozpatrywana przez naszą komisję rekrutacyjną.
        </p>

        <p className="success-info">
          Informacje o wyniku rekrutacji otrzymasz na adres e-mail podany w
          aplikacji.
        </p>

        <div className="success-actions">
          <Link to="/" className="primary-btn">
            Wróć do strony głównej
          </Link>
          <Link to="/admission" className="ghost-link">
            Powrót do wyboru kierunków
          </Link>
        </div>
      </div>
    </section>
  );
}

export default SuccessPage;
