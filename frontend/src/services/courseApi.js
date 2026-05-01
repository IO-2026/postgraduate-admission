const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

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

export async function fetchCourses() {
  const response = await fetch(`${API_URL}/courses`);
  if (!response.ok) {
    throw new Error("Nie udało się pobrać kierunków studiów");
  }
  return response.json();
}

export async function fetchCoursesOfCoordinator(coordinatorId) {
  const token = getToken();
  const response = await fetch(`${API_URL}/courses/${coordinatorId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać kierunków koordynatora");
  }
  return response.json();
}

export async function fetchCourseCandidates(id) {
  const token = getToken();
  const response = await fetch(`${API_URL}/courses/${id}/candidates`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać kandydatów kierunku");
  }
  return response.json();
}

export async function createCourse(courseData) {
  const token = getToken();

  const response = await fetch(`${API_URL}/courses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(courseData),
  });

  if (!response.ok) {
    throw new Error("Nie udało się utworzyć kierunku");
  }
  return response.json();
}

export async function updateCourse(id, courseData) {
  const token = getToken();
  const response = await fetch(`${API_URL}/courses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(courseData),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zaktualizować kierunku");
  }
  return response.json();
}

export async function deleteCourse(id) {
  const token = getToken();
  const response = await fetch(`${API_URL}/courses/${id}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się usunąć kierunku");
  }
  return true;
}
