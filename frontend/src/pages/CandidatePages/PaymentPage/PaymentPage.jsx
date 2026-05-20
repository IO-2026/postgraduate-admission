import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import BackButton from "../../../components/BackButton/BackButton";
import {
  getApplication,
  payEntryFee,
  paySemester,
} from "../../../services/applicationApi";
import { fetchCourseById } from "../../../services/courseApi";
import "./PaymentPage.css";

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatPrice(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(value);
}

function normalizePaymentType(rawType) {
  return rawType === "semester" ? "semester" : "entry";
}

function PaymentPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentType = useMemo(
    () => normalizePaymentType(searchParams.get("type")),
    [searchParams],
  );

  const isEntryPayment = paymentType === "entry";
  const paymentLabel = isEntryPayment
    ? "opłata wpisowa"
    : "opłata za pierwszy semestr";

  const isPaid = Boolean(
    isEntryPayment ? application?.isEntryFeePaid : application?.isSemesterPaid,
  );

  const isEligible = isEntryPayment
    ? !application?.isWithdrawn
    : application?.isAccepted && !application?.isWithdrawn;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      setError("");

      try {
        const app = await getApplication(id);
        if (!isMounted) return;
        setApplication(app);

        if (app?.courseId != null) {
          const courseData = await fetchCourseById(app.courseId);
          if (!isMounted) return;
          setCourse(courseData);
        }
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError?.message || "Nie udało się pobrać danych płatności.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handlePayment = async () => {
    if (!application || isProcessing || isPaid) return;
    setIsProcessing(true);
    setError("");

    try {
      await sleep(1400);
      if (isEntryPayment) {
        await payEntryFee(application.id);
      } else {
        await paySemester(application.id);
      }
      navigate(`/admission/success?applicationId=${application.id}`);
    } catch (paymentError) {
      setError(
        paymentError?.message || "Nie udało się zrealizować płatności.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="payment-view" aria-label="Płatność wpisowego">
      <div className="payment-card">
        <BackButton to="/" label="Wróć do strony głównej" />
        <h1>Mock płatność</h1>
        <p className="payment-subtitle">
          {isEntryPayment ? "Wpisowe" : "Pierwszy semestr"} dla aplikacji nr {id}
        </p>

        {loading ? <p className="payment-info">Ładowanie danych...</p> : null}

        {!loading && error ? (
          <p className="payment-error" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !error ? (
          <div className="payment-details">
            <div className="payment-row">
              <span>Kierunek</span>
              <strong>{course?.name || "Nieznany kierunek"}</strong>
            </div>
            <div className="payment-row">
              <span>Kwota</span>
              <strong>{formatPrice(course?.price)}</strong>
            </div>
            <div className="payment-row">
              <span>Status</span>
              <strong>
                {isPaid ? "Opłacone" : "Do opłacenia"}
              </strong>
            </div>
            {!isEligible ? (
              <p className="payment-info">
                Ta {paymentLabel} nie może zostać opłacona w tym momencie.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="payment-actions">
          <button
            className="primary-btn"
            type="button"
            disabled={loading || isProcessing || isPaid || !isEligible}
            onClick={handlePayment}
          >
            {isPaid
              ? "Płatność zakończona"
              : isProcessing
                ? "Przetwarzanie płatności..."
                : "Zapłać teraz"}
          </button>
          <button
            className="ghost-link"
            type="button"
            onClick={() => navigate("/")}
          >
            Wróć do listy aplikacji
          </button>
        </div>
      </div>
    </section>
  );
}

export default PaymentPage;
