import { useCallback, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdmissionPage from "./pages/AdmissionPage/AdmissionPage";
import AuthPage from "./pages/AuthPage/AuthPage";
import HomePage from "./pages/HomePage/HomePage";
import MessagesPage from "./pages/MessagesPage/MessagesPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import CoursesPage from "./pages/CoursesPage/CoursesPage";
import "./styles/layout.css";

const AUTH_STORAGE_KEY = "pg-admission-auth";

function getInitialAuthState() {
  try {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!savedAuth) {
      return false;
    }

    const parsedAuth = JSON.parse(savedAuth);
    return Boolean(parsedAuth?.isLoggedIn);
  } catch {
    return false;
  }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(getInitialAuthState);

  const handleAuthSuccess = useCallback((user, authPayload) => {
    const token =
      typeof authPayload === "string"
        ? authPayload
        : authPayload?.token || authPayload?.jwt || authPayload?.accessToken;

    const payloadUserId =
      typeof authPayload === "object" && authPayload ? authPayload.id : null;
    const payloadEmail =
      typeof authPayload === "object" && authPayload ? authPayload.email : null;
    const payloadRole =
      typeof authPayload === "object" && authPayload ? authPayload.role : null;

    const mergedUser = {
      ...(user || {}),
      id: payloadUserId ?? user?.id ?? null,
      email: user?.email ?? payloadEmail ?? null,
      role: user?.role ?? payloadRole ?? null,
    };

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        isLoggedIn: true,
        user: mergedUser,
        token: token || null,
      }),
    );
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsLoggedIn(false);
  }, []);

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} />} />
        <Route
          path="/auth"
          element={
            isLoggedIn ? (
              <Navigate to="/" replace />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} />
            )
          }
        />
        <Route
          path="/courses"
          element={<CoursesPage isLoggedIn={isLoggedIn} />}
        />
        <Route
          path="/admission"
          element={isLoggedIn ? <AdmissionPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/messages"
          element={isLoggedIn ? <MessagesPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/profile"
          element={
            isLoggedIn ? (
              <ProfilePage onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
