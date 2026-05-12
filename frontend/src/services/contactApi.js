const API_URL = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  try {
    const savedAuth = localStorage.getItem("pg-admission-auth");
    if (!savedAuth) return null;
    const parsedAuth = JSON.parse(savedAuth);
    return parsedAuth?.token || null;
  } catch {
    return null;
  }
}

export async function sendContactForm({ subject, content }) {
  const token = getToken();
  const response = await fetch(`${API_URL}/form/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
