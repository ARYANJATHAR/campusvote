'use client'

import Link from 'next/link'

export default function AuthError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-4">
          There was an error verifying your email. This could be because:
        </p>
        <ul className="list-disc list-inside text-gray-600 mb-4">
          <li>The confirmation link has expired</li>
          <li>The confirmation link has already been used</li>
          <li>The confirmation link is invalid</li>
        </ul>
        <p className="text-gray-600 mb-6">
          Please try signing up again or contact support if the problem persists.
        </p>
        <Link
          href="/auth/login"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Return to Login
        </Link>
      </div>
    </div>
  )
} 