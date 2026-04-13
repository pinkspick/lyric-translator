import type { Metadata } from 'next'
import './globals.css'
import BottomNav from './components/BottomNav'
import AuthWrapper from './components/AuthWrapper'

export const metadata: Metadata = {
  title: '乐译',
  description: '汉字 · 拼音 · 英文翻译',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#bc004b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="乐译" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Work+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body style={{backgroundColor: '#fff8f8', color: '#25181e', fontFamily: 'Newsreader, serif', margin: 0}}>
        <AuthWrapper>
          {children}
          <BottomNav />
        </AuthWrapper>
      </body>
    </html>
  )
}
