import { useParams, Link } from "react-router-dom";

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
      <Link
        to="/"
        className="primary-btn"
        style={{ marginTop: "2rem", display: "inline-block" }}
      >
        Wróć do strony głównej
      </Link>
    </section>
  );
}

export default PaymentPage;
