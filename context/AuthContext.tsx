"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { setUnauthorizedHandler } from "@/lib/authEvents";

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
  // False until the initial client-side read of localStorage has run.
  // Server-rendered HTML and the client's first paint both always see
  // user/token/refreshToken as null, so they can never disagree — real
  // values only ever show up after hydration, via the effect below.
  // Anything that needs to branch on "is the vendor logged in" (e.g. a
  // route layout deciding whether to show a loading state or redirect
  // to /login) should wait for authReady before trusting `token`.
  authReady: boolean;
  login: (user: PartnerUser, token: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "tripzido_partner_auth";

interface StoredAuth {
  user: PartnerUser;
  token: string;
  refreshToken?: string;
}

function readStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Always start null — identical on server and on the client's first
  // render. Do NOT read localStorage in a lazy initializer here; that
  // runs during render and is exactly what caused the hydration
  // mismatch (server sees no window and renders null, client's first
  // render already has window and renders the real stored value).
  const [user, setUser] = useState<PartnerUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Only touches localStorage after mount — never runs during SSR, and
  // doesn't run until after the first client render has already
  // matched the server's output, so no mismatch is possible.
  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      setUser(stored.user);
      setToken(stored.token);
      setRefreshToken(stored.refreshToken ?? null);
    }
    setAuthReady(true);
  }, []);

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

  // Runs once — AuthProvider sits at the root, so this is the single
  // place that bridges lib/api.ts's plain-module 401 detection back
  // into real logout()/navigation. Any API call anywhere in the app
  // that gets a 401 ends up here automatically.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      router.replace("/login");
    });
    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isAuthenticated: !!user,
        authReady,
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
