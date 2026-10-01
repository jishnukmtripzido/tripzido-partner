"use client";

import type { ReactNode } from "react";
import { useDismissTransition } from "@/hooks/useDismissTransition";

/**
 * Animated bottom sheet for forms opened via a parent's conditional
 * render ({open && <BottomSheet/>}). Children get `dismiss`, which
 * plays the exit animation before calling onClose.
 */
export function BottomSheet({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: (dismiss: () => void) => ReactNode;
}) {
  const { phase, dismiss } = useDismissTransition(onClose);

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center">
      <div
        onClick={dismiss}
        className={`modal-backdrop modal-backdrop-${phase} absolute inset-0 bg-black/50`}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal-panel modal-panel-${phase} relative mt-auto flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-brand-bg sm:mt-0 sm:max-w-md sm:rounded-3xl`}
      >
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-300 sm:hidden" />
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-bold text-font-main-sub">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-0.5 text-xs text-font-dim">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-font-main-sub shadow-sm hover:bg-gray-100 active:bg-gray-100"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
          {children(dismiss)}
        </div>
      </div>
    </div>
  );
}
