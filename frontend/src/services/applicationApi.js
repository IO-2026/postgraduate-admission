const APPLICATIONS_BASE_PATH = "/api/applications";

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

export async function getApplication(applicationId) {
  const token = getToken();
  const response = await fetch(`${API_URL}/applications/${applicationId}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać danych aplikacji");
  }
  return response.json();
}

export async function getApplicationDiplomaUrl(applicationId) {
  const token = getToken();
  const response = await fetch(
    `${API_URL}/applications/${applicationId}/diploma-url`,
    {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error("Nie udało się pobrać linku do dyplomu");
  }

  return response.json();
}

export async function fetchApplicationsOfUser(userId) {
  const token = getToken();
  const response = await fetch(`${API_URL}/applications/of/${userId}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać aplikacji użytkownika");
  }
  return response.json();
}

export async function updateApplicationStatus(applicationId, status) {
  const token = getToken();
  const response = await fetch(`${API_URL}/applications/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      id: applicationId,
      status,
    }),
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
    throw new Error("Nie udało się zaktualizować aplikacji");
  }

  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) : null;
}

export async function withdrawApplication(applicationId) {
  const token = getToken();
  const response = await fetch(
    `${API_URL}/applications/${applicationId}/withdraw`,
    {
      method: "PATCH",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error("Nie udało się zrezygnować ze zgłoszenia");
  }

  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) : null;
}
