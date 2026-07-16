"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SKIP_AUTH } from "@/lib/devFlags";

/** Root route just forwards to the right screen — no UI of its own. */
export default function RootPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    router.replace(SKIP_AUTH || isAuthenticated ? "/dashboard" : "/login");
  }, [isAuthenticated, router]);

  return null;
}
