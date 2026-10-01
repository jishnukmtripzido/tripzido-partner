/**
 * Some API fields (e.g. KYC document `file`) come back as a path like
 * "/media/vendor/documents/x.pdf" rather than a full URL. In the browser
 * that happens to work only when the site and API share an origin; in
 * the Capacitor app the page origin is https://localhost (the bundled
 * files), so a bare path points at the phone itself and fails.
 *
 * Prefixing the API origin gives a real URL — which Capacitor also
 * treats as external, opening it in the system browser (where PDFs can
 * actually be viewed) instead of navigating the app's WebView away.
 */
export function toAbsoluteMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
