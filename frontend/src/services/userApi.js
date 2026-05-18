import { API_URL } from "../config/api";
import { authFetch } from "../config/auth";
const COURSE_API_URL = API_URL + "/users";

export const fetchUserById = async (userId) => {
  if (userId == null) throw new Error("Brak id użytkownika");
  const response = await authFetch(`${COURSE_API_URL}/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać danych użytkownika");
  }

  return response.json();
};

export const fetchCurrentUser = async () => {
  const response = await authFetch(`${COURSE_API_URL}/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać danych użytkownika");
  }

  return response.json();
};

export const fetchUsers = async () => {
  const response = await authFetch(COURSE_API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać użytkowników");
  }

  return response.json();
};

export const updateUserRole = async (userId, roleName) => {
  const response = await authFetch(`${COURSE_API_URL}/${userId}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roleName }),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zaktualizować roli użytkownika");
  }

  return response.json();
};
