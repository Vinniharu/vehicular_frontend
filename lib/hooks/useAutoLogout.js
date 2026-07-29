"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, removeToken, getTokenExpiryMs } from "@/lib/api";

// Backend access tokens expire after ACCESS_TOKEN_EXPIRE_MINUTES (60 min,
// app/config.py in the backend). Rather than assuming a fixed 60-minute
// window client-side, this reads the token's real `exp` claim so it stays
// correct even if that setting changes, and schedules a log-out for exactly
// when the token actually stops working — instead of waiting for the user
// to hit a 401 on their next action.
export function useAutoLogout() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const expiryMs = getTokenExpiryMs(token);
    if (!expiryMs) return;

    const logout = () => {
      removeToken();
      router.push("/");
    };

    const msUntilExpiry = expiryMs - Date.now();
    if (msUntilExpiry <= 0) {
      logout();
      return;
    }
    const timer = setTimeout(logout, msUntilExpiry);
    return () => clearTimeout(timer);
  }, [router]);
}
