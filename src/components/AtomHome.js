import React from 'react';
import { Link } from 'react-router-dom';
import AtomIcon from '../images/AtomIcon.png'

const AtomHome = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto py-6 px-4 flex items-center">
          <img src={AtomIcon} alt="Atom Logo" className="h-12 w-12 mr-4" />
          <h1 className="text-3xl font-bold text-gray-900">Atom</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12 text-center py-12">
          <h2 className="text-4xl font-bold mb-4">Simplify Your Email Experience</h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Atom gives you a clean, intuitive way to read, filter, and compose emails.
            Take control of your inbox today.
          </p>
        </section>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 text-center">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">Smart Email Organization</h3>
              <p className="text-gray-700">
                Easily read and organize your emails with our intuitive interface and powerful filtering options.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">Seamless Composition</h3>
              <p className="text-gray-700">
                Compose emails effortlessly with our clean and distraction-free composition tools.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">Privacy Focused</h3>
              <p className="text-gray-700">
                We respect your privacy and never sell your data. Your emails remain yours alone.
              </p>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="mb-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Resources</h2>
          <div className="flex justify-center space-x-6">
            <Link to="/Atom/privacy" className="text-indigo-600 hover:text-indigo-800">
              Privacy Policy
            </Link>
            <Link to="/Atom/support" className="text-indigo-600 hover:text-indigo-800">
              Support
            </Link>
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

export default AtomHome; 