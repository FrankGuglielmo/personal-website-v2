import React from "react";
import Link from "next/link";
import Card from "@/components/Card";

type Props = {
  title: string;
  brand?: string;
  children: React.ReactNode;
};

export default function LegalPage({ title, brand, children }: Props) {
  const year = new Date().getFullYear();
  return (
    <main className="min-h-dvh py-10 site-content">
      <section className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-20">
        <Card variant="glass" density="comfortable">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h1 className="text-3xl md:text-4xl font-semibold">{title}</h1>
            <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border text-sm hover:shadow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 3l9 8h-3v8h-5v-5h-2v5H6v-8H3z"/>
              </svg>
              <span>Home</span>
            </Link>
          </div>
          <div className="max-w-none">
            {children}
          </div>
          <div className="mt-8 pt-4 border-t border-border text-xs text-muted text-center">
            © {year} {brand ?? "FrankGuglielmo.com"}. All rights reserved.
          </div>
        </Card>
      </section>
    </main>
  );
}


