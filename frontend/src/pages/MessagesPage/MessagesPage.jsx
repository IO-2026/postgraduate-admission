import { Link } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";
import "./MessagesPage.css";

function MessagesPage() {
  return (
    <section className="messages-view">
      <div className="messages-card">
        <h1>Wiadomości</h1>
        <p className="messages-subtitle">
          Tutaj pojawia się cała komunikacja związana z rekrutacją.
        </p>
        <p className="messages-empty">Brak wiadomości.</p>

        <BackButton />
      </div>
    </section>
  );
}

export default MessagesPage;
