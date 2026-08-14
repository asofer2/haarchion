import type { Metadata } from "next";
import Script from "next/script";
import { Heebo, Rubik } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { ArchiveProvider } from "@/components/ArchiveProvider";
import { A11yProvider } from "@/components/A11yProvider";
import {
  AccessibilityButton,
  AccessibilityPanel,
} from "@/components/AccessibilityPanel";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { A11Y_BOOT_SCRIPT } from "@/lib/a11y";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "אישים",
    template: "%s · אישים",
  },
  description:
    "מאגר אישים והפקות ישראליים — דיבוב, מחזמר, קולנוע, סדרות וקלטות. אתר מותאם לנגישות ולכבדי ראייה.",
  icons: {
    icon: "/logo-ishim.png",
    apple: "/logo-ishim.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${rubik.variable}`}>
      <body>
        <Script id="a11y-boot" strategy="beforeInteractive">
          {A11Y_BOOT_SCRIPT}
        </Script>
        <a className="skip-link" href="#main-content">
          דלג לתוכן הראשי
        </a>
        <AuthProvider>
          <ArchiveProvider>
            <A11yProvider>
              <div className="site-shell">
                <Header a11ySlot={<AccessibilityButton />} />
                <main id="main-content" className="site-main" tabIndex={-1}>
                  {children}
                </main>
                <Footer />
              </div>
              <AccessibilityPanel />
            </A11yProvider>
          </ArchiveProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
