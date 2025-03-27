import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/vote']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Define auth routes (login, signup)
  const authRoutes = ['/login', '/signup', '/register']
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect logic
  if (isProtectedRoute && !session) {
    // Redirect to login if trying to access protected route without session
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && session) {
    // Redirect to dashboard if trying to access auth routes with active session
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/vote/:path*',
    '/login/:path*',
    '/signup/:path*',
    '/register/:path*',
  ],
} 