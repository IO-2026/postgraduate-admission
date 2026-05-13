import { API_URL } from "../config/api";
import { getToken } from "../config/auth";

export async function fetchCourses() {
  const response = await fetch(`${API_URL}/courses`);
  if (!response.ok) {
    throw new Error("Nie udało się pobrać kierunków studiów");
  }
  return response.json();
}

export async function fetchCoursesOfCoordinator(coordinatorId) {
  const token = getToken();
  const response = await fetch(
    `${API_URL}/courses/ofCoordinator?coordinatorId=${coordinatorId}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error("Nie udało się pobrać kierunków koordynatora");
  }

  const text = await response.text();
  return text ? JSON.parse(text) : [];
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

export async function fetchCourseById(id) {
  if (id == null) throw new Error("Brak id kierunku");
  const token = getToken();
  const response = await fetch(`${API_URL}/courses/${id}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Nie udało się pobrać kierunku o id ${id}`);
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
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(courseData),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zaktualizować kierunku");
  }

  // Backend returns empty body for update; fetch and return the updated course
  return fetchCourseById(id);
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
