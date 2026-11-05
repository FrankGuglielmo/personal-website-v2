import type { Metadata } from "next";
import { pageMetadata } from "@/data/site";

export const metadata: Metadata = pageMetadata({
  title: "Design Playground",
  description: "Design playground for liquid glass layout experiments.",
  path: "/playground",
  index: false,
});

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
