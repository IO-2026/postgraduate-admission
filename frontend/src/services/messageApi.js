const API_BASE = "/api/messages";

function getToken() {
    try {
        const savedAuth = localStorage.getItem("pg-admission-auth");
        if (!savedAuth) return null;
        const parsed = JSON.parse(savedAuth);
        return parsed?.token || null;
    } catch {
        return null;
    }
}

async function request(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const data = await response.json();
            errorMessage = data.message || errorMessage;
        } catch {
            errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    if (response.status === 204 || response.status === 201) {
        return null;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

export async function sendMessage(payload) {
    return request("/send", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function fetchInbox() {
    return request("/inbox");
}

export async function fetchUnreadCount() {
    return request("/unread-count");
}

export async function markAsRead(recipientId) {
    return request(`/${recipientId}/read`, {
        method: "PATCH",
    });
}