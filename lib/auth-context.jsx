import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// createBrowserClient stores the PKCE code verifier in cookies, not localStorage.
// Cookies survive the full-page redirect through Google OAuth and back.
let _client = null
function getClient() {
  if (!_client && typeof window !== 'undefined') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return null
    _client = createBrowserClient(url, key)
  }
  return _client
}

const AuthContext = createContext({ user: null, session: null, supabase: null })

export function AuthProvider({ children }) {
  const [supabase] = useState(() => {
    if (typeof window === 'undefined') return null
    return getClient()
  })
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, session, supabase }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function useUser() {
  return useContext(AuthContext).user
}

export function useSupabaseClient() {
  return useContext(AuthContext).supabase
}
