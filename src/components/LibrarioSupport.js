// SupportPage.jsx
import React from 'react';

const SupportPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Librario Support</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">How can we help you?</h2>
          <p className="text-gray-700">
            Welcome to the Librario support page. Here you'll find answers to frequently asked questions and ways to get in touch with us.
          </p>
        </section>

        {/* New Email Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Contact Us via Email</h2>
          <p className="text-gray-700">
            If you have any issues or questions, feel free to email us directly at{' '}
            <a href="mailto:frankieg1610@gmail.com" className="text-indigo-600">
              frankieg1610@gmail.com
            </a>.
          </p>
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {/* FAQ Item */}
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-medium text-gray-800">Where can I download the app?</h3>
              <p className="text-gray-700 mt-2">
                The app is currently available only on iOS. 
              </p>
            </div>

            {/* Add more FAQs as needed */}
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-medium text-gray-800">How can I contact customer support?</h3>
              <p className="text-gray-700 mt-2">
                You can reach us through the contact form below or email us directly at{' '}
                <a href="mailto:frankieg1610@gmail.com" className="text-indigo-600">
                  frankieg1610@gmail.com
                </a>.
              </p>
            </div>
          </div>
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

export default SupportPage;
