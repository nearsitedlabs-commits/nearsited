import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/Tooltip";
import "./globals.css";
import NoOpServiceWorker from "@/components/NoOpServiceWorker";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NearSited — Find businesses that need websites",
  description: "Find local businesses with weak websites, discover website opportunities, and win redesign projects with personalised outreach.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="no-op-service-worker" strategy="beforeInteractive">
          {`(function() {
            if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

            var ua = navigator.userAgent || "";
            var isWebview =
              /WebView|vscode|Code\/|Electron/i.test(ua) ||
              typeof window.acquireVsCodeApi === "function";
            var isSecure =
              window.isSecureContext ||
              location.protocol === "https:" ||
              location.hostname === "localhost" ||
              location.hostname === "127.0.0.1";

            if (!isSecure || isWebview) {
              try {
                var originalRegister = navigator.serviceWorker.register;
                if (typeof originalRegister === "function") {
                  navigator.serviceWorker.register = function() {
                    console.debug(
                      "NoOpServiceWorker: blocked service worker registration in webview/insecure context."
                    );
                    return Promise.reject(
                      new Error(
                        "ServiceWorker registration blocked in webview/insecure context"
                      )
                    );
                  };
                }
              } catch (error) {
                console.warn("NoOpServiceWorker: failed to patch serviceWorker.register", error);
              }
            }
          })();`}
        </Script>
        <NoOpServiceWorker />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
