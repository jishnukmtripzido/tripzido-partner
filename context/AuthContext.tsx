"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface PartnerUser {
  phone_number: string;
  first_name: string;
  last_name?: string;
}

interface AuthContextValue {
  user: PartnerUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: PartnerUser, token: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "tripzido_partner_auth";

interface StoredAuth {
  user: PartnerUser;
  token: string;
  refreshToken?: string; // optional — sessions logged in before this
  // field existed won't have it; treated as null below, not an error.
}

function readStoredAuth(): StoredAuth | null {
  // Runs during the component's first render. In the browser (including
  // the hydration render, which is what actually matters for a
  // client-only export like this) `window` is defined, so this reads
  // real auth state with no flash-of-wrong-content and no effect needed.
  // During the one-time static export build, `window` is undefined and
  // this just returns null — that's fine, no one sees that render.
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

// NOTE: this uses localStorage for now, which is fine in a Capacitor
// webview. If you want data to survive app reinstalls / sync across
// devices, swap this for the Capacitor Preferences plugin later —
// readStoredAuth() and the two calls below are the only places that
// would need to change.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PartnerUser | null>(
    () => readStoredAuth()?.user ?? null,
  );
  const [token, setToken] = useState<string | null>(
    () => readStoredAuth()?.token ?? null,
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    () => readStoredAuth()?.refreshToken ?? null,
  );

  function login(user: PartnerUser, token: string, refreshToken: string) {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user, token, refreshToken }),
    );
    setUser(user);
    setToken(token);
    setRefreshToken(refreshToken);
  }

  function logout() {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setToken(null);
    setRefreshToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
