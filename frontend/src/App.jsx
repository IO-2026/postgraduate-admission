import { useCallback, useState, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AdmissionPage from "./pages/AdmissionPage/AdmissionPage";
import AuthPage from "./pages/AuthPage/AuthPage";
import HomePage from "./pages/HomePage/HomePage";
import MessagesPage from "./pages/MessagesPage/MessagesPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import AdminCoordinatorAssignment from "./pages/AdminPage/AdminCoordinatorAssignment";
import AdminCoordinators from "./pages/AdminPage/AdminCoordinators";
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

  const queryClient = useQueryClient();

  const handleAuthSuccess = useCallback(
    (user, authPayload) => {
      const token =
        typeof authPayload === "string"
          ? authPayload
          : authPayload?.token || authPayload?.jwt || authPayload?.accessToken;

      const payloadUserId =
        typeof authPayload === "object" && authPayload ? authPayload.id : null;
      const payloadEmail =
        typeof authPayload === "object" && authPayload
          ? authPayload.email
          : null;
      const payloadRole =
        typeof authPayload === "object" && authPayload
          ? authPayload.role
          : null;

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

      // Prefetch admin-related data if user is admin
      if (
        mergedUser.role &&
        String(mergedUser.role).toLowerCase().includes("admin")
      ) {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Prefetch users, courses, cohorts, assignments and coordinators-with-cohorts
        queryClient.prefetchQuery(
          ["allUsers", token],
          async () => {
            const r = await fetch("/api/admin/users/search", { headers });
            if (!r.ok) throw new Error("Failed to fetch users");
            return r.json();
          },
          { staleTime: 1000 * 60 * 5 },
        );

        queryClient.prefetchQuery(
          ["courses", token],
          async () => {
            const r = await fetch("/api/courses", { headers });
            if (!r.ok) throw new Error("Failed to fetch courses");
            return r.json();
          },
          { staleTime: 1000 * 60 * 5 },
        );

        queryClient.prefetchQuery(
          ["cohorts", token],
          async () => {
            const r = await fetch("/api/cohorts", { headers });
            if (!r.ok) throw new Error("Failed to fetch cohorts");
            return r.json();
          },
          { staleTime: 1000 * 60 * 5 },
        );

        queryClient.prefetchQuery(
          ["coordinatorsWithCohorts", token],
          async () => {
            const r = await fetch("/api/admin/coordinators-with-cohorts", {
              headers,
            });
            if (!r.ok) throw new Error("Failed to fetch coordinators");
            return r.json();
          },
          { staleTime: 1000 * 60 * 5 },
        );
      }

      setIsLoggedIn(true);
    },
    [queryClient],
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsLoggedIn(false);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed?.isLoggedIn) return;
      const user = parsed.user;
      const token = parsed.token || null;
      if (user && String(user.role).toLowerCase().includes("admin")) {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        queryClient.prefetchQuery(
          ["allUsers", token],
          async () => {
            const r = await fetch("/api/admin/users/search", { headers });
            if (!r.ok) throw new Error("Failed to fetch users");
            return r.json();
          },
          { staleTime: 1000 * 60 * 5 },
        );

        queryClient.prefetchQuery(
          ["courses", token],
          async () => {
            const r = await fetch("/api/courses", { headers });
            if (!r.ok) throw new Error("Failed to fetch courses");
            return r.json();
          },
          { staleTime: 1000 * 60 * 5 },
        );

        queryClient.prefetchQuery(
          ["cohorts", token],
          async () => {
            const r = await fetch("/api/cohorts", { headers });
            if (!r.ok) throw new Error("Failed to fetch cohorts");
            return r.json();
          },
          { staleTime: 1000 * 60 * 5 },
        );

        queryClient.prefetchQuery(
          ["coordinatorsWithCohorts", token],
          async () => {
            const r = await fetch("/api/admin/coordinators-with-cohorts", {
              headers,
            });
            if (!r.ok) throw new Error("Failed to fetch coordinators");
            return r.json();
          },
          { staleTime: 1000 * 60 * 5 },
        );

        queryClient.prefetchQuery(
          ["assignments", token],
          async () => {
            const r = await fetch("/api/admin/assignments", { headers });
            if (!r.ok) throw new Error("Failed to fetch assignments");
            return r.json();
          },
          { staleTime: 1000 * 60 * 5 },
        );
      }
    } catch {
      // ignore prefetch errors
    }
  }, [queryClient]);

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
        <Route
          path="/admin/assign-coordinators"
          element={
            isLoggedIn ? (
              <AdminCoordinatorAssignment />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin/coordinators"
          element={
            isLoggedIn ? <AdminCoordinators /> : <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
