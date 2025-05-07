import React from 'react';
import Link from 'next/link';

// This is a placeholder footer component
// It will be expanded in later sprints
export default function Footer() {
  return (
    <footer className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-900">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-gray-500 hover:text-gray-900">
              Contact
            </Link>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-base text-gray-500">
              &copy; {new Date().getFullYear()} The Jackier Method. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
