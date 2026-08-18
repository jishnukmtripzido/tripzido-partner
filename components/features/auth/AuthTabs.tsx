"use client";

import { LoginForm } from "./LoginForm";

export function AuthTabs() {
  return (
    <div className="lg:max-w-md lg:mx-auto lg:w-full">
      <div className="px-6 pt-10 pb-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-brand-yellow-lg p-1.5 rounded-lg flex items-center justify-center h-8 w-8">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="font-extrabold text-2xl  tracking-tight">
            tripzido{" "}
            <span className="font-semibold text-font-dim text-sm tracking-normal">
              partner
            </span>
          </h1>
        </div>
      </div>

      <div className="px-6 flex-1 overflow-y-auto hide-scrollbar pb-10">
        <div className="animate-fade-in">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
