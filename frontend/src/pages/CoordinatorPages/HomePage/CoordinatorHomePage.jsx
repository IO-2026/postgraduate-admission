import "./CoordinatorHomePage.css";
import {Link} from "react-router-dom";

function CoordinatorHomePage() {
  return (
    <section className="coordinator-home-view">
      <header className="coordinator-home-header">
        <h1>Strona koordynatora</h1>
          <div className="coordinator-actions">
              <Link to="/send-message" className="primary-btn">
                  Wyślij wiadomość do kandydatów
              </Link>
          </div>
      </header>
    </section>
  );
}

export default CoordinatorHomePage;
