'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const router = useRouter()
  const path = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setLoggedIn(true)
      } else if (path !== '/login') {
        router.replace('/login')
      }
      setChecking(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setLoggedIn(true)
        if (path === '/login') router.replace('/')
      } else {
        setLoggedIn(false)
        if (path !== '/login') router.replace('/login')
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [path])

  if (checking) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: '#fff8f8'
    }}>
      <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '24px', color: '#bc004b'}}>乐译</p>
    </div>
  )

  if (!loggedIn && path !== '/login') return null

  return <>{children}</>
}
