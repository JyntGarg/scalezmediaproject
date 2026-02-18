let tempbackendServerBaseURL = "http://localhost:7400";
let tempsocketURL = "http://localhost:7400";
let tempFrontEndURL = "http://localhost:3005";

if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  console.log("dev - using localhost URLs");
  tempbackendServerBaseURL = "http://localhost:7400";
  tempsocketURL = "http://localhost:7400";
  tempFrontEndURL = "http://localhost:3005";
} else {
  tempbackendServerBaseURL = "https://api.scalez.in";
  tempsocketURL = "https://api.scalez.in";
  tempFrontEndURL = "https://app.scalez.in";
}

export let backendServerBaseURL = tempbackendServerBaseURL;
export let socketURL = tempsocketURL;
export let frontURL = tempFrontEndURL;

/** Full URL for avatar/logo/fevicon. Use for display only. Supabase Storage returns full URLs; legacy paths use backend. */
export function getAssetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${tempbackendServerBaseURL}${normalized}`;
}
