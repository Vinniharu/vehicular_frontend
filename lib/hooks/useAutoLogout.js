"use client";

import { useEffect } from "react";
import { getToken, getTokenExpiryMs, redirectToLogin } from "@/lib/api";

// Backend access tokens expire after ACCESS_TOKEN_EXPIRE_MINUTES (60 min,
// app/config.py in the backend). Rather than assuming a fixed 60-minute
// window client-side, this reads the token's real `exp` claim so it stays
// correct even if that setting changes, and schedules a log-out for exactly
// when the token actually stops working — instead of waiting for the user
// to hit a 401 on their next action.
//
// Uses the same redirectToLogin() an API-call 401 uses (lib/api/core/
// client.js) rather than its own hardcoded redirect, so both ways a session
// can end — a live 401 mid-action, or the token simply timing out — land on
// the same portal-correct login page with the same "session expired"
// message, instead of this path silently dumping the user at "/".
export function useAutoLogout() {
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const expiryMs = getTokenExpiryMs(token);
    if (!expiryMs) return;

    const msUntilExpiry = expiryMs - Date.now();
    if (msUntilExpiry <= 0) {
      redirectToLogin();
      return;
    }
    const timer = setTimeout(redirectToLogin, msUntilExpiry);
    return () => clearTimeout(timer);
  }, []);
}
