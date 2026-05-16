import { fetchCoursesOfCoordinator, fetchCourseCandidates } from "./courseApi";
import { API_URL } from "../config/api";
import { authFetch } from "../config/auth";
const API_BASE = API_URL + "/messages";

async function request(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await authFetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Żądanie nie powiodło się ze statusem ${response.status}`;
    try {
      const data = await response.json();
      errorMessage = data.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204 || response.status === 201) {
    return null;
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function sendMessage(payload) {
  return request("/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchInbox() {
  return request("/inbox");
}

export async function fetchUnreadCount() {
  return request("/unread-count");
}

export async function markAsRead(recipientId) {
  return request(`/${recipientId}/read`, {
    method: "PATCH",
  });
}

export async function getAvailableRecipients(user) {
  if (user?.role === "Admin") {
    const res = await authFetch(API_URL + "/users");
    if (!res.ok) throw new Error("Błąd pobierania użytkowników");
    const users = await res.json();
    return users.filter(
      (u) => u.roleName === "Candidate" || u.role === "Candidate",
    );
  }

  if (user?.role === "Coordinator") {
    const myCourses = await fetchCoursesOfCoordinator(user.id);

    const candidatesPromises = myCourses.map((course) =>
      fetchCourseCandidates(course.id),
    );
    const results = await Promise.all(candidatesPromises);

    const allCandidates = results.flat();
    return Array.from(new Map(allCandidates.map((c) => [c.id, c])).values());
  }

  return [];
}
