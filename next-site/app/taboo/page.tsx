import type { Metadata } from "next";
import { pageMetadata } from "@/data/site";
import TabooApp from "./_components/TabooApp";

export const metadata: Metadata = pageMetadata({
  title: "Forbidden Words",
  description: "A Taboo-style multiplayer party game. Everyone plays on their own phone.",
  path: "/taboo",
  index: false,
});

export default function TabooPage() {
  return <TabooApp />;
}
