import { useParams } from "react-router-dom";
import BackButton from "../../../components/BackButton/BackButton";
import "./PaymentPage.css";

function PaymentPage() {
  const { id } = useParams();

  return (
    <section className="payment-view animate-fade-in">
      <h1>Strona płatności</h1>
      <p>Płatność za aplikację nr {id} (moduł w budowie).</p>
      <div className="payment-actions">
        <BackButton />
      </div>
    </section>
  );
}

export default PaymentPage;
