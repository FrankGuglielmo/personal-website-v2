import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Legacy CRA routes → Next.js destinations
      { source: "/Atom", destination: "/Atom/support", permanent: true },
      { source: "/blog", destination: "/", permanent: true },
      { source: "/blog/:postId", destination: "/", permanent: true },
      // Redirect project deep links to projects section
      { source: "/projects/:projectName", destination: "/#projects", permanent: true },
    ];
  },
};

export default nextConfig;
