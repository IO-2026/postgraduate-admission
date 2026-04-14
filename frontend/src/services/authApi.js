const AUTH_BASE_PATH = "/api/auth";

function getErrorMessage(payload) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return "Authentication request failed.";
  }

  return (
    payload.message ||
    payload.error ||
    payload.details ||
    "Authentication request failed."
  );
}

async function parsePayload(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function postAuth(path, body) {
  const response = await fetch(`${AUTH_BASE_PATH}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await parsePayload(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return payload;
}

export function loginUser(credentials) {
  return postAuth("/login", credentials);
}

export function registerUser(data) {
  return postAuth("/register", {
    ...data,
    roleId: 1,
  });
}
