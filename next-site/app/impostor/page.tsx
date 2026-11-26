import type { Metadata } from "next";
import { pageMetadata } from "@/data/site";
import ImpostorApp from "./_components/ImpostorApp";

export const metadata: Metadata = pageMetadata({
  title: "Impostor",
  description: "A Spyfall-style party game. Everyone gets the same secret except the impostor. Play on your own phone.",
  path: "/impostor",
  index: false,
});

export default function ImpostorPage() {
  return <ImpostorApp />;
}
