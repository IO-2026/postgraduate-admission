import { useCallback, useState, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdmissionPage from "./pages/CandidatePages/AdmissionPage/AdmissionPage";
import { useQueryClient } from "@tanstack/react-query";
import AuthPage from "./pages/AuthPage/AuthPage";
import CandidateHomePage from "./pages/CandidatePages/HomePage/CandidateHomePage";
import CoordinatorHomePage from "./pages/CoordinatorPages/HomePage/CoordinatorHomePage";
import MessagesPage from "./pages/MessagesPage/MessagesPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import AdminHomePage from "./pages/AdminPages/HomePage/HomePage";
import AdminCoursesPage from "./pages/AdminPages/CoursesPage/AdminCoursesPage";
import CoursesPage from "./pages/CandidatePages/CoursesPage/CoursesPage";
import UsersPage from "./pages/AdminPages/UsersPage/UsersPage";
import CourseManagementPage from "./pages/CoordinatorPages/CourseManagementPage/CourseManagementPage";
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

function getRoleId(user) {
  if (!user) return null;
  if (user.roleId != null) return user.roleId;
  if (typeof user.role === "number") return user.role;
  if (user.role && typeof user.role.id === "number") return user.role.id;
  return null;
}

function isAdminUser(user) {
  const roleId = getRoleId(user);
  return (
    roleId === 2 ||
    (typeof user?.role === "string" &&
      user.role.toLowerCase().includes("admin"))
  );
}

function App() {
  const [authState, setAuthState] = useState(getInitialAuthState);
  const { isLoggedIn, user } = authState;
  const isAdmin = isLoggedIn && isAdminUser(user);
  const isCoordinator = isLoggedIn && user?.role === "Coordinator";
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
      const payloadName =
        typeof authPayload === "object" && authPayload
          ? authPayload.name
          : null;
      const payloadSurname =
        typeof authPayload === "object" && authPayload
          ? authPayload.surname
          : null;
      const payloadTelNumber =
        typeof authPayload === "object" && authPayload
          ? authPayload.telNumber
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

      // Use functional state update to avoid capturing `user` in this callback
      setAuthState((prev) => {
        const prevUser = prev?.user;
        const userRoleId = (() => {
          if (prevUser?.roleId != null) return prevUser.roleId;
          if (typeof prevUser?.role === "number") return prevUser.role;
          if (prevUser?.role && typeof prevUser.role.id === "number")
            return prevUser.role.id;
          return null;
        })();

        const mergedUser = {
          ...(userData || {}),
          id: payloadUserId ?? userData?.id ?? null,
          email: userData?.email ?? payloadEmail ?? null,
          roleId: userRoleId ?? payloadRoleId ?? null,
          role: userData?.role ?? payloadRole ?? null,
          name: userData?.name ?? payloadName ?? null,
          surname: userData?.surname ?? payloadSurname ?? null,
          telNumber: userData?.telNumber ?? payloadTelNumber ?? null,
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
        const isAdmin = isAdminUser(mergedUser);

        if (isAdmin) {
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

        return { isLoggedIn: true, user: mergedUser };
      });
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
      const isAdmin = isAdminUser(user);
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
          element={
            isAdmin ? (
              <AdminHomePage />
            ) : isCoordinator ? (
              <CoordinatorHomePage user={user} />
            ) : (
              <CandidateHomePage isLoggedIn={isLoggedIn} />
            )
          }
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
        <Route path="/courses" element={<CoursesPage />} />
        <Route
          path="/admin/courses"
          element={isAdmin ? <AdminCoursesPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/coordinator/courses/:courseId/manage"
          element={
            isCoordinator ? <CourseManagementPage /> : <Navigate to="/" replace />
          }
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
