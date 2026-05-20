import { Link, useSearchParams } from "react-router-dom";
import "./SuccessPage.css";

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const paymentLink = applicationId
    ? `/payment/${applicationId}?type=entry`
    : null;

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

        {paymentLink ? (
          <p className="success-info">
            Aby dokończyć rekrutację, opłać wpisowe dla świeżo złożonego
            wniosku.
          </p>
        ) : (
          <p className="success-info">
            Aby opłacić wpisowe, przejdź do listy swoich aplikacji.
          </p>
        )}

        <div className="success-actions">
          {paymentLink ? (
            <Link to={paymentLink} className="primary-btn">
              Opłać wpisowe teraz
            </Link>
          ) : null}
          <Link to="/" className={paymentLink ? "ghost-link" : "primary-btn"}>
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
