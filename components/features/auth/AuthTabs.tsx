"use client";

import { LoginForm } from "./LoginForm";
import { AuthScreen } from "./AuthScreen";

export function AuthTabs() {
  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Manage your fleet, track earnings and grow your business."
    >
      <div className="animate-fade-in">
        <LoginForm />
      </div>
    </AuthScreen>
  );
}
