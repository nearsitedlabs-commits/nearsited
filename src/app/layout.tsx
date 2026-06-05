import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/Tooltip";
import "./globals.css";
import NoOpServiceWorker from "@/components/NoOpServiceWorker";
import { CookieConsent } from "@/components/CookieConsent";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "NearSited — Find businesses that need websites",
  description: "Find local businesses with weak websites, discover website opportunities, and win redesign projects with personalised outreach.",
  manifest: "/manifest.json",
  openGraph: {
    title: "NearSited — Find businesses that need websites",
    description: "Discover local businesses with weak or missing websites, get opportunity scores, and generate personalised outreach pitches in under 2 minutes.",
    url: "https://nearsited.com",
    siteName: "NearSited",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NearSited — Find businesses that need websites",
    description: "Discover local businesses with weak or missing websites, get opportunity scores, and generate personalised outreach pitches in under 2 minutes.",
  },
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
        <Script
          id="json-ld"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "NearSited",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: "Find local businesses with weak websites, discover website opportunities, and win redesign projects with personalised outreach.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Organization",
                name: "Again Labs",
                url: "https://againlive.com",
              },
            }),
          }}
        />
        <Script
          id="json-ld-faq"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does Nearsited find businesses?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Enter a city and business type. Nearsited searches Google Places to discover local businesses, classifies their website status (no website, social-only, platform-only, or weak website), and ranks them by opportunity score.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Nearsited free?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, Nearsited is currently in free beta. You can audit up to 10 businesses per month at no cost. Paid plans with higher limits are coming soon.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How long does it take to get results?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Under 2 minutes from entering a city to having a ready-to-send pitch. Nearsited automates the research, audit, and pitch writing process.",
                  },
                },
              ],
            }),
          }}
        />
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
        <TooltipProvider>
          {children}
          <CookieConsent />
        </TooltipProvider>
      </body>
    </html>
  );
}
