import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import GoogleProviderWrapper from "./components/GoogleProviderWrapper";

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
      <body className="min-h-full flex flex-col">
        <GoogleProviderWrapper>{children}</GoogleProviderWrapper>
      </body>
    </html>
  );
}
