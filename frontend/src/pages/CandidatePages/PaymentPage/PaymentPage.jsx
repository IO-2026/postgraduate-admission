import { useParams, Link } from "react-router-dom";
import BackButton from "../../../components/BackButton/BackButton";

function PaymentPage() {
  const { id } = useParams();

  return (
    <section
      className="payment-view"
      style={{ padding: "4rem 2rem", textAlign: "center" }}
    >
      <h1>Strona płatności</h1>
      <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
        Płatność za aplikację nr {id} (moduł w budowie).
      </p>
      <div style={{ marginTop: "2rem" }}>
        <BackButton />
      </div>
    </section>
  );
}

export default PaymentPage;
