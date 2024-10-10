// PrivacyPolicy.jsx
import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Librario Privacy Policy</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Your Privacy Matters</h2>
          <p className="text-gray-700">
            At Librario, we are committed to protecting your privacy. This Privacy Policy outlines how we handle your information when you use our app.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p className="text-gray-700">
            We want to assure you that Librario does not collect or store any personal or sensitive information about you. The app operates entirely on your device, and any data related to your usage remains on your device.
          </p>
        </section>

        {/* How We Use Your Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="text-gray-700">
            Since we do not collect any personal information, we do not use or share any of your data. Your privacy is fully respected.
          </p>
        </section>

        {/* Third-Party Services */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
          <p className="text-gray-700">
            Librario does not use any third-party services that collect information used to identify you.
          </p>
        </section>

        {/* Children's Privacy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
          <p className="text-gray-700">
            Our app does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13.
          </p>
        </section>

        {/* Changes to This Privacy Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
          <p className="text-gray-700">
            We may update our Privacy Policy from time to time. Any changes will be posted on this page, so please review it periodically.
          </p>
        </section>

        {/* Contact Us */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-700">
            If you have any questions or concerns about this Privacy Policy, please contact us at{' '}
            <a href="mailto:frankieg1610@gmail.com" className="text-indigo-600">
              frankieg1610@gmail.com
            </a>.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow mt-12">
        <div className="container mx-auto py-4 px-4 text-center text-gray-600">
          &copy; {new Date().getFullYear()} Librario. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
