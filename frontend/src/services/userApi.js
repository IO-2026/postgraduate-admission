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
    throw new Error("Failed to fetch users");
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
    throw new Error("Failed to update user role");
  }

  return response.json();
};
