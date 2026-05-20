import { useState } from "react";
import { Link } from "react-router-dom";
import "./CookieConsent.css";

const STORAGE_KEY = "cookieConsent";

function CookieConsent() {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      return !storedValue;
    } catch {
      return true;
    }
  });

  const handleAccept = (value) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="cookie-consent" role="dialog" aria-live="polite">
      <div className="cookie-consent__content">
        <p className="cookie-consent__text">
          We use essential cookies to keep the application running and optional
          cookies to improve the experience. Read our{" "}
          <Link className="cookie-consent__link" to="/cookies">
            Cookie Policy
          </Link>{" "}
          for details.
        </p>
        <div className="cookie-consent__actions">
          <button
            type="button"
            className="primary-btn cookie-consent__button"
            onClick={() => handleAccept("all")}
          >
            Accept all
          </button>
          <button
            type="button"
            className="ghost-btn cookie-consent__button"
            onClick={() => handleAccept("essential")}
          >
            Accept essential
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
