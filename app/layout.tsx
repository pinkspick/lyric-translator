import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lyric Translator',
  description: 'Simplified Chinese · Pinyin · English',
  manifest: '/manifest.json',
  themeColor: '#d47a8a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#d47a8a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lyrics" />
      </head>
      <body style={{margin: 0, padding: 0}}>{children}</body>
    </html>
  )
}
