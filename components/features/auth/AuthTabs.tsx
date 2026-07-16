"use client";

import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

type Tab = "login" | "register";

export function AuthTabs() {
  const [tab, setTab] = useState<Tab>("login");

  return (
    <>
      <div className="px-6 pt-10 pb-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-brand-yellow-lg p-1.5 rounded-lg flex items-center justify-center h-8 w-8">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="font-extrabold text-2xl font-heading tracking-tight">
            tripzido{" "}
            <span className="font-semibold text-font-dim text-sm tracking-normal">partner</span>
          </h1>
        </div>

        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 py-2.5 text-center rounded-lg text-sm transition-all border ${
              tab === "login"
                ? "bg-white shadow-sm font-semibold border-gray-100"
                : "text-font-dim font-medium border-transparent hover:text-font-main-sub"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 py-2.5 text-center rounded-lg text-sm transition-all border ${
              tab === "register"
                ? "bg-white shadow-sm font-semibold border-gray-100"
                : "text-font-dim font-medium border-transparent hover:text-font-main-sub"
            }`}
          >
            Register
          </button>
        </div>
      </div>

      <div className="px-6 flex-1 overflow-y-auto hide-scrollbar pb-10">
        {tab === "login" ? (
          <div key="login" className="animate-fade-in">
            <LoginForm />
          </div>
        ) : (
          <div key="register" className="animate-slide-up">
            <RegisterForm />
          </div>
        )}
      </div>
    </>
  );
}
