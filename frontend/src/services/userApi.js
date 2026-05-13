import { API_URL } from "../config/api";
const COURSE_API_URL = API_URL + "/users";

export const fetchUsers = async (token) => {
  const response = await fetch(COURSE_API_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać użytkowników");
  }

  return response.json();
};

export const updateUserRole = async (token, userId, roleName) => {
  const response = await fetch(`${COURSE_API_URL}/${userId}/role`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roleName }),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zaktualizować roli użytkownika");
  }

  return response.json();
};
