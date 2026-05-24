import { API_URL } from "./config/api.js";
import { useCallback, useState, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdmissionPage from "./pages/CandidatePages/AdmissionPage/AdmissionPage";
import SuccessPage from "./pages/CandidatePages/SuccessPage/SuccessPage";
import PaymentPage from "./pages/CandidatePages/PaymentPage/PaymentPage";
import { useQueryClient } from "@tanstack/react-query";
import AuthPage from "./pages/AuthPage/AuthPage";
import CandidateHomePage from "./pages/CandidatePages/HomePage/CandidateHomePage";
import CoordinatorHomePage from "./pages/CoordinatorPages/HomePage/CoordinatorHomePage";
import MessagesPage from "./pages/CandidatePages/MessagesPage/MessagesPage.jsx";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import AdminHomePage from "./pages/AdminPages/HomePage/HomePage";
import NewCoursePage from "./pages/AdminPages/NewCoursePage/NewCoursePage";
import EditCoursePage from "./pages/AdminPages/EditCoursePage/EditCoursePage";
import UsersPage from "./pages/AdminPages/UsersPage/UsersPage";
import CourseManagementPage from "./pages/CoordinatorPages/CourseManagementPage/CourseManagementPage";
import CoordinatorEditCoursePage from "./pages/CoordinatorPages/EditCoursePage/CoordinatorEditCoursePage";
import ApplicationManagementPage from "./pages/CoordinatorPages/ApplicationManagementPage/ApplicationManagementPage";
import Navbar from "./components/Navbar/Navbar";
import "./styles/layout.css";
import InboxPage from "./pages/CandidatePages/InboxPage/InboxPage.jsx";
import SendMessagePage from "./pages/SendMessagePage/SendMessagePage.jsx";
import { fetchCurrentUser } from "./services/userApi";
import {
  AUTH_EXPIRED_EVENT,
  authFetch,
  clearAuthStorage,
  getStoredAuth,
  storeAuthState,
} from "./config/auth";
import ContactFormPage from "./pages/CandidatePages/ContactFormPage/ContactFormPage.jsx";
import SentMessagesPage from "./pages/SentMessagesPage/SentMessagesPage.jsx";

function getInitialAuthState() {
  try {
    const parsedAuth = getStoredAuth();
    if (!parsedAuth) {
      return { isLoggedIn: false, user: null };
    }

    // Force logout if we have a legacy format without the user object
    if (parsedAuth?.isLoggedIn && !parsedAuth?.user) {
      clearAuthStorage();
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

function getRoleName(user) {
  if (!user) return null;
  if (typeof user.roleName === "string") return user.roleName;
  if (typeof user.role === "string") return user.role;
  if (user.role && typeof user.role.name === "string") return user.role.name;
  return null;
}

function hasRoleInfo(user) {
  return Boolean(user && (user.roleId != null || getRoleName(user)));
}

function resolveUserId(user) {
  if (!user || typeof user !== "object") return null;
  if (typeof user.id === "number") return user.id;
  if (typeof user.userId === "number") return user.userId;

  const parsedId = Number.parseInt(String(user.id ?? user.userId ?? ""), 10);
  return Number.isNaN(parsedId) ? null : parsedId;
}

function isAdminUser(user) {
  const roleId = getRoleId(user);
  const roleName = getRoleName(user);
  return (
    roleId === 2 ||
    (typeof roleName === "string" && roleName.toLowerCase().includes("admin"))
  );
}

function getSessionProbePath(user) {
  const userId = resolveUserId(user);
  if (!userId) return null;
  if (!hasRoleInfo(user)) return null;
  if (isAdminUser(user)) {
    return "/api/users";
  }
  if (getRoleName(user) === "Coordinator") {
    return `${API_URL}/courses/ofCoordinator?coordinatorId=${userId}`;
  }
  return `${API_URL}/applications/of/${userId}`;
}

function App() {
  const [authState, setAuthState] = useState(getInitialAuthState);
  const { isLoggedIn, user } = authState;
  const isAdmin = isLoggedIn && isAdminUser(user);
  const isCoordinator = isLoggedIn && getRoleName(user) === "Coordinator";
  const isRoleReady = !isLoggedIn || hasRoleInfo(user);
  const queryClient = useQueryClient();

  const handleAuthSuccess = useCallback(
    (userData, authPayload) => {
      const payloadUserId =
        resolveUserId(authPayload) ?? resolveUserId(authPayload?.user) ?? null;
      const payloadEmail =
        (typeof authPayload === "object" && authPayload
          ? authPayload.email
          : null) ??
        authPayload?.user?.email ??
        null;
      const payloadRole =
        (typeof authPayload === "object" && authPayload
          ? authPayload.role
          : null) ??
        authPayload?.user?.role ??
        null;
      const payloadRoleName =
        (typeof authPayload === "object" && authPayload
          ? authPayload.roleName
          : null) ??
        authPayload?.user?.roleName ??
        (typeof payloadRole === "string" ? payloadRole : null);
      const payloadName =
        (typeof authPayload === "object" && authPayload
          ? authPayload.name
          : null) ??
        authPayload?.user?.name ??
        null;
      const payloadSurname =
        (typeof authPayload === "object" && authPayload
          ? authPayload.surname
          : null) ??
        authPayload?.user?.surname ??
        null;
      const payloadTelNumber =
        (typeof authPayload === "object" && authPayload
          ? authPayload.telNumber
          : null) ??
        authPayload?.user?.telNumber ??
        null;

      const payloadRoleId = (() => {
        if (typeof authPayload === "object" && authPayload) {
          if (typeof authPayload.roleId === "number") return authPayload.roleId;
          if (typeof authPayload.role === "number") return authPayload.role;
          if (authPayload.role && typeof authPayload.role.id === "number") {
            return authPayload.role.id;
          }
        }
        if (typeof authPayload?.user === "object" && authPayload.user) {
          if (typeof authPayload.user.roleId === "number") {
            return authPayload.user.roleId;
          }
          if (typeof authPayload.user.role === "number") {
            return authPayload.user.role;
          }
          if (
            authPayload.user.role &&
            typeof authPayload.user.role.id === "number"
          ) {
            return authPayload.user.role.id;
          }
        }
        return null;
      })();

      setAuthState((prev) => {
        const prevUser = prev?.user;
        const userRoleId = (() => {
          if (prevUser?.roleId != null) return prevUser.roleId;
          if (typeof prevUser?.role === "number") return prevUser.role;
          if (prevUser?.role && typeof prevUser.role.id === "number") {
            return prevUser.role.id;
          }
          return null;
        })();

        const mergedUser = {
          ...(userData || {}),
          id: payloadUserId ?? userData?.id ?? null,
          email: userData?.email ?? payloadEmail ?? null,
          roleId: userRoleId ?? payloadRoleId ?? null,
          role: userData?.role ?? payloadRole ?? payloadRoleName ?? null,
          roleName: userData?.roleName ?? payloadRoleName ?? null,
          name: userData?.name ?? payloadName ?? null,
          surname: userData?.surname ?? payloadSurname ?? null,
          telNumber: userData?.telNumber ?? payloadTelNumber ?? null,
          isHydrated: false,
        };

        storeAuthState({
          isLoggedIn: true,
          user: mergedUser,
        });

        // Prefetch admin-related data if user is admin
        const isAdmin = isAdminUser(mergedUser);

        if (isAdmin) {
          queryClient.prefetchQuery(
            ["allUsers"],
            async () => {
              const r = await authFetch("/api/users");
              if (!r.ok) throw new Error("Nie udało się pobrać użytkowników");
              return r.json();
            },
            { staleTime: 1000 * 60 * 5 },
          );

          queryClient.prefetchQuery(
            ["courses"],
            async () => {
              const r = await authFetch("/api/courses");
              if (!r.ok) throw new Error("Nie udało się pobrać kierunków");
              return r.json();
            },
            { staleTime: 1000 * 60 * 5 },
          );

          queryClient.prefetchQuery(
            ["coordinatorsWithCourses"],
            async () => {
              const r = await authFetch(
                `${API_URL}/admin/coordinators-with-courses`,
              );
              if (!r.ok) throw new Error("Nie udało się pobrać koordynatorów");
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
    clearAuthStorage();
    window.location.href = "/";
  }, []);

  useEffect(() => {
    try {
      const parsed = getStoredAuth();
      if (!parsed) return;
      if (!parsed?.isLoggedIn) return;
      const user = parsed.user;
      const isAdmin = isAdminUser(user);
      if (user && isAdmin) {
        queryClient.prefetchQuery(
          ["allUsers"],
          async () => {
            const r = await authFetch("/api/users");
            if (!r.ok) throw new Error("Nie udało się pobrać użytkowników");
            return r.json();
          },
          { staleTime: 1000 * 60 * 5 },
        );

        queryClient.prefetchQuery(
          ["courses"],
          async () => {
            const r = await authFetch("/api/courses");
            if (!r.ok) throw new Error("Nie udało się pobrać kierunków");
            return r.json();
          },
          { staleTime: 1000 * 60 * 5 },
        );

        queryClient.prefetchQuery(
          ["coordinatorsWithCourses"],
          async () => {
            const r = await authFetch(
              `${API_URL}/admin/coordinators-with-courses`,
            );
            if (!r.ok) throw new Error("Nie udało się pobrać koordynatorów");
            return r.json();
          },
          { staleTime: 1000 * 60 * 5 },
        );
      }
    } catch {
      // ignore prefetch errors
    }
  }, [queryClient]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setAuthState({ isLoggedIn: false, user: null });
      queryClient.clear();
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const needsHydration =
      !user?.isHydrated && (!user || !hasRoleInfo(user) || !user?.name);
    if (!needsHydration) return;

    let isMounted = true;

    const hydrateUser = async () => {
      try {
        const fetchedUser = await fetchCurrentUser();
        if (!isMounted) return;

        setAuthState((prev) => {
          if (!prev?.isLoggedIn) return prev;
          const resolvedRoleName =
            getRoleName(fetchedUser) ?? getRoleName(prev.user) ?? null;
          const mergedUser = {
            ...(prev.user || {}),
            ...(fetchedUser || {}),
            id: fetchedUser?.id ?? resolveUserId(prev.user) ?? null,
            email: fetchedUser?.email ?? prev.user?.email ?? null,
            role: fetchedUser?.role ?? prev.user?.role ?? resolvedRoleName,
            roleName: resolvedRoleName,
            isHydrated: true,
          };

          storeAuthState({
            isLoggedIn: true,
            user: mergedUser,
          });

          return { isLoggedIn: true, user: mergedUser };
        });
      } catch {
        // ignore hydration errors
      }
    };

    hydrateUser();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (!isLoggedIn || !user) return undefined;

    let isMounted = true;

    const ensureActiveSession = async () => {
      const probePath = getSessionProbePath(user);
      if (!probePath) return;

      try {
        await authFetch(probePath, { method: "GET" });
      } catch {
        if (!isMounted) return;
        // Ignore transient network errors; logout is handled on 401/403 via authFetch.
      }
    };

    ensureActiveSession();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        ensureActiveSession();
      }
    };

    window.addEventListener("focus", ensureActiveSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", ensureActiveSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoggedIn, user]);

  return (
    <div className="app-shell">
      <Navbar
        isLoggedIn={isLoggedIn}
        user={user}
        isAdmin={isAdmin}
        isCoordinator={isCoordinator}
        onLogout={handleLogout}
      />
      <Routes>
        <Route
          path="/"
          element={
            isAdmin ? (
              <AdminHomePage isLoggedIn={isLoggedIn} user={user} />
            ) : isCoordinator ? (
              <CoordinatorHomePage user={user} />
            ) : (
              <CandidateHomePage isLoggedIn={isLoggedIn} user={user} />
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

        <Route
          path="/admin/courses/new"
          element={isAdmin ? <NewCoursePage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/admin/courses/:courseId/edit"
          element={isAdmin ? <EditCoursePage /> : <Navigate to="/" replace />}
        />
        <Route path="/admin/courses" element={<Navigate to="/" replace />} />
        <Route
          path="/coordinator/courses/:courseId/edit"
          element={
            !isRoleReady ? null : isCoordinator ? (
              <CoordinatorEditCoursePage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/coordinator/courses/:courseId/manage"
          element={
            !isRoleReady ? null : isCoordinator ? (
              <CourseManagementPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/coordinator/courses/:courseId/applications/:applicationId/manage"
          element={
            !isRoleReady ? null : isCoordinator ? (
              <ApplicationManagementPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/users"
          element={
            !isRoleReady ? null : isLoggedIn && isAdmin ? (
              <UsersPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admission"
          element={
            isLoggedIn ? (
              <AdmissionPage isLoggedIn={isLoggedIn} user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admission/success"
          element={isLoggedIn ? <SuccessPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/payment/:id"
          element={isLoggedIn ? <PaymentPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/messages"
          element={isLoggedIn ? <InboxPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/send-message"
          element={
            !isRoleReady ? null : isLoggedIn &&
              (getRoleName(user) === "Coordinator" || isAdmin) ? (
              <SendMessagePage user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/sent-messages"
          element={
            !isRoleReady ? null : isAdmin || isCoordinator ? (
              <SentMessagesPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
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
        <Route path="/contact" element={<ContactFormPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
