export async function api(path, options = {}) {
  const token = sessionStorage.getItem("care360-token");
  const response = await fetch(
    `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    },
  );
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload.message ||
        "We could not complete that request. Please try again.",
    );
  }
  return payload;
}
