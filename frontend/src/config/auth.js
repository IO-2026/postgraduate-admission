export const AUTH_STORAGE_KEY = "pg-admission-auth";
export const AUTH_EXPIRED_EVENT = "auth-expired";

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function resolveUserId(user) {
  if (!user || typeof user !== "object") return null;
  if (typeof user.id === "number") return user.id;
  if (typeof user.userId === "number") return user.userId;

  const parsedId = Number.parseInt(String(user.id ?? user.userId ?? ""), 10);
  return Number.isNaN(parsedId) ? null : parsedId;
}

function resolveUserEmail(user) {
  if (!user || typeof user !== "object") return null;
  const email = typeof user.email === "string" ? user.email.trim() : "";
  return email ? email : null;
}

function selectStoredUser(authState) {
  if (!authState || typeof authState !== "object") return null;
  const source = authState?.user || authState;
  const id = resolveUserId(source);
  if (id != null) return { id };
  const email = resolveUserEmail(source);
  return email ? { email } : null;
}

function sanitizeAuthState(authState) {
  const isLoggedIn = Boolean(authState?.isLoggedIn);
  if (!isLoggedIn) {
    return { isLoggedIn: false, user: null };
  }

  return {
    isLoggedIn,
    user: selectStoredUser(authState),
  };
}

function emitAuthExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

export function clearAuthStorage() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function storeAuthState(authState) {
  try {
    const sanitized = sanitizeAuthState(authState);
    if (!sanitized.isLoggedIn || !sanitized.user) {
      clearAuthStorage();
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // ignore storage errors
  }
}

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsedAuth = safeJsonParse(raw);
    if (!parsedAuth || typeof parsedAuth !== "object") {
      return null;
    }

    const sanitized = sanitizeAuthState(parsedAuth);
    if (!sanitized.isLoggedIn || !sanitized.user) {
      clearAuthStorage();
      return null;
    }

    if (raw !== JSON.stringify(sanitized)) {
      storeAuthState(sanitized);
    }

    return sanitized;
  } catch {
    return null;
  }
}

export function notifyAuthExpired() {
  clearAuthStorage();
  emitAuthExpired();
}

export async function authFetch(input, init = {}) {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
  });

  if (response.status === 401 || response.status === 403) {
    notifyAuthExpired();
  }

  return response;
}
