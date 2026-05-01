const API_URL = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  try {
    const savedAuth = localStorage.getItem("pg-admission-auth");
    if (!savedAuth) return null;
    const parsedAuth = JSON.parse(savedAuth);
    return parsedAuth?.token;
  } catch {
    return null;
  }
}

export async function getApplication(applicationId) {
  const token = getToken();
  const response = await fetch(`${API_URL}/applications/${applicationId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać danych aplikacji");
  }
  return response.json();
}

export async function updateApplicationStatus(applicationId, status) {
  const token = getToken();
  const response = await fetch(`${API_URL}/applications/${applicationId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zaktualizować statusu aplikacji");
  }

  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) : null;
}

export async function updateApplication(applicationDto) {
  const token = getToken();
  const response = await fetch(`${API_URL}/applications/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      ...applicationDto,
      id: applicationDto.id,
    }),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zaktualizować danych aplikacji");
  }

  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) : null;
}
