import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../../services/authApi";
import "./AuthPage.css";

const LOGIN_INITIAL_STATE = {
  email: "",
  password: "",
};

const REGISTER_INITIAL_STATE = {
  name: "",
  surname: "",
  telNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\s()-]{7,20}$/;
const NAME_REGEX = /^[A-Za-zÀ-ÿĄĆĘŁŃÓŚŹŻąćęłńóśźż' -]{2,50}$/;
const PASSWORD_MIN_LENGTH = 8;

function validateEmail(email) {
  return EMAIL_REGEX.test(email.trim());
}

function validatePhone(phone) {
  return PHONE_REGEX.test(phone.trim());
}

function validateName(value) {
  return NAME_REGEX.test(value.trim());
}

function validatePassword(password) {
  const hasMinLength = password.length >= PASSWORD_MIN_LENGTH;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /\d/.test(password);

  return hasMinLength && hasLetter && hasDigit;
}

function getPasswordError(password) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Hasło musi mieć co najmniej ${PASSWORD_MIN_LENGTH} znaków.`;
  }
  if (!/[A-Za-z]/.test(password)) {
    return "Hasło musi zawierać przynajmniej jedną literę.";
  }
  if (!/\d/.test(password)) {
    return "Hasło musi zawierać przynajmniej jedną cyfrę.";
  }
  return "";
}

function AuthPage({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginData, setLoginData] = useState(LOGIN_INITIAL_STATE);
  const [registerData, setRegisterData] = useState(REGISTER_INITIAL_STATE);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setInfo("");
  };

  const onLoginInput = (event) => {
    const { name, value } = event.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const onRegisterInput = (event) => {
    const { name, value } = event.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const validateLogin = () => {
    const email = loginData.email.trim();
    const password = loginData.password;

    if (!email || !password) {
      return "Uzupełnij oba pola logowania.";
    }

    if (!validateEmail(email)) {
      return "Podaj poprawny adres e-mail.";
    }

    if (password.length < 1) {
      return "Podaj hasło.";
    }

    return "";
  };

  const validateRegister = () => {
    const name = registerData.name.trim();
    const surname = registerData.surname.trim();
    const telNumber = registerData.telNumber.trim();
    const email = registerData.email.trim();
    const password = registerData.password;
    const confirmPassword = registerData.confirmPassword;

    if (
      !name ||
      !surname ||
      !telNumber ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return "Uzupełnij wszystkie pola rejestracji.";
    }

    if (!validateName(name)) {
      return "Podaj poprawne imię.";
    }

    if (!validateName(surname)) {
      return "Podaj poprawne nazwisko.";
    }

    if (!validatePhone(telNumber)) {
      return "Podaj poprawny numer telefonu.";
    }

    if (!validateEmail(email)) {
      return "Podaj poprawny adres e-mail.";
    }

    if (!validatePassword(password)) {
      return getPasswordError(password);
    }

    if (password !== confirmPassword) {
      return "Hasła nie są takie same.";
    }

    return "";
  };

  const submitLogin = async (event) => {
    event.preventDefault();

    const validationError = validateLogin();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setInfo("");
    setIsSubmitting(true);

    try {
      const response = await loginUser({
        email: loginData.email.trim(),
        username: loginData.email.trim(),
        password: loginData.password,
      });

      onAuthSuccess({ email: loginData.email.trim() }, response);
      navigate("/");
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Nie udało się zalogować.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();

    const validationError = validateRegister();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setInfo("");
    setIsSubmitting(true);

    try {
      await registerUser({
        name: registerData.name.trim(),
        surname: registerData.surname.trim(),
        telNumber: registerData.telNumber.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
      });

      const loginResponse = await loginUser({
        email: registerData.email.trim(),
        username: registerData.email.trim(),
        password: registerData.password,
      });

      onAuthSuccess(
        {
          name: registerData.name.trim(),
          surname: registerData.surname.trim(),
          fullName: `${registerData.name.trim()} ${registerData.surname.trim()}`,
          telNumber: registerData.telNumber.trim(),
          email: registerData.email.trim(),
        },
        loginResponse,
      );
      navigate("/");
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Nie udało się utworzyć konta.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-view">
      <h1 className="auth-page-title">AGH Studia Podyplomowe</h1>
      <div className="auth-card-wrap">
        <div className="auth-card">
          <div
            className="auth-switch"
            role="tablist"
            aria-label="Tryb autoryzacji"
          >
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => switchMode("login")}
              role="tab"
              aria-selected={mode === "login"}
            >
              Logowanie
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => switchMode("register")}
              role="tab"
              aria-selected={mode === "register"}
            >
              Rejestracja
            </button>
          </div>

          <h2 className="auth-card-title">
            {mode === "login" ? "Witaj ponownie" : "Utwórz konto"}
          </h2>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Zaloguj się, aby otworzyć stronę główną rekrutacji."
              : "Utwórz profil, aby uzyskać dostęp do portalu rekrutacyjnego."}
          </p>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          {info ? <p className="form-info">{info}</p> : null}

          {mode === "login" ? (
            <form className="auth-form" onSubmit={submitLogin} noValidate>
              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  value={loginData.email}
                  onChange={onLoginInput}
                  disabled={isSubmitting}
                  aria-invalid={!!error}
                />
              </label>

              <label>
                Hasło
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={loginData.password}
                  onChange={onLoginInput}
                  disabled={isSubmitting}
                  aria-invalid={!!error}
                />
              </label>

              <button
                type="submit"
                className="primary-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Trwa logowanie..." : "Zaloguj się"}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={submitRegister} noValidate>
              <label>
                Imię
                <input
                  type="text"
                  name="name"
                  autoComplete="given-name"
                  value={registerData.name}
                  onChange={onRegisterInput}
                  disabled={isSubmitting}
                  minLength={2}
                  maxLength={50}
                  aria-invalid={!!error}
                />
              </label>

              <label>
                Nazwisko
                <input
                  type="text"
                  name="surname"
                  autoComplete="family-name"
                  value={registerData.surname}
                  onChange={onRegisterInput}
                  disabled={isSubmitting}
                  minLength={2}
                  maxLength={50}
                  aria-invalid={!!error}
                />
              </label>

              <label>
                Numer telefonu
                <input
                  type="tel"
                  name="telNumber"
                  autoComplete="tel"
                  value={registerData.telNumber}
                  onChange={onRegisterInput}
                  disabled={isSubmitting}
                  inputMode="tel"
                  aria-invalid={!!error}
                />
              </label>

              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={registerData.email}
                  onChange={onRegisterInput}
                  disabled={isSubmitting}
                  inputMode="email"
                  aria-invalid={!!error}
                />
              </label>

              <label>
                Hasło
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={registerData.password}
                  onChange={onRegisterInput}
                  disabled={isSubmitting}
                  minLength={PASSWORD_MIN_LENGTH}
                  aria-invalid={!!error}
                />
              </label>

              <label>
                Potwierdź hasło
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={registerData.confirmPassword}
                  onChange={onRegisterInput}
                  disabled={isSubmitting}
                  minLength={PASSWORD_MIN_LENGTH}
                  aria-invalid={!!error}
                />
              </label>

              <button
                type="submit"
                className="primary-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Trwa tworzenie konta..." : "Zarejestruj się"}
              </button>
            </form>
          )}

          <Link className="text-btn" to="/">
            Wróć na stronę główną
          </Link>
        </div>
      </div>
    </section>
  );
}

export default AuthPage;
