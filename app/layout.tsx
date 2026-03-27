import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lyric Translator',
  description: 'Simplified Chinese · Pinyin · English',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-pink-50">{children}</body>
    </html>
  )
}
