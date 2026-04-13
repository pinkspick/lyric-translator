'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type HistoryItem = {
  key: string
  title: string
  artist: string
}

export default function ArchivePage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { loadHistory() }, [])

  async function loadHistory() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('songs')
        .select('cache_key, data')
        .order('updated_at', { ascending: false })

      if (data && data.length > 0) {
        const items = data.map((row: any) => {
          const parsed = JSON.parse(row.data)
          localStorage.setItem(row.cache_key, row.data)
          return { key: row.cache_key, title: parsed.title || row.cache_key, artist: parsed.artist || '' }
        })
        setHistory(items)
      } else {
        const items: HistoryItem[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('lyric_')) {
            const d = JSON.parse(localStorage.getItem(key) || '{}')
            items.push({ key, title: d.title || key, artist: d.artist || '' })
          }
        }
        setHistory(items.reverse())
      }
    } catch {
      setHistory([])
    }
    setLoading(false)
  }

  function openSong(item: HistoryItem) {
    const data = localStorage.getItem(item.key)
    if (data) {
      localStorage.setItem('current_song', data)
      router.push('/lyrics')
    }
  }

  async function deleteSong(key: string) {
    localStorage.removeItem(key)
    await supabase.from('songs').delete().eq('cache_key', key)
    loadHistory()
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
          <h1 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px', color: '#bc004b', margin: 0}}>The Archivist's Folio</h1>
        </div>
        <span className="material-symbols-outlined" style={{color: '#bc004b'}}>account_circle</span>
      </header>

      <section style={{padding: '96px 24px 32px'}}>
        <span style={{fontFamily: 'Work Sans, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#4d4447', display: 'block', marginBottom: '8px'}}>Personal Anthology</span>
        <h2 style={{fontFamily: 'Newsreader, serif', fontSize: '48px', fontWeight: 700, lineHeight: 1.1, marginBottom: '8px'}}>Your Archive</h2>
        <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '18px', color: '#4d4447'}}>{history.length} 首歌曲已保存</p>
      </section>

      <section style={{padding: '0 24px'}}>
        {loading && <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', color: '#4d4447'}}>Loading your collection...</p>}

        {!loading && history.length === 0 && (
          <div style={{textAlign: 'center', padding: '48px 0'}}>
            <span className="material-symbols-outlined" style={{fontSize: '64px', color: '#d0c3c7', display: 'block', marginBottom: '16px'}}>auto_stories</span>
            <p style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '20px', color: '#4d4447'}}>Your archive is empty.</p>
            <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '13px', color: '#7f7478', marginTop: '8px'}}>Search for a song to begin your collection.</p>
            <button onClick={() => router.push('/')} style={{
              marginTop: '24px', backgroundColor: '#bc004b', color: '#fff',
              border: 'none', borderRadius: '8px', padding: '12px 24px',
              fontFamily: 'Work Sans, sans-serif', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em'
            }}>Search Songs</button>
          </div>
        )}

        <div style={{display: 'grid', gap: '16px'}}>
          {history.map((item, i) => (
            <div key={item.key} style={{
              backgroundColor: '#fff0f4',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fae2ea')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff0f4')}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: '20px', flex: 1}} onClick={() => openSong(item)}>
                <span style={{
                  fontFamily: 'Newsreader, serif', fontStyle: 'italic',
                  fontSize: '20px', color: '#d0c3c7', fontWeight: 700,
                  minWidth: '32px'
                }}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p style={{fontFamily: 'Newsreader, serif', fontSize: '20px', fontWeight: 700, margin: 0}}>{item.title}</p>
                  <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7f7478', margin: '4px 0 0'}}>{item.artist}</p>
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <button onClick={() => openSong(item)} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                  <span className="material-symbols-outlined" style={{color: '#bc004b'}}>chevron_right</span>
                </button>
                <button onClick={() => deleteSong(item.key)} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                  <span className="material-symbols-outlined" style={{color: '#d0c3c7', fontSize: '20px'}}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
