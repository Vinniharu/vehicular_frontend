import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import GoogleProviderWrapper from "./components/GoogleProviderWrapper";
import { ToastProvider } from "./components/shared/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display serif — used sparingly, for page headings and large numeric moments
// only (wallet balance, dashboard greeting). Everything else stays Geist Sans.
const displaySerif = Fraunces({
  variable: "--font-display-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vehiculars.com"),
  title: {
    default: "Vehiculars | Vehicle Compliance",
    template: "%s | Vehiculars"
  },
  description: "Keep your vehicle documents valid without queuing at government offices. Submit, pay online, and track document renewals.",
  keywords: ["vehicle compliance", "driver's licence", "number plates", "vehicle particulars", "nigeria", "VIO", "FRSC", "vehicle inspection"],
  openGraph: {
    title: "Vehiculars | Vehicle Compliance",
    description: "Keep your vehicle documents valid without queuing at government offices. Submit, pay online, and track document renewals.",
    url: "https://vehiculars.com",
    siteName: "Vehiculars",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vehiculars | Vehicle Compliance",
    description: "Keep your vehicle documents valid without queuing at government offices. Submit, pay online, and track document renewals.",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
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
      className={`${geistSans.variable} ${geistMono.variable} ${displaySerif.variable} h-full antialiased`}
    >
      <head>
        {/* TikTok Pixel Code Start */}
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};

  ttq.load('DALAN5JC77U250DBQQ10');
  ttq.page();
}(window, document, 'ttq');
            `,
          }}
        />
        {/* TikTok Pixel Code End */}
      </head>
      <body className="min-h-full flex flex-col">
        <GoogleProviderWrapper>
          <ToastProvider>{children}</ToastProvider>
        </GoogleProviderWrapper>
      </body>
    </html>
  );
}
