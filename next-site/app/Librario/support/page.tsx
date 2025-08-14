import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Librario Support",
  description: "Support page for Librario.",
};

import LegalPage from "@/components/LegalPage";
import LegalSection from "@/components/LegalSection";

export default function LibrarioSupportPage() {
  return (
    <LegalPage title="Librario Support" brand="Librario">
      <LegalSection title="How can we help you?">
        <p>Welcome to the Librario support page. Here you&apos;ll find answers to frequently asked questions and ways to get in touch with us.</p>
      </LegalSection>
      <LegalSection title="Contact Us via Email">
        <p>
          If you have any issues or questions, feel free to email us directly at <a href="mailto:frankieg1610@gmail.com">frankieg1610@gmail.com</a>.
        </p>
      </LegalSection>
      <LegalSection title="Frequently Asked Questions">
        <div className="space-y-4">
          <div className="glass border rounded p-6">
            <h3 className="font-medium">Where can I download the app?</h3>
            <p className="text-muted mt-2">The app is currently available only on iOS.</p>
          </div>
        </div>
      </LegalSection>
    </LegalPage>
  );
}


