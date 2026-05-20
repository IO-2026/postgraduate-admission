import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="legal-footer">
      <div className="legal-footer__links">
        <Link className="legal-footer__link" to="/privacy">
          Privacy Policy
        </Link>
        <Link className="legal-footer__link" to="/terms">
          Terms of Service
        </Link>
        <Link className="legal-footer__link" to="/cookies">
          Cookie Policy
        </Link>
      </div>
    </footer>
  );
}

export default Footer;
