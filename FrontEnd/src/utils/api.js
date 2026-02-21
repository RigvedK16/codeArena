export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:7777";

export async function api(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();
  if (!res.ok) {
    if (typeof data === "string") {
      throw new Error(data || "Request failed");
    }

    const baseMessage = data?.message || "Request failed";
    const details = data?.details;

    // Surface provider/validation details to make debugging 4xx/5xx easier.
    if (details) {
      const detailMessage =
        (typeof details === "string" && details) ||
        details?.message ||
        JSON.stringify(details);
      throw new Error(`${baseMessage}: ${detailMessage}`);
    }

    throw new Error(baseMessage);
  }
  return data;
}
