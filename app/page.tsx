'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function saveToCloud(cacheKey: string, data: object) {
    const json = JSON.stringify(data)
    localStorage.setItem(cacheKey, json)
    localStorage.setItem('current_song', json)
    try {
      await supabase.from('songs').upsert({
        cache_key: cacheKey,
        data: json,
        updated_at: new Date().toISOString()
      }, { onConflict: 'cache_key' })
    } catch {}
  }

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    const cacheKey = 'lyric_' + query.trim().toLowerCase()

    // Check localStorage
    const stored = localStorage.getItem(cacheKey)
    if (stored) {
      localStorage.setItem('current_song', stored)
      router.push('/lyrics')
      return
    }

    // Check Supabase
    try {
      const { data: cloudData } = await supabase
        .from('songs')
        .select('data')
        .eq('cache_key', cacheKey)
        .single()
      if (cloudData) {
        localStorage.setItem(cacheKey, cloudData.data)
        localStorage.setItem('current_song', cloudData.data)
        router.push('/lyrics')
        return
      }
    } catch {}

    // Fetch from API
    const res = await fetch('/api/lyrics?q=' + encodeURIComponent(query))
    const data = await res.json()
    if (res.ok) {
      await saveToCloud(cacheKey, data)
      router.push('/lyrics')
    } else {
      setError(data.error || 'Song not found')
      setLoading(false)
    }
  }

  return (
    <main style={{paddingBottom: '120px', maxWidth: '800px', margin: '0 auto'}}>
      <header style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        backgroundColor: '#fff8f8',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <span className="material-symbols-outlined" style={{color: '#bc004b'}}>menu</span>
          <h1 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '24px', color: '#bc004b', margin: 0}}>The Archivist's Folio</h1>
        </div>
        <span className="material-symbols-outlined" style={{color: '#bc004b'}}>account_circle</span>
      </header>

      <section style={{padding: '96px 24px 48px'}}>
        <h2 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '42px', marginBottom: '8px', marginTop: '32px'}}>Unveil the Resonance</h2>
        <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#4d4447'}}>Explore Chinese lyrics with scholarly translations</p>
      </section>

      <section style={{padding: '0 24px', marginBottom: '32px'}}>
        <div style={{position: 'relative', marginBottom: '16px'}}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
            color: '#bc004b'
          }}>search</span>
          <input
            style={{
              width: '100%', backgroundColor: '#fff0f4', border: 'none',
              borderRadius: '12px', padding: '20px 20px 20px 52px',
              fontSize: '18px', fontFamily: 'Newsreader, serif',
              outline: 'none', boxSizing: 'border-box'
            }}
            placeholder="Search by song title or artist..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
        </div>
        {error && (
          <div style={{
            backgroundColor: '#ffdad6', borderRadius: '8px', padding: '12px 16px',
            marginBottom: '12px', fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: '#93000a'
          }}>{error}</div>
        )}
        <button
          onClick={search}
          disabled={loading}
          style={{
            width: '100%', backgroundColor: loading ? '#d0c3c7' : '#bc004b',
            color: '#fff', border: 'none', borderRadius: '12px',
            padding: '16px', fontSize: '14px',
            fontFamily: 'Work Sans, sans-serif', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer'
          }}
        >
          {loading ? 'Searching... (~5s)' : 'Search Lyrics'}
        </button>
      </section>

      <section style={{padding: '0 24px'}}>
        <div style={{backgroundColor: '#fff0f4', borderRadius: '16px', padding: '32px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
            <span className="material-symbols-outlined" style={{color: '#b90c55'}}>edit_note</span>
            <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '20px', margin: 0}}>Add Lyrics Manually</h3>
          </div>
          <p style={{color: '#4d4447', marginBottom: '20px', lineHeight: 1.6, fontFamily: 'Newsreader, serif'}}>
            Can't find a song? Paste the lyrics directly.
          </p>
          <ManualEntry onDone={() => router.push('/lyrics')} saveToCloud={saveToCloud} />
        </div>
      </section>
    </main>
  )
}

function ManualEntry({ onDone, saveToCloud }: { onDone: () => void, saveToCloud: (key: string, data: object) => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!lyrics.trim() || !title.trim()) return
    setLoading(true)
    const res = await fetch('/api/lyrics?q=' + encodeURIComponent(lyrics) + '&manual=true')
    const data = await res.json()
    if (res.ok) {
      const finalResult = { ...data, title, artist: 'Manual Entry' }
      const cacheKey = 'lyric_' + title.trim().toLowerCase()
      await saveToCloud(cacheKey, finalResult)
      onDone()
    } else {
      alert('Could not process lyrics')
    }
    setLoading(false)
  }

  return (
    <div>
      <input
        style={{
          width: '100%', backgroundColor: '#fff', border: '1px solid #d0c3c7',
          borderRadius: '8px', padding: '12px 16px', marginBottom: '12px',
          fontFamily: 'Newsreader, serif', fontSize: '16px', boxSizing: 'border-box'
        }}
        placeholder="Song title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <textarea
        style={{
          width: '100%', backgroundColor: '#fff', border: '1px solid #d0c3c7',
          borderRadius: '8px', padding: '12px 16px', marginBottom: '12px',
          fontFamily: 'Newsreader, serif', fontSize: '16px',
          height: '160px', resize: 'none', boxSizing: 'border-box'
        }}
        placeholder="Paste Chinese lyrics here, one line per line..."
        value={lyrics}
        onChange={e => setLyrics(e.target.value)}
      />
      <button
        onClick={submit}
        disabled={loading || !lyrics.trim() || !title.trim()}
        style={{
          width: '100%', backgroundColor: loading ? '#d0c3c7' : '#bc004b',
          color: '#fff', border: 'none', borderRadius: '8px',
          padding: '14px', fontFamily: 'Work Sans, sans-serif',
          fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', cursor: 'pointer'
        }}
      >
        {loading ? 'Processing...' : 'Generate & Save'}
      </button>
    </div>
  )
}
