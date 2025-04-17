'use client'

import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase-client"

export default function VerifyPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email_confirmed_at) {
        // If email is already confirmed, redirect to login
        router.push('/login')
      }
    }
    checkSession()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl bg-white/95 backdrop-blur-sm">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <i className="fa-solid fa-heart-pulse text-3xl text-indigo-600"></i>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              CampusVotes
            </span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800">Check Your Email</h1>
          
          <div className="space-y-4 text-gray-600">
            <p>
              We've sent you a confirmation email. Please check your inbox and click the verification link to complete your registration.
            </p>
            
            <p className="text-sm">
              If you don't see the email, check your spam folder. The email should arrive within a few minutes.
            </p>
          </div>

          <div className="pt-6 border-t border-gray-100 mt-6">
            <p className="text-sm text-gray-500">
              Already confirmed?{" "}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
} 