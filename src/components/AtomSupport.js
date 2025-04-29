import React from 'react';
import AtomIcon from '../images/AtomIcon.png'

const AtomSupport = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto py-6 px-4 flex items-center">
          <img src={AtomIcon} alt="Atom Logo" className="h-12 w-12 mr-4" />
          <h1 className="text-3xl font-bold text-gray-900">Atom Support</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">How can we help you?</h2>
          <p className="text-gray-700">
            Welcome to the Atom support page. Here you'll find answers to frequently asked questions and ways to get in touch with us.
          </p>
        </section>

        {/* Contact Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
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
              <h3 className="font-medium text-gray-800">What does Atom do?</h3>
              <p className="text-gray-700 mt-2">
                Atom is an email app that allows you to read, filter, and compose emails with a clean, intuitive interface.
              </p>
            </div>

            {/* FAQ Item */}
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-medium text-gray-800">Is my email data secure?</h3>
              <p className="text-gray-700 mt-2">
                Yes, we take security very seriously. Atom only accesses the information needed to provide email functionality, and we never sell your data to third parties.
              </p>
            </div>

            {/* FAQ Item */}
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-medium text-gray-800">Where can I download the app?</h3>
              <p className="text-gray-700 mt-2">
                The app is currently available on iOS and Android platforms.
              </p>
            </div>

            {/* FAQ Item */}
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-medium text-gray-800">How do I get started with Atom?</h3>
              <p className="text-gray-700 mt-2">
                After downloading the app, simply sign in with your email account credentials. Atom will guide you through the setup process to customize your experience.
              </p>
            </div>
          </div>
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

export default AtomSupport; 