'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AuthError() {
  const router = useRouter()

  useEffect(() => {
    // Automatically redirect to login after 3 seconds
    const timer = setTimeout(() => {
      router.push('/login')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50 p-4">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-6">
          <i className="fa-solid fa-heart-pulse text-3xl text-indigo-600"></i>
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            CampusVotes
          </span>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800">Verification Complete</h1>
        <p className="text-gray-600">
          Your email has been verified. Redirecting you to login...
        </p>
        
        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  )
} 