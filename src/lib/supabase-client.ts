import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required!')
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          try {
            return document.cookie
              .split('; ')
              .find((row) => row.startsWith(`${name}=`))
              ?.split('=')[1]
          } catch (error) {
            return undefined
          }
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; secure?: boolean }) {
          try {
            let cookie = `${name}=${value}`
            if (options.path) cookie += `; path=${options.path}`
            if (options.maxAge) cookie += `; max-age=${options.maxAge}`
            if (options.domain) cookie += `; domain=${options.domain}`
            if (options.secure) cookie += '; secure'
            document.cookie = cookie
          } catch (error) {
            // Silently handle error
          }
        },
        remove(name: string, options: { path?: string }) {
          try {
            document.cookie = `${name}=; max-age=0${options.path ? `; path=${options.path}` : ''}`
          } catch (error) {
            // Silently handle error
          }
        }
      }
    }
  )
} 