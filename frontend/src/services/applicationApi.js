const APPLICATIONS_BASE_PATH = "/api/applications";

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

export async function fetchApplicationsOfUser(userId) {
  if (userId == null) {
    return [];
  }

  const token = getToken();
  const response = await fetch(`${APPLICATIONS_BASE_PATH}/of/${userId}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać aplikacji użytkownika.");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
