let tempbackendServerBaseURL = "http://localhost:7400";
let tempsocketURL = "http://localhost:7400";
let tempFrontEndURL = "http://localhost:3005";

if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  console.log("dev - using localhost URLs");
  tempbackendServerBaseURL = "http://localhost:7400";
  tempsocketURL = "http://localhost:7400";
  tempFrontEndURL = "http://localhost:3005";
} else {
  // Production: set in Vercel (or hosting) env vars. Supabase handles data/auth; optional Node API URL here.
  tempbackendServerBaseURL = process.env.REACT_APP_API_URL || "";
  tempsocketURL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || "";
  tempFrontEndURL = process.env.REACT_APP_FRONTEND_URL || (typeof window !== "undefined" ? window.location.origin : "");
}

export let backendServerBaseURL = tempbackendServerBaseURL;
export let socketURL = tempsocketURL;
export let frontURL = tempFrontEndURL;

/** Full URL for avatar/logo/fevicon. Use for display only. Supabase Storage returns full URLs; legacy paths use backend. Never returns .../null. */
export function getAssetUrl(path) {
  if (path == null || path === "" || String(path) === "null") return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${tempbackendServerBaseURL}${normalized}`;
}
