import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atom Support",
  description: "Support page for Atom email app.",
};

import LegalPage from "@/components/LegalPage";
import LegalSection from "@/components/LegalSection";

export default function AtomSupportPage() {
  return (
    <LegalPage title="Atom Support" brand="Atom Email">
      <LegalSection title="How can we help you?">
        <p>Welcome to the Atom support page. Here you&apos;ll find answers to frequently asked questions and ways to get in touch with us.</p>
      </LegalSection>
      <LegalSection title="Contact Us">
        <p>
          If you have any issues or questions, feel free to email us directly at <a href="mailto:frankieg1610@gmail.com">frankieg1610@gmail.com</a>.
        </p>
      </LegalSection>
      <LegalSection title="Frequently Asked Questions">
        <div className="space-y-4">
          <div className="glass border rounded p-6">
            <h3 className="font-medium">What does Atom do?</h3>
            <p className="text-muted mt-2">Atom is an email app that allows you to read, filter, and compose emails with a clean, intuitive interface.</p>
          </div>
          <div className="glass border rounded p-6">
            <h3 className="font-medium">Is my email data secure?</h3>
            <p className="text-muted mt-2">Yes, we take security very seriously. Atom only accesses the information needed to provide email functionality, and we never sell your data to third parties.</p>
          </div>
          <div className="glass border rounded p-6">
            <h3 className="font-medium">Where can I download the app?</h3>
            <p className="text-muted mt-2">The app is currently available on iOS and Android platforms.</p>
          </div>
          <div className="glass border rounded p-6">
            <h3 className="font-medium">How do I get started with Atom?</h3>
            <p className="text-muted mt-2">After downloading the app, simply sign in with your email account credentials. Atom will guide you through the setup process to customize your experience.</p>
          </div>
        </div>
      </LegalSection>
    </LegalPage>
  );
}


