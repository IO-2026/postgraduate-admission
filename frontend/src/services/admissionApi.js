const APPLICATIONS_BASE_PATH = "/api/applications";

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

export async function submitApplication(payload, file, token) {
  const formData = new FormData();
  const payloadBlob = new Blob([JSON.stringify(payload)], {
    type: "application/json",
  });
  formData.append("payload", payloadBlob, "payload.json");
  formData.append("file", file);

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
