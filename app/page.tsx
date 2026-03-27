import { supabase } from '../lib/supabase''use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type LyricResult = {
  title: string
  artist: string
  simplified: string[]
  pinyin: string[]
  english: string[]
}

type HistoryItem = {
  key: string
  title: string
  artist: string
}

type SearchResult = {
  id: number
  title: string
  artist: string
  album: string
  hasLyrics: boolean
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<LyricResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cached, setCached] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualLyrics, setManualLyrics] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [view, setView] = useState<'search' | 'history'>('search')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loadingLyrics, setLoadingLyrics] = useState(false)

  useEffect(() => { loadHistory() }, [])

  async function loadHistory() {
    try {
      const { data } = await supabase.from('songs').select('cache_key, data').order('updated_at', { ascending: false });
      if (data && data.length > 0) {
        const items = data.map((row) => {
          const parsed = JSON.parse(row.data);
          localStorage.setItem(row.cache_key, row.data);
          return { key: row.cache_key, title: parsed.title || row.cache_key, artist: parsed.artist || '' };
        });
        setHistory(items);
        return;
      }
    } catch {}
    // fallback to localStorage
    
    const items: HistoryItem[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('lyric_')) {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        items.push({ key, title: data.title || key, artist: data.artist || '' })
      }
    }
    setHistory(items.reverse())
  }

  function deleteFromHistory(key: string) {
    localStorage.removeItem(key)
    loadHistory()
  }

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setCached(false)
    setShowManual(false)
    setShowResults(false)
    setView('search')

    const cacheKey = `lyric_${query.trim().toLowerCase()}`
    // Check Supabase cloud first
    const { data: cloudData } = await supabase.from('songs').select('data').eq('cache_key', cacheKey).single();
    if (cloudData) {
      const parsed = JSON.parse(cloudData.data);
      setResult(parsed);
      localStorage.setItem(cacheKey, cloudData.data);
      setCached(true);
      setLoading(false);
      return;
    }
    const stored = localStorage.getItem(cacheKey)
    if (stored) {
      setResult(JSON.parse(stored))
      setCached(true)
      setLoading(false)
      return
    }

    const res = await fetch(`/api/lyrics?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    if (res.ok) {
      setResult(data)
      localStorage.setItem(cacheKey, JSON.stringify(data));
      await supabase.from('songs').upsert({ cache_key: cacheKey, data: JSON.stringify(data), updated_at: new Date().toISOString() }, { onConflict: 'cache_key' })
      loadHistory()
      const sRes = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const sData = await sRes.json()
      setSearchResults(sData.results || [])
    } else {
      setError(data.error || 'Song not found.')
      const sRes = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const sData = await sRes.json()
      if (sData.results && sData.results.length > 0) {
        setSearchResults(sData.results)
        setShowResults(true)
        setError('Could not load lyrics automatically. Pick from results or add manually.')
      } else {
        setShowManual(true)
      }
    }
    setLoading(false)
  }

  async function loadFromSearchResult(track: SearchResult) {
    setLoadingLyrics(true)
    setShowResults(false)
    setError('')
    const res = await fetch(`/api/lyrics?q=${encodeURIComponent(track.title + ' ' + track.artist)}`)
    const data = await res.json()
    if (res.ok) {
      const finalResult = { ...data, title: track.title, artist: track.artist }
      setResult(finalResult)
      const cacheKey = `lyric_${query.trim().toLowerCase()}`
      localStorage.setItem(cacheKey, JSON.stringify(finalResult))
      loadHistory()
    } else {
      setError('Could not load lyrics for this track.')
      setShowManual(true)
    }
    setLoadingLyrics(false)
  }

  async function submitManual() {
    if (!manualLyrics.trim() || !query.trim()) return
    setManualLoading(true)
    setError('')
    const res = await fetch(`/api/lyrics?q=${encodeURIComponent(manualLyrics)}&manual=true`)
    const data = await res.json()
    if (res.ok) {
      const finalResult = { ...data, title: query, artist: 'Manual Entry' }
      setResult(finalResult)
      const cacheKey = `lyric_${query.trim().toLowerCase()}`
      localStorage.setItem(cacheKey, JSON.stringify(finalResult))
      loadHistory()
      setShowManual(false)
      setManualLyrics('')
    } else {
      setError('Could not process lyrics. Try again.')
    }
    setManualLoading(false)
  }

  function loadFromHistory(item: HistoryItem) {
    const data = JSON.parse(localStorage.getItem(item.key) || '{}')
    setResult(data)
    setQuery(data.title)
    setCached(true)
    setView('search')
    setError('')
    setShowManual(false)
    setShowResults(false)
  }

  return (
    <main className="min-h-screen text-gray-700" style={{background: '#fce8e8'}}>
      {/* Header layers */}



      <div style={{background: '#fff', padding: '16px 24px 12px'}}>
        <h1 style={{color: '#b06070', fontSize: '22px', fontWeight: 700}}>Lyric Translator</h1>
        <p style={{color: '#b0a0a0', fontSize: '13px'}}>Simplified Chinese · Pinyin · English</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-5 pb-20">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setView('search')} style={{background: view === 'search' ? '#d47a8a' : '#fff', color: view === 'search' ? '#fff' : '#b0a0a0', border: '1px solid #e8c0c8'}} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors">Search</button>
          <button onClick={() => { setView('history'); loadHistory() }} style={{background: view === 'history' ? '#d47a8a' : '#fff', color: view === 'history' ? '#fff' : '#b0a0a0', border: '1px solid #e8c0c8'}} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors">Saved ({history.length})</button>
        </div>

        {view === 'history' && (
          <div className="space-y-2">
            {history.length === 0 && <p style={{color: '#b0a0a0'}} className="text-sm">No saved songs yet.</p>}
            {history.map(item => (
              <div key={item.key} className="flex items-center justify-between rounded-xl px-4 py-3" style={{background: '#fff', border: '1px solid #f0d8d8'}}>
                <button className="text-left flex-1" onClick={() => loadFromHistory(item)}>
                  <p className="font-medium" style={{color: '#5a3a3a'}}>{item.title}</p>
                  <p className="text-sm" style={{color: '#b0a0a0'}}>{item.artist}</p>
                </button>
                <button onClick={() => deleteFromHistory(item.key)} className="ml-4 text-lg" style={{color: '#d0c0c0'}}>✕</button>
              </div>
            ))}
          </div>
        )}

        {view === 'search' && (
          <>
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 rounded-lg px-4 py-3 focus:outline-none"
                style={{background: '#fff', border: '1px solid #e8c0c8', color: '#5a3a3a'}}
                placeholder="e.g. 玉兰花 Ryan B or 还在流浪"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
              />
              <button onClick={search} disabled={loading} className="px-6 py-3 rounded-lg font-semibold transition-colors" style={{background: '#d47a8a', color: '#fff'}}>
                {loading ? '...' : 'Search'}
              </button>
            </div>

            {loading && (
              <div className="text-center mt-20" style={{color: '#b0a0a0'}}>
                <p className="text-4xl mb-4">🎵</p>
                <p>Fetching lyrics...</p>
                <p className="text-xs mt-2" style={{color: '#d0c0c0'}}>First time takes ~20s. Saved after this.</p>
              </div>
            )}

            {loadingLyrics && <div className="text-center mt-10" style={{color: '#b0a0a0'}}><p>Loading selected track...</p></div>}

            {error && (
              <div className="rounded-xl p-4 mb-4" style={{background: '#fff', border: '1px solid #f0c0c0'}}>
                <p className="text-sm" style={{color: '#c07070'}}>{error}</p>
              </div>
            )}

            {showResults && searchResults.length > 0 && (
              <div className="mb-6">
                <p className="text-sm mb-3" style={{color: '#b0a0a0'}}>Pick a result:</p>
                <div className="space-y-2">
                  {searchResults.map(track => (
                    <button key={track.id} onClick={() => loadFromSearchResult(track)} className="w-full text-left rounded-xl px-4 py-3 transition-colors" style={{background: '#fff', border: '1px solid #f0d8d8'}}>
                      <p className="font-medium" style={{color: '#5a3a3a'}}>{track.title}</p>
                      <p className="text-sm" style={{color: '#b0a0a0'}}>{track.artist}{track.album ? ` · ${track.album}` : ''}</p>
                      {!track.hasLyrics && <p className="text-xs mt-1" style={{color: '#d0c0c0'}}>No lyrics available</p>}
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowResults(false); setShowManual(true) }} className="mt-3 text-sm underline" style={{color: '#b0a0a0'}}>None of these? Add manually</button>
              </div>
            )}

            {showManual && (
              <div className="rounded-xl p-5 mb-6" style={{background: '#fff', border: '1px solid #d47a8a'}}>
                <p className="font-semibold mb-1" style={{color: '#5a3a3a'}}>Add lyrics manually</p>
                <p className="text-sm mb-4" style={{color: '#b0a0a0'}}>Paste the Chinese lyrics below.</p>
                <textarea
                  className="w-full rounded-lg px-4 py-3 h-48 resize-none focus:outline-none"
                  style={{background: '#fce8e8', border: '1px solid #e8c0c8', color: '#5a3a3a'}}
                  placeholder="Paste lyrics here, one line per line..."
                  value={manualLyrics}
                  onChange={e => setManualLyrics(e.target.value)}
                />
                <button onClick={submitManual} disabled={manualLoading || !manualLyrics.trim()} className="mt-3 w-full py-3 rounded-lg font-semibold transition-colors" style={{background: '#d47a8a', color: '#fff'}}>
                  {manualLoading ? 'Processing...' : 'Generate & Save'}
                </button>
              </div>
            )}

            {result && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-lg" style={{color: '#5a3a3a'}}>{result.title}</p>
                    <p className="text-sm" style={{color: '#b0a0a0'}}>{result.artist}</p>
                  </div>
                  {cached && <span className="text-xs px-3 py-1 rounded-full" style={{background: '#fce8e8', color: '#d47a8a'}}>⚡ Cached</span>}
                </div>
                {searchResults.length > 1 && (
                  <button onClick={() => setShowResults(!showResults)} className="text-xs underline mb-4 block" style={{color: '#c0a0a0'}}>Wrong song?</button>
                )}
                <div className="space-y-4 mt-4">
                  {result.simplified.map((line, i) => (
                    <div key={i} className="pl-4" style={{borderLeft: '2px solid #d47a8a'}}>
                      <p className="text-lg font-medium" style={{color: '#5a3a3a'}}>{line}</p>
                      <p className="text-sm mt-1" style={{color: '#c07a8a'}}>{result.pinyin[i]}</p>
                      <p className="text-sm mt-1 italic" style={{color: '#b0a0a0'}}>{result.english[i] || ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
