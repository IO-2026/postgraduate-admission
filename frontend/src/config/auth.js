export const AUTH_STORAGE_KEY = "pg-admission-auth";

export function getToken() {
  try {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!savedAuth) return null;
    const parsedAuth = JSON.parse(savedAuth);
    return parsedAuth?.token || null;
  } catch {
    return null;
  }
}
