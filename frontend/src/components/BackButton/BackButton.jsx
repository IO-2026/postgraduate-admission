import { Link } from "react-router-dom";
import "./BackButton.css";

function BackButton({ to = "/", label = "Wróć do strony głównej", children }) {
  return (
    <div className="back-button-wrapper">
      <Link className="ghost-link back-button-link" to={to}>
        <svg
          className="back-button-icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {children || label}
      </Link>
    </div>
  );
}

export default BackButton;
