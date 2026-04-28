import { useCallback, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdmissionPage from "./pages/AdmissionPage/AdmissionPage";
import AuthPage from "./pages/AuthPage/AuthPage";
import HomePage from "./pages/HomePage/HomePage";
import MessagesPage from "./pages/MessagesPage/MessagesPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import CoursesPage from "./pages/CoursesPage/CoursesPage";
import UsersPage from "./pages/UsersPage/UsersPage";
import Navbar from "./components/Navbar/Navbar";
import "./styles/layout.css";

const AUTH_STORAGE_KEY = "pg-admission-auth";

function getInitialAuthState() {
  try {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!savedAuth) {
      return { isLoggedIn: false, user: null };
    }

    const parsedAuth = JSON.parse(savedAuth);
    
    // Force logout if we have a legacy format without the user object
    if (parsedAuth?.isLoggedIn && !parsedAuth?.user) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return { isLoggedIn: false, user: null };
    }

    return {
      isLoggedIn: Boolean(parsedAuth?.isLoggedIn),
      user: parsedAuth?.user || null,
    };
  } catch {
    return { isLoggedIn: false, user: null };
  }
}

function App() {
  const [authState, setAuthState] = useState(getInitialAuthState);
  const { isLoggedIn, user } = authState;

  const handleAuthSuccess = useCallback((userData, authPayload) => {
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
      ...(userData || {}),
      id: payloadUserId ?? userData?.id ?? null,
      email: userData?.email ?? payloadEmail ?? null,
      role: userData?.role ?? payloadRole ?? null,
    };

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        isLoggedIn: true,
        user: mergedUser,
        token: token || null,
      }),
    );
    setAuthState({ isLoggedIn: true, user: mergedUser });
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthState({ isLoggedIn: false, user: null });
  }, []);

  return (
    <div className="app-shell">
      <Navbar isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} user={user} />} />
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
          element={<CoursesPage isLoggedIn={isLoggedIn} user={user} />}
        />
        <Route
          path="/users"
          element={
            isLoggedIn && user?.role === "ADMIN" ? (
              <UsersPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
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
