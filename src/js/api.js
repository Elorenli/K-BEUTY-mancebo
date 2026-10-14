const apiBase = `${import.meta.env.BASE_URL}api/`;
let csrfToken = null;

export function setCsrfToken(token) {
  csrfToken = token;
}

export async function apiRequest(path, { method = "GET", body, ...options } = {}) {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  const request = { ...options, method, headers, credentials: "same-origin" };

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    request.body = JSON.stringify(body);
  }
  if (!["GET", "HEAD"].includes(method.toUpperCase()) && csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  const response = await fetch(`${apiBase}${path}`, request);
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`El servidor devolvió una respuesta no válida (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data.error || `La solicitud falló (HTTP ${response.status}).`);
  }
  return data;
}
