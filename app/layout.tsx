import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Ensigo Trace - Seed Collection Dashboard",
  description: "Track your seed collection batches and submissions",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// Script to prevent flash of wrong theme
const themeScript = `
  (function() {
    const theme = localStorage.getItem('ensigo-theme') || 'system';
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && systemDark);
    document.documentElement.classList.add(isDark ? 'dark' : 'light');
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${poppins.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
