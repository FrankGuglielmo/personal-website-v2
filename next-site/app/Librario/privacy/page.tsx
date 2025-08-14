import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Librario Privacy Policy",
  description: "Privacy policy for the Librario app.",
};

import LegalPage from "@/components/LegalPage";
import LegalSection from "@/components/LegalSection";

export default function LibrarioPrivacyPage() {
  return (
    <LegalPage title="Librario Privacy Policy" brand="Librario">
      <LegalSection title="Your Privacy Matters">
        <p>At Librario, we are committed to protecting your privacy. This Privacy Policy outlines how we handle your information when you use our app.</p>
      </LegalSection>
      <LegalSection title="Information We Collect">
        <p>We want to assure you that Librario does not collect or store any personal or sensitive information about you. The app operates entirely on your device, and any data related to your usage remains on your device.</p>
      </LegalSection>
      <LegalSection title="How We Use Your Information">
        <p>Since we do not collect any personal information, we do not use or share any of your data. Your privacy is fully respected.</p>
      </LegalSection>
      <LegalSection title="Third-Party Services">
        <p>Librario does not use any third-party services that collect information used to identify you.</p>
      </LegalSection>
      <LegalSection title="Children&apos;s Privacy">
        <p>Our app does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13.</p>
      </LegalSection>
      <LegalSection title="Changes to This Privacy Policy">
        <p>We may update our Privacy Policy from time to time. Any changes will be posted on this page, so please review it periodically.</p>
      </LegalSection>
      <LegalSection title="Contact Us">
        <p>
          If you have any questions or concerns about this Privacy Policy, please contact us at <a href="mailto:frankieg1610@gmail.com">frankieg1610@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}


