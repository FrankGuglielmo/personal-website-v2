import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Analytics } from "@vercel/analytics/next"
import { ogImage, siteDescription, siteName, siteTitle, siteUrl } from "@/data/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: siteTitle,
    description: siteDescription,
    images: [ogImage],
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
    images: [ogImage.url],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/FrankGuglielmo192.png", sizes: "192x192", type: "image/png" },
      { url: "/FrankGuglielmo512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/FrankGuglielmo192.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased text-[--color-text]">
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function(){
              try{
                var stored=localStorage.getItem('theme');
                var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;
                var isDark = stored==='dark' || (!stored && prefersDark);
                document.documentElement.classList.remove('dark','light');
                document.documentElement.classList.add(isDark ? 'dark' : 'light');
              }catch(e){}
            })();
          `}
        </Script>
        <Sidebar />
        <div className="site-content lg:pl-[22rem]">
          <Navbar />
          {children}
          <Analytics />
        </div>
      </body>
    </html>
  );
}
