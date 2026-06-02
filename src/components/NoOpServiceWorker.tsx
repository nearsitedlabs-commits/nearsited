"use client";

import { useEffect } from "react";

export default function NoOpServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const ua = navigator.userAgent || "";
    const isWebview =
      /WebView|vscode|Code\/|Electron/i.test(ua) ||
      typeof (window as any).acquireVsCodeApi === "function";
    const isSecure =
      // standard secure context check
      (window as any).isSecureContext ||
      location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";

    if (!isSecure || isWebview) {
      const original = navigator.serviceWorker.register;
      // replace register with a rejecting stub to avoid InvalidStateError in webviews
      // consumers can still handle the rejection if they expect it
      (navigator.serviceWorker as any).register = (..._args: any[]) => {
        console.debug(
          "NoOpServiceWorker: blocked service worker registration in webview/insecure context."
        );
        return Promise.reject(
          new Error("ServiceWorker registration blocked in webview/insecure context")
        );
      };

      return () => {
        try {
          (navigator.serviceWorker as any).register = original;
        } catch (e) {
          /* ignore */
        }
      };
    }
  }, []);

  return null;
}
