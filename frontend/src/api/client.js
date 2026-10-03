export const BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

async function request(path, options) {
  const res = await fetch(`${BASE}/api${path}`, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      const d = body.detail;
      msg = typeof d === "string" ? d : Array.isArray(d) ? d.map((e) => e.msg.replace(/^Value error, /, "")).join(" · ") : msg;
    } catch { /* non-JSON error body */ }
    throw new ApiError(msg, res.status);
  }
  return res.json();
}

export const api = {
  overview: (filters = {}) => {
    const q = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    return request(`/analysis/overview${q ? `?${q}` : ""}`);
  },
  health: () => fetch(`${BASE}/api/health`).then((r) => r.ok),
  options: () => request("/analysis/options"),
  models: () => request("/models"),
  model: (key) => request(`/models/${key}`),
  predict: (payload, signal) => request("/predict", { method: "POST", body: JSON.stringify(payload), signal }),
};
