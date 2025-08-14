import React from "react";

type Props = {
  title: string;
  children?: React.ReactNode;
};

export default function LegalSection({ title, children }: Props) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl md:text-3xl font-semibold mb-3">{title}</h2>
      <div className="space-y-3 text-[--color-text]">
        {children}
      </div>
    </section>
  );
}


