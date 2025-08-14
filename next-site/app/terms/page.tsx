import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for apps and site.",
};

import LegalPage from "@/components/LegalPage";
import LegalSection from "@/components/LegalSection";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <LegalSection title="Last updated">
        <p>{new Date().getFullYear()}</p>
      </LegalSection>
      <LegalSection title="Acceptance of Terms">
        <p>By using this site and our applications, you agree to these Terms.</p>
      </LegalSection>
      <LegalSection title="Use of Service">
        <p>You agree to use the services in compliance with applicable laws and not to misuse the services.</p>
      </LegalSection>
      <LegalSection title="Intellectual Property">
        <p>All content is owned by its respective owners and protected by law.</p>
      </LegalSection>
      <LegalSection title="Liability">
        <p>The services are provided &quot;as is&quot; without warranties of any kind.</p>
      </LegalSection>
      <LegalSection title="Contact">
        <p>Questions? Contact <a href="mailto:frankieg1610@gmail.com">frankieg1610@gmail.com</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}


