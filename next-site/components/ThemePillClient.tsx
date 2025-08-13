"use client";

import React from "react";
import Pill from "@/components/Pill";

export default function ThemePillClient() {
  return (
    <Pill variant="solid" onClick={() => {
      const btn = document.querySelector('[aria-label="Toggle dark mode"]') as HTMLButtonElement | null;
      btn?.click();
    }}>
      Toggle Theme
    </Pill>
  );
}


