import { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  id?: string;
  className?: string;
  ariaLabel?: string;
}>;

export default function Section({ id, className = "", ariaLabel, children }: Props) {
  return (
    <section id={id} aria-label={ariaLabel} className={`py-16 md:py-24 ${className}`}>
      <div className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-20">{children}</div>
    </section>
  );
}


