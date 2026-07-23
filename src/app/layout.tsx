import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RITH STORE LICENCE — Premium Software License Keys",
  description:
    "Buy genuine software license keys instantly. Windows, Office, Antivirus, Adobe, Games & more. Instant digital delivery with KHQR payment. 100% authentic keys.",
  keywords: [
    "license keys",
    "software keys",
    "Windows key",
    "Office key",
    "Cambodia",
    "KHQR",
    "digital delivery",
    "RITH STORE",
  ],
  openGraph: {
    title: "RITH STORE LICENCE — Premium Software License Keys",
    description:
      "Buy genuine software license keys instantly. Instant digital delivery with KHQR payment.",
    type: "website",
  },
};

const themeScript = `
  try {
    const theme = localStorage.getItem('theme') || 'system';
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script
          id="theme-loader"
          dangerouslySetInnerHTML={{ __html: themeScript }}
          suppressHydrationWarning
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "bg-card border-border text-card-foreground dark:bg-card/95 dark:border-white/5 dark:text-foreground",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
