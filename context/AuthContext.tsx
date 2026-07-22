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
  isAuthenticated: boolean;
  login: (user: PartnerUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "tripzido_partner_auth";

function readStoredAuth(): { user: PartnerUser; token: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { user: PartnerUser; token: string };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PartnerUser | null>(
    () => readStoredAuth()?.user ?? null,
  );
  // NEW: token was already being written to localStorage by login(),
  // but nothing ever read it back — so any authenticated fetch (like
  // the Fleet list) had no token to attach. Exposing it here fixes
  // that. Same "swap for Capacitor Preferences later" note as before
  // applies to this too.
  const [token, setToken] = useState<string | null>(
    () => readStoredAuth()?.token ?? null,
  );

  function login(user: PartnerUser, token: string) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    setUser(user);
    setToken(token);
  }

  function logout() {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user, login, logout }}
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
