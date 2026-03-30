'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type LyricResult = {
  title: string
  artist: string
  simplified: string[]
  pinyin: string[]
  english: string[]
}

export default function LyricsPage() {
  const [song, setSong] = useState<LyricResult | null>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('current_song')
    if (stored) setSong(JSON.parse(stored))
  }, [])

  async function saveSong() {
    if (!song) return
    const cacheKey = 'lyric_' + song.title.trim().toLowerCase()
    const json = JSON.stringify(song)
    localStorage.setItem(cacheKey, json)
    await supabase.from('songs').upsert({
      cache_key: cacheKey,
      data: json,
      updated_at: new Date().toISOString()
    }, { onConflict: 'cache_key' })
    alert('Saved to your archive!')
  }

  if (!song) return (
    <main style={{paddingTop: '120px', textAlign: 'center', color: '#4d4447'}}>
      <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px'}}>No song loaded.</p>
      <button onClick={() => router.push('/')} style={{
        marginTop: '16px', backgroundColor: '#bc004b', color: '#fff',
        border: 'none', borderRadius: '8px', padding: '12px 24px',
        fontFamily: 'Work Sans, sans-serif', cursor: 'pointer'
      }}>Search a Song</button>
    </main>
  )

  return (
    <main style={{paddingBottom: '120px', maxWidth: '800px', margin: '0 auto'}}>
      <header style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        backgroundColor: '#fff8f8',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <button onClick={() => router.push('/')} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
            <span className="material-symbols-outlined" style={{color: '#bc004b'}}>arrow_back</span>
          </button>
          <h1 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px', color: '#bc004b', margin: 0}}>The Archivist's Folio</h1>
        </div>
        <button onClick={saveSong} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
          <span className="material-symbols-outlined" style={{color: '#bc004b'}}>bookmark_add</span>
        </button>
      </header>

      <section style={{padding: '96px 24px 32px'}}>
        <span style={{fontFamily: 'Work Sans, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#b90c55', display: 'block', marginBottom: '8px'}}>Now Reading</span>
        <h2 style={{fontFamily: 'Newsreader, serif', fontSize: '48px', fontWeight: 700, lineHeight: 1.1, marginBottom: '12px'}}>{song.title}</h2>
        <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '22px', color: '#ab2c5d'}}>{song.artist}</p>
      </section>

      <section style={{padding: '0 24px'}}>
        {song.simplified.map((line, i) => (
          <div key={i} style={{
            marginBottom: '40px',
            paddingLeft: '24px',
            borderLeft: '2px solid transparent',
            transition: 'border-color 0.2s'
          }}
          onMouseEnter={e => (e.currentTarget.style.borderLeftColor = '#bc004b')}
          onMouseLeave={e => (e.currentTarget.style.borderLeftColor = 'transparent')}
          >
            <p style={{
              fontFamily: 'Newsreader, serif', fontSize: '28px',
              fontWeight: 700, color: '#25181e', marginBottom: '8px'
            }}>{line}</p>
            <p style={{
              fontFamily: 'Work Sans, sans-serif', fontSize: '13px',
              color: '#bc004b', letterSpacing: '0.05em', marginBottom: '8px',
              fontStyle: 'italic'
            }}>{song.pinyin[i]}</p>
            <p style={{
              fontFamily: 'Newsreader, serif', fontSize: '17px',
              color: '#4d4447', fontStyle: 'italic', lineHeight: 1.5
            }}>{song.english[i] || ''}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
