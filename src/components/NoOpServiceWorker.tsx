"use client";

import { useEffect } from "react";

export default function NoOpServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const ua = navigator.userAgent || "";
    const win = window as unknown as {
      acquireVsCodeApi?: () => void;
      isSecureContext?: boolean;
    };
    const isWebview =
      /WebView|vscode|Code\/|Electron/i.test(ua) ||
      typeof win.acquireVsCodeApi === "function";
    const isSecure =
      // standard secure context check
      win.isSecureContext ||
      location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";

    if (!isSecure || isWebview) {
      const sw = navigator.serviceWorker as unknown as {
        register: (
          url: string,
          options?: RegistrationOptions
        ) => Promise<ServiceWorkerRegistration>;
      };
      const original = sw.register;
      // replace register with a rejecting stub to avoid InvalidStateError in webviews
      // consumers can still handle the rejection if they expect it
      sw.register = (..._args: unknown[]) => {
        console.debug(
          "NoOpServiceWorker: blocked service worker registration in webview/insecure context."
        );
        return Promise.reject(
          new Error("ServiceWorker registration blocked in webview/insecure context")
        );
      };

      return () => {
        try {
          sw.register = original;
        } catch (_e) {
          /* ignore */
        }
      };
    }
  }, []);

  return null;
}
