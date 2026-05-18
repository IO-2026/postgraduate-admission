import { API_URL } from "../config/api";
import { authFetch } from "../config/auth";

export async function getApplication(applicationId) {
  const response = await authFetch(`${API_URL}/applications/${applicationId}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać danych aplikacji");
  }
  return response.json();
}

export async function getApplicationDiplomaUrl(applicationId) {
  const response = await authFetch(
    `${API_URL}/applications/${applicationId}/diploma-url`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error("Nie udało się pobrać linku do dyplomu");
  }

  return response.json();
}

export async function fetchApplicationsOfUser(userId) {
  const response = await authFetch(`${API_URL}/applications/of/${userId}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać aplikacji użytkownika");
  }
  return response.json();
}

export async function updateApplicationStatus(applicationId, status) {
  const response = await authFetch(`${API_URL}/applications/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: applicationId,
      status,
    }),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zaktualizować statusu aplikacji");
  }

  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) : null;
}

export async function updateApplication(applicationDto) {
  const response = await authFetch(`${API_URL}/applications/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...applicationDto,
      id: applicationDto.id,
    }),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zaktualizować aplikacji");
  }

  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) : null;
}

// --- FUNKCJA POMOCNICZA (żeby nie pisać tego samego w kółko) ---
async function patchApplicationAction(
  applicationId,
  actionPath,
  defaultErrorMessage,
) {
  const response = await authFetch(
    `${API_URL}/applications/${applicationId}/${actionPath}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json", // Bardzo ważne dla Springa!
      },
    },
  );

  if (!response.ok) {
    let errorMessage = defaultErrorMessage;
    try {
      // Próbujemy wyciągnąć ładny błąd z naszego GlobalExceptionHandlera
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      console.error("Szczegóły błędu płatności:", e);
    }
    throw new Error(errorMessage);
  }

  // Skoro backend zwraca 200 OK bez ciała, po prostu zwracamy sukces
  return true;
}

// ==========================================
// 1. AKCJE DLA KANDYDATA
// ==========================================

export async function withdrawApplication(applicationId) {
  return patchApplicationAction(
    applicationId,
    "withdraw",
    "Nie udało się zrezygnować ze zgłoszenia.",
  );
}

export async function payEntryFee(applicationId) {
  return patchApplicationAction(
    applicationId,
    "pay-entry-fee",
    "Nie udało się opłacić wpisowego.",
  );
}

export async function paySemester(applicationId) {
  return patchApplicationAction(
    applicationId,
    "pay-semester",
    "Nie udało się opłacić semestru. Upewnij się, że wniosek jest zaakceptowany.",
  );
}

// ==========================================
// 2. AKCJE DLA KOORDYNATORA / ADMINA
// ==========================================

export async function verifyDiploma(applicationId) {
  return patchApplicationAction(
    applicationId,
    "verify-diploma",
    "Nie udało się zweryfikować dyplomu.",
  );
}

export async function verifyDeclaration(applicationId) {
  return patchApplicationAction(
    applicationId,
    "verify-declaration",
    "Nie udało się zweryfikować oświadczenia.",
  );
}

export async function acceptApplication(applicationId) {
  return patchApplicationAction(
    applicationId,
    "accept",
    "Nie udało się zaakceptować wniosku. Sprawdź, czy dyplom i wpisowe są odhaczone.",
  );
}
