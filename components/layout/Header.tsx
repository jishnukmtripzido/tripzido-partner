"use client";

import type { ReactNode } from "react";

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  /** Right-side slot — the "ADD BIKE" button, filter icon, bell, etc. */
  rightSlot?: ReactNode;
}

/**
 * Sticky top header shared by every dashboard screen. The left side
 * is always the hamburger (opens the Sidebar drawer) + page title;
 * the right side changes per page.
 */
export function Header({ title, onMenuClick, rightSlot }: HeaderProps) {
  return (
    <header className="bg-white sticky top-0 z-20 px-5 py-4 flex justify-between items-center shadow-sm pt-safe">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="text-font-main-sub hover:text-brand-yellow-lg transition-colors"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="font-heading font-bold text-xl tracking-tight">
          {title}
        </h1>
      </div>

      {rightSlot}
    </header>
  );
}
