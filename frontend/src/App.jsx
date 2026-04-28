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
  const queryClient = useQueryClient();

  const handleAuthSuccess = useCallback(
    (userData, authPayload) => {
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

      const payloadRoleId = (() => {
        if (typeof authPayload === "object" && authPayload) {
          if (typeof authPayload.roleId === "number") return authPayload.roleId;
          if (typeof authPayload.role === "number") return authPayload.role;
          if (authPayload.role && typeof authPayload.role.id === "number")
            return authPayload.role.id;
        }
        return null;
      })();

      const userRoleId = (() => {
        if (user?.roleId != null) return user.roleId;
        if (typeof user?.role === "number") return user.role;
        if (user?.role && typeof user.role.id === "number") return user.role.id;
        return null;
      })();

      const mergedUser = {
        ...(userData || {}),
        id: payloadUserId ?? userData?.id ?? null,
        email: userData?.email ?? payloadEmail ?? null,
        roleId: userRoleId ?? payloadRoleId ?? null,
        role: userData?.role ?? payloadRole ?? null,
        name: userData?.name ?? null,
        surname: userData?.surname ?? null,
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
      const isAdmin =
        mergedUser.roleId === 2 ||
        (typeof mergedUser.role === "string" &&
          mergedUser.role.toLowerCase().includes("admin"));

      if (isAdmin) {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Prefetch users and courses and coordinators-with-courses
        queryClient.prefetchQuery(
          ["allUsers", token],
          async () => {
            const r = await fetch("/api/users", { headers });
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
          ["coordinatorsWithCourses", token],
          async () => {
            const r = await fetch("/api/admin/coordinators-with-courses", {
              headers,
            });
            if (!r.ok) throw new Error("Failed to fetch coordinators");
            return r.json();
          },
          { staleTime: 1000 * 60 * 5 },
        );
      }

      setAuthState({ isLoggedIn: true, user: mergedUser });
    },
    [queryClient],
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.href = "/";
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed?.isLoggedIn) return;
      const user = parsed.user;
      const token = parsed.token || null;
      const roleId =
        user?.roleId ??
        (typeof user?.role === "number" ? user.role : (user?.role?.id ?? null));
      const isAdmin =
        roleId === 2 ||
        (typeof user?.role === "string" &&
          user.role.toLowerCase().includes("admin"));
      if (user && isAdmin) {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        queryClient.prefetchQuery(
          ["allUsers", token],
          async () => {
            const r = await fetch("/api/users", { headers });
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
          ["coordinatorsWithCourses", token],
          async () => {
            const r = await fetch("/api/admin/coordinators-with-courses", {
              headers,
            });
            if (!r.ok) throw new Error("Failed to fetch coordinators");
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
      <Navbar isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />
      <Routes>
        <Route
          path="/"
          element={<HomePage isLoggedIn={isLoggedIn} user={user} />}
        />
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
            isLoggedIn && user?.role === "Admin" ? (
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
              <ProfilePage user={user} onLogout={handleLogout} />
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
