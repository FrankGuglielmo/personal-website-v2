import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atom Privacy Policy",
  description: "Privacy policy for the Atom email app.",
};

import LegalPage from "@/components/LegalPage";
import LegalSection from "@/components/LegalSection";

export default function AtomPrivacyPage() {
  return (
    <LegalPage title="Atom Privacy Policy" brand="Atom Email">
      <LegalSection title="Your Privacy Matters">
        <p>At Atom, we take your privacy very seriously. This Privacy Policy outlines how we handle your information when you use our email app.</p>
      </LegalSection>
      <LegalSection title="Information We Access">
        <p>Atom accesses your email information to allow you to read, filter, and compose emails through our app. This includes email content, contact information, and email metadata necessary for the app&apos;s functionality.</p>
        <p>We only access the information required to provide you with our service and do not collect any unnecessary personal data.</p>
      </LegalSection>
      <LegalSection title="How We Use Your Information">
        <ul className="list-disc pl-6">
          <li>Displaying your emails and relevant information within the app</li>
          <li>Enabling you to filter and organize your emails</li>
          <li>Allowing you to compose and send emails</li>
          <li>Improving app functionality and performance</li>
        </ul>
        <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
      </LegalSection>
      <LegalSection title="Data Security">
        <p>We implement appropriate security measures to protect your information and ensure it&apos;s handled securely. We continuously review and improve our security practices to maintain the integrity of your data.</p>
      </LegalSection>
      <LegalSection title="Third-Party Services">
        <p>Our app may use certain third-party services necessary for core functionality. Any third-party services we use adhere to strict privacy standards, and we limit the information shared with them to only what is necessary for operation.</p>
      </LegalSection>
      <LegalSection title="Changes to This Privacy Policy">
        <p>We may update our Privacy Policy from time to time. Any changes will be posted on this page, and we will notify you of significant updates.</p>
      </LegalSection>
      <LegalSection title="Contact Us">
        <p>
          If you have any questions or concerns about this Privacy Policy, please contact us at <a href="mailto:frankieg1610@gmail.com">frankieg1610@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}


