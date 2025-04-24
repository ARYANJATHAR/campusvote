import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const type = requestUrl.searchParams.get('type') // Get the type of auth callback

  if (code) {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    // Always redirect to login after email verification
    if (type === 'signup' || type === 'recovery') {
      // If verification was successful, add verified=true parameter
      if (!error) {
        return NextResponse.redirect(`${requestUrl.origin}/login?verified=true`)
      }
      // If verification failed but the user is already verified (common case)
      // still redirect to login with verified=true
      if (error?.message?.includes('User already confirmed')) {
        return NextResponse.redirect(`${requestUrl.origin}/login?verified=true`)
      }
      // For other errors, redirect to login without verified parameter
      return NextResponse.redirect(`${requestUrl.origin}/login`)
    }
    
    // For other cases (login, invite, etc), redirect to the next page if successful
    if (!error && data?.session) {
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }

  // For any other errors, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
} 