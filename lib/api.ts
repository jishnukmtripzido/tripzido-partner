// Thin fetch wrapper for a fully client-side app. Unlike a server-
// component version of this file, there's no Next.js Data Cache to
// configure (`next: { revalidate }`), since every call here runs in
// the browser/webview at request time.

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
  timeout?: number;
};

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token, timeout = 30000 } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      let message = `API error: ${res.status} ${res.statusText}`;
      try {
        const errorBody = await res.json();
        if (errorBody?.message) message = errorBody.message;
      } catch {
        // response wasn't JSON — fall back to the generic message above
      }
      throw new Error(message);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeout / 1000}s — ${endpoint}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, { ...options, method: "POST", body }),
  patch: <T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, { ...options, method: "PATCH", body }),
  put: <T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, { ...options, method: "PUT", body }),
  delete: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
