import React from 'react';
import AtomIcon from '../images/AtomIcon.png'

const AtomPrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto py-6 px-4 flex items-center">
          <img src={AtomIcon} alt="Atom Logo" className="h-12 w-12 mr-4" />
          <h1 className="text-3xl font-bold text-gray-900">Atom Privacy Policy</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Your Privacy Matters</h2>
          <p className="text-gray-700">
            At Atom, we take your privacy very seriously. This Privacy Policy outlines how we handle your information when you use our email app.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Information We Access</h2>
          <p className="text-gray-700">
            Atom accesses your email information to allow you to read, filter, and compose emails through our app. This includes email content, contact information, and email metadata necessary for the app's functionality.
          </p>
          <p className="text-gray-700 mt-4">
            We only access the information required to provide you with our service and do not collect any unnecessary personal data.
          </p>
        </section>

        {/* How We Use Your Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="text-gray-700">
            We use the information we access solely to provide you with email services through our app. This includes:
          </p>
          <ul className="list-disc pl-5 mt-3 text-gray-700 space-y-2">
            <li>Displaying your emails and relevant information within the app</li>
            <li>Enabling you to filter and organize your emails</li>
            <li>Allowing you to compose and send emails</li>
            <li>Improving app functionality and performance</li>
          </ul>
          <p className="text-gray-700 mt-4 font-medium">
            We do not sell, rent, or share your personal data with third parties for marketing purposes.
          </p>
        </section>

        {/* Data Security */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="text-gray-700">
            We implement appropriate security measures to protect your information and ensure it's handled securely. We continuously review and improve our security practices to maintain the integrity of your data.
          </p>
        </section>

        {/* Third-Party Services */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
          <p className="text-gray-700">
            Our app may use certain third-party services necessary for core functionality. Any third-party services we use adhere to strict privacy standards, and we limit the information shared with them to only what is necessary for operation.
          </p>
        </section>

        {/* Changes to This Privacy Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
          <p className="text-gray-700">
            We may update our Privacy Policy from time to time. Any changes will be posted on this page, and we will notify you of significant updates.
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
          &copy; {new Date().getFullYear()} Atom Email. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default AtomPrivacyPolicy; 