import { ComponentPropsWithoutRef, ElementType } from "react";
import { twMerge } from "tailwind-merge";

type GlassPanelProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & ComponentPropsWithoutRef<T>;

export default function GlassPanel<T extends ElementType = "div">({ as, className = "", style, ...props }: GlassPanelProps<T>) {
  const Component = (as || "div") as ElementType;
  const mergedClassName = twMerge("glass rounded-3xl border border-white/40", className);
  const mergedStyle = {
    WebkitBackdropFilter: "blur(12px) saturate(140%)",
    backdropFilter: "blur(12px) saturate(140%)",
    ...(style as object),
  };

  return <Component className={mergedClassName} style={mergedStyle} {...props} />;
}


