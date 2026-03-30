'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const path = usePathname()

  const tabs = [
    { href: '/', icon: 'search', label: 'Search' },
    { href: '/lyrics', icon: 'auto_stories', label: 'Lyrics' },
    { href: '/archive', icon: 'inventory_2', label: 'Archive' },
    { href: '/settings', icon: 'settings', label: 'Settings' },
  ]

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, width: '100%',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '12px 16px 24px',
      backgroundColor: 'rgba(255,248,248,0.85)',
      backdropFilter: 'blur(20px)',
      borderRadius: '2rem 2rem 0 0',
      boxShadow: '0px -12px 32px rgba(188,0,75,0.06)',
      zIndex: 50
    }}>
      {tabs.map(tab => {
        const active = path === tab.href
        return (
          <Link key={tab.href} href={tab.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 16px',
            borderRadius: '9999px',
            backgroundColor: active ? '#f4dce4' : 'transparent',
            color: active ? '#bc004b' : '#4d4447',
            textDecoration: 'none',
            transition: 'all 0.2s'
          }}>
            <span className="material-symbols-outlined" style={{
              fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
              fontSize: '24px'
            }}>{tab.icon}</span>
            <span style={{
              fontFamily: 'Work Sans, sans-serif',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: '4px',
              fontWeight: active ? 600 : 400
            }}>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
