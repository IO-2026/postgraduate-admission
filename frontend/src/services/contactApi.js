import { authFetch } from "../config/auth";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function sendContactForm({ subject, content }) {
  const response = await authFetch(`${API_URL}/form/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subject, content }),
  });

  if (!response.ok) {
    let errorMessage = "Nie udało się wysłać wiadomości.";
    try {
      const data = await response.json();
      errorMessage = data.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return true;
}
