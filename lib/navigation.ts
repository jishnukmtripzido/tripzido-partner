import type { Route } from "next";

type AppRouter = {
  back: () => void;
  replace: (href: Route) => void;
};

/**
 * "Go back to where I came from". Uses real history when there is some,
 * so the page we're leaving is popped off the stack.
 *
 * Don't use router.push(previousPage) for this: that ADDS a new entry,
 * so the page being left stays in history right behind it — pressing
 * back from the "previous" page then returns to this one, and the two
 * pages loop forever (e.g. Add bike ⇄ New pickup point).
 *
 * `fallback` is only for when there's nothing to go back to (app opened
 * directly on this page); it replaces this entry rather than stacking.
 */
export function goBackOr(router: AppRouter, fallback: string) {
  if (typeof window !== "undefined" && window.history.length > 1) {
    router.back();
  } else {
    router.replace(fallback as Route);
  }
}
