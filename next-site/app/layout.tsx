import type { Metadata } from "next";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "FrankGuglielmo.com",
  description: "Software Engineer Portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-[--color-background] text-[--color-text]">
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
        <Navbar />
        {children}
      </body>
    </html>
  );
}
