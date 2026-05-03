const API_URL = "http://localhost:8080/api/users";

export const fetchUsers = async (token) => {
  const response = await fetch(API_URL, {
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
  const response = await fetch(`${API_URL}/${userId}/role`, {
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

export const deleteUser = async (token, userId) => {
  const response = await fetch(`${API_URL}/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete user");
  }

  const text = await response.text();
  // Return the text directly since the backend might return a plain text success message instead of JSON.
  return text;
};
