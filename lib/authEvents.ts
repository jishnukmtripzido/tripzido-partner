// Bridge between lib/api.ts (a plain module, no React context access) and
// AuthContext (which owns logout() and the router). AuthProvider registers
// its handler once on mount; api.ts calls triggerUnauthorized() whenever a
// request comes back 401, with no direct import cycle between the two.
type Handler = () => void;

let handler: Handler | null = null;
let firing = false;

export function setUnauthorizedHandler(fn: Handler | null) {
  handler = fn;
  firing = false;
}

export function triggerUnauthorized() {
  // Debounced — a single page load often fires several authenticated
  // requests in parallel (dashboard, e.g.), and if the token's dead
  // they'd all 401 near-simultaneously. Without this guard that's several
  // redundant logout()+redirect calls stacking up instead of one clean one.
  if (!handler || firing) return;
  firing = true;
  handler();
  setTimeout(() => {
    firing = false;
  }, 2000);
}
