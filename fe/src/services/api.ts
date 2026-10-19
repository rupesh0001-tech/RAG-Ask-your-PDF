import type { UploadedDoc } from "../types";

// Default base URL: uses the Bun reverse-proxy "/api" by default for seamless zero-CORS requests,
// or directly http://localhost:8080 if user prefers direct backend connection.
const DEFAULT_URL = "http://localhost:8080";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("nexus_api_base_url") || DEFAULT_URL;
  }
  return DEFAULT_URL;
}

export function setApiBaseUrl(url: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("nexus_api_base_url", url);
  }
}

export async function pingBackend(baseUrl: string): Promise<{ ok: boolean; pingMs: number; statusText: string }> {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);

  try {
    // If baseUrl is "/api", check health endpoint
    const url = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const probeUrl = url === "/api" ? "/api/health" : `${url}/`;
    
    const res = await fetch(probeUrl, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timer);

    const pingMs = Math.round(performance.now() - start);
    return {
      ok: res.ok || res.status === 404, // 404 still indicates server is listening
      pingMs,
      statusText: res.statusText || `${res.status}`,
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      ok: false,
      pingMs: Math.round(performance.now() - start),
      statusText: err?.message || "Failed to reach backend",
    };
  }
}

export async function uploadPdf(file: File, baseUrl: string = getApiBaseUrl()): Promise<{
  message: string;
  meta: {
    originalName: string;
    savedAs: string;
    totalPages: number;
  };
  summary?: string | null;
}> {
  const url = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const endpoint = url === "/api" ? "/api/upload" : `${url}/upload`;

  const formData = new FormData();
  formData.append("pdf", file);

  const res = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorDetail = `Upload failed with HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.message || errJson.error || errorDetail;
    } catch {
      const errText = await res.text();
      if (errText) errorDetail = errText;
    }
    throw new Error(errorDetail);
  }

  return await res.json();
}

export async function sendChatPrompt(prompt: string, baseUrl: string = getApiBaseUrl()): Promise<string> {
  const url = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const endpoint = url === "/api" ? "/api/chat" : `${url}/chat`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    let errorDetail = `Chat request failed with HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.message || errJson.error || errorDetail;
    } catch {
      const errText = await res.text();
      if (errText) errorDetail = errText;
    }
    throw new Error(errorDetail);
  }

  // The backend returns either a plain string or JSON (result.content)
  const contentType = res.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    if (typeof data === "string") return data;
    if (data?.content) return data.content;
    if (data?.data?.content) return data.data.content;
    if (data?.data) return typeof data.data === "string" ? data.data : JSON.stringify(data.data, null, 2);
    return JSON.stringify(data, null, 2);
  } else {
    return await res.text();
  }
}
