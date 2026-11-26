import type { Metadata } from "next";
import { pageMetadata } from "@/data/site";
import WordSpiesApp from "./_components/WordSpiesApp";

export const metadata: Metadata = pageMetadata({
  title: "Word Spies",
  description: "A team word-guessing party game. One board on the TV, spymasters on their phones.",
  path: "/codenames",
  index: false,
});

export default function CodenamesPage() {
  return <WordSpiesApp />;
}
