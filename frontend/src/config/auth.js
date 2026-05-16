export const AUTH_STORAGE_KEY = "pg-admission-auth";
export const AUTH_EXPIRED_EVENT = "auth-expired";

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
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
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
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

    const sanitized = {
      isLoggedIn: Boolean(parsedAuth?.isLoggedIn),
      user: parsedAuth?.user || null,
    };

    // Remove any legacy token persisted in localStorage.
    if (Object.prototype.hasOwnProperty.call(parsedAuth, "token")) {
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
