import { API_URL } from "../config/api";
const APPLICATIONS_BASE_PATH = API_URL + "/applications";

function getErrorMessage(payload) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return "Application request failed.";
  }

  return (
    payload.message ||
    payload.error ||
    payload.details ||
    "Application request failed."
  );
}

async function parsePayload(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function submitApplication({ payload, diplomaFile }, token) {
  const formData = new FormData();
  formData.append(
    "application",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
  formData.append("diploma", diplomaFile);

  const response = await fetch(`${APPLICATIONS_BASE_PATH}/submit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const responsePayload = await parsePayload(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(responsePayload));
  }

  return responsePayload;
}
