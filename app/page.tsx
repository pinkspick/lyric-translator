'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showManual, setShowManual] = useState(false)
  const router = useRouter()

  async function saveToCloud(cacheKey: string, data: object) {
    const json = JSON.stringify(data)
    localStorage.setItem(cacheKey, json)
    localStorage.setItem('current_song', json)
    try {
      await supabase.from('songs').upsert({
        cache_key: cacheKey, data: json, updated_at: new Date().toISOString()
      }, { onConflict: 'cache_key' })
    } catch {}
  }

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    const cacheKey = 'lyric_' + query.trim().toLowerCase()

    const stored = localStorage.getItem(cacheKey)
    if (stored) {
      localStorage.setItem('current_song', stored)
      router.push('/lyrics')
      return
    }

    try {
      const { data: cloudData } = await supabase
        .from('songs').select('data').eq('cache_key', cacheKey).single()
      if (cloudData) {
        localStorage.setItem(cacheKey, cloudData.data)
        localStorage.setItem('current_song', cloudData.data)
        router.push('/lyrics')
        return
      }
    } catch {}

    const res = await fetch('/api/lyrics?q=' + encodeURIComponent(query))
    const data = await res.json()
    if (res.ok) {
      await saveToCloud(cacheKey, data)
      router.push('/lyrics')
    } else {
      setError(data.error || '未找到歌曲，请尝试添加歌手名称')
      setShowManual(true)
      setLoading(false)
    }
  }

  return (
    <main style={{paddingBottom: '120px', maxWidth: '800px', margin: '0 auto'}}>
      <header style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        backgroundColor: '#fff8f8', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', padding: '16px 24px'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <span className="material-symbols-outlined" style={{color: '#bc004b'}}>menu</span>
          <h1 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '24px', color: '#bc004b', margin: 0}}>乐译</h1>
        </div>
        <span className="material-symbols-outlined" style={{color: '#bc004b'}}>account_circle</span>
      </header>

      <section style={{padding: '96px 24px 32px'}}>
        <h2 style={{fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: '42px', marginBottom: '8px', marginTop: '16px'}}>探索歌词</h2>
        <p style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#4d4447'}}>汉字 · 拼音 · 英文翻译</p>
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
            placeholder="搜索歌曲或歌手..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
        </div>

        {error && (
          <div style={{
            backgroundColor: '#ffdad6', borderRadius: '8px', padding: '12px 16px',
            marginBottom: '12px', fontFamily: 'Work Sans, sans-serif',
            fontSize: '13px', color: '#93000a'
          }}>{error}</div>
        )}

        <button onClick={search} disabled={loading} style={{
          width: '100%', backgroundColor: loading ? '#d0c3c7' : '#bc004b',
          color: '#fff', border: 'none', borderRadius: '12px', padding: '16px',
          fontSize: '14px', fontFamily: 'Work Sans, sans-serif', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer'
        }}>
          {loading ? '搜索中... (~10秒)' : '搜索'}
        </button>
      </section>

      {showManual && (
        <section style={{padding: '0 24px', marginBottom: '32px'}}>
          <div style={{backgroundColor: '#fff0f4', borderRadius: '16px', padding: '32px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
              <span className="material-symbols-outlined" style={{color: '#b90c55'}}>edit_note</span>
              <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '20px', margin: 0}}>手动添加歌词</h3>
            </div>
            <p style={{color: '#4d4447', marginBottom: '20px', lineHeight: 1.6, fontFamily: 'Newsreader, serif'}}>
              找不到歌曲？直接粘贴歌词。
            </p>
            <ManualEntry onDone={() => router.push('/lyrics')} saveToCloud={saveToCloud} query={query} />
          </div>
        </section>
      )}

      <section style={{padding: '0 24px'}}>
        <div style={{backgroundColor: '#fff0f4', borderRadius: '16px', padding: '24px'}}>
          <h3 style={{fontFamily: 'Newsreader, serif', fontSize: '18px', marginBottom: '12px', color: '#bc004b'}}>声调颜色说明</h3>
          <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
            {[
              {tone: '第一声', ex: 'ā', color: '#e53935'},
              {tone: '第二声', ex: 'á', color: '#fb8c00'},
              {tone: '第三声', ex: 'ǎ', color: '#f9a825'},
              {tone: '第四声', ex: 'à', color: '#1e88e5'},
              {tone: '轻声', ex: 'a', color: '#c07a8a'},
            ].map(t => (
              <div key={t.tone} style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                <span style={{
                  width: '12px', height: '12px', borderRadius: '50%',
                  backgroundColor: t.color, display: 'inline-block'
                }} />
                <span style={{fontFamily: 'Work Sans, sans-serif', fontSize: '12px', color: '#4d4447'}}>{t.tone} </span>
                <span style={{fontFamily: 'Work Sans, sans-serif', fontSize: '14px', color: t.color, fontWeight: 600}}>{t.ex}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function ManualEntry({ onDone, saveToCloud, query }: {
  onDone: () => void
  saveToCloud: (key: string, data: object) => Promise<void>
  query: string
}) {
  const [title, setTitle] = useState(query)
  const [lyrics, setLyrics] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!lyrics.trim() || !title.trim()) return
    setLoading(true)
    const res = await fetch('/api/lyrics?q=' + encodeURIComponent(lyrics) + '&manual=true')
    const data = await res.json()
    if (res.ok) {
      const finalResult = { ...data, title, artist: '手动添加' }
      const cacheKey = 'lyric_' + title.trim().toLowerCase()
      await saveToCloud(cacheKey, finalResult)
      onDone()
    } else {
      alert('无法处理歌词，请重试')
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
        placeholder="歌曲名称..."
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
        placeholder="粘贴中文歌词，每行一句..."
        value={lyrics}
        onChange={e => setLyrics(e.target.value)}
      />
      <button onClick={submit} disabled={loading || !lyrics.trim() || !title.trim()} style={{
        width: '100%', backgroundColor: loading ? '#d0c3c7' : '#bc004b',
        color: '#fff', border: 'none', borderRadius: '8px', padding: '14px',
        fontFamily: 'Work Sans, sans-serif', fontSize: '13px', fontWeight: 600,
        letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer'
      }}>
        {loading ? '处理中...' : '生成并保存'}
      </button>
    </div>
  )
}
