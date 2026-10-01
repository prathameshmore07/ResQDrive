const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const getToken = () => localStorage.getItem("resq_token");

const request = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
};

export const api = {
    // Auth
    login: async (credentials) => {
        const data = await request("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
        if (data?.token) {
            localStorage.setItem("resq_token", data.token);
        }
        return data;
    },
    register: async (userData) => {
        const data = await request("/auth/register", { method: "POST", body: JSON.stringify(userData) });
        if (data?.token) {
            localStorage.setItem("resq_token", data.token);
        }
        return data;
    },
    logout: () => {
        localStorage.removeItem("resq_token");
    },
    getMe: () => request("/auth/me", { method: "GET" }),

    // Requests
    createRequest: (payload) => request("/requests", { method: "POST", body: JSON.stringify(payload) }),
    getMyRequests: () => request("/requests/my", { method: "GET" }),
    getRequestById: (id) => request(`/requests/${id}`, { method: "GET" }),
    getPendingRequests: () => request("/requests/pending", { method: "GET" }),
    updateRequest: (id, payload) => request(`/requests/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    updateStatus: (id, status, note = "") =>
        request(`/requests/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status, note })
        }),
    acceptRequest: (id) => request(`/requests/${id}/accept`, { method: "PATCH" }),
    dispatchRequest: (id) => request(`/requests/${id}/dispatch`, { method: "POST" }),
    cancelRequest: (id) => request(`/requests/${id}`, { method: "DELETE" }),

    // Providers
    getAvailableProviders: () => request("/providers/available", { method: "GET" }),
    toggleAvailability: (isAvailable) =>
        request("/providers/availability", {
            method: "PATCH",
            body: JSON.stringify({ isAvailable })
        }),
    updateLocation: (locationData) =>
        request("/providers/location", {
            method: "PATCH",
            body: JSON.stringify(locationData)
        })
};
