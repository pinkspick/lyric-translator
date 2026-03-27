'use client'
import { useState, useEffect } from 'react'

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

  function loadHistory() {
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
      localStorage.setItem(cacheKey, JSON.stringify(data))
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
    <main className="min-h-screen bg-pink-50 text-gray-800 max-w-2xl mx-auto pb-20">
      
      

      <div className="flex gap-2 mb-4">
        <button onClick={() => setView('search')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'search' ? 'bg-pink-500 text-white' : 'bg-white text-gray-400 border border-pink-200'}`}>Search</button>
        <button onClick={() => { setView('history'); loadHistory() }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'history' ? 'bg-pink-500 text-white' : 'bg-white text-gray-400 border border-pink-200'}`}>Saved ({history.length})</button>
      </div>

      {view === 'history' && (
        <div className="space-y-2">
          {history.length === 0 && <p className="text-gray-400 text-sm">No saved songs yet.</p>}
          {history.map(item => (
            <div key={item.key} className="flex items-center justify-between bg-white border border-pink-100 rounded-xl px-4 py-3 shadow-sm">
              <button className="text-left flex-1" onClick={() => loadFromHistory(item)}>
                <p className="text-gray-800 font-medium">{item.title}</p>
                <p className="text-gray-400 text-sm">{item.artist}</p>
              </button>
              <button onClick={() => deleteFromHistory(item.key)} className="text-gray-300 hover:text-red-400 ml-4 text-lg">✕</button>
            </div>
          ))}
        </div>
      )}

      {view === 'search' && (
        <>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 bg-white border border-pink-200 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-pink-400 shadow-sm"
              placeholder="e.g. 玉兰花 Ryan B or 还在流浪"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
            />
            <button onClick={search} className="bg-pink-500 hover:bg-pink-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-sm" disabled={loading}>
              {loading ? '...' : 'Search'}
            </button>
          </div>

          {loading && (
            <div className="text-center text-gray-400 mt-20">
              <p className="text-4xl mb-4">🎵</p>
              <p>Fetching lyrics...</p>
              <p className="text-xs mt-2 text-gray-300">First time takes ~20s. Saved after this.</p>
            </div>
          )}

          {loadingLyrics && (
            <div className="text-center text-gray-400 mt-10">
              <p>Loading selected track...</p>
            </div>
          )}

          {error && (
            <div className="bg-white border border-red-200 rounded-xl p-4 mb-4 shadow-sm">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {showResults && searchResults.length > 0 && (
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-3">Pick a result:</p>
              <div className="space-y-2">
                {searchResults.map(track => (
                  <button key={track.id} onClick={() => loadFromSearchResult(track)} className="w-full text-left bg-white border border-pink-100 hover:border-pink-400 rounded-xl px-4 py-3 transition-colors shadow-sm">
                    <p className="text-gray-800 font-medium">{track.title}</p>
                    <p className="text-gray-400 text-sm">{track.artist} {track.album ? `· ${track.album}` : ''}</p>
                    {!track.hasLyrics && <p className="text-gray-300 text-xs mt-1">No lyrics available</p>}
                  </button>
                ))}
              </div>
              <button onClick={() => { setShowResults(false); setShowManual(true) }} className="mt-3 text-gray-400 text-sm underline">None of these? Add manually</button>
            </div>
          )}

          {showManual && (
            <div className="bg-white border border-pink-300 rounded-xl p-5 mb-6 shadow-sm">
              <p className="text-gray-800 font-semibold mb-1">Add lyrics manually</p>
              <p className="text-gray-400 text-sm mb-4">Paste the Chinese lyrics below.</p>
              <textarea
                className="w-full bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-pink-400 h-48 resize-none"
                placeholder="Paste lyrics here, one line per line..."
                value={manualLyrics}
                onChange={e => setManualLyrics(e.target.value)}
              />
              <button onClick={submitManual} disabled={manualLoading || !manualLyrics.trim()} className="mt-3 w-full bg-pink-500 hover:bg-pink-400 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50">
                {manualLoading ? 'Processing...' : 'Generate & Save'}
              </button>
            </div>
          )}

          {result && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-gray-800 font-semibold text-lg">{result.title}</p>
                  <p className="text-gray-400 text-sm">{result.artist}</p>
                </div>
                {cached && <span className="text-xs bg-pink-100 text-pink-500 px-3 py-1 rounded-full">⚡ Cached</span>}
              </div>
              {searchResults.length > 1 && (
                <button onClick={() => setShowResults(!showResults)} className="text-gray-300 text-xs underline mb-4 block">Wrong song?</button>
              )}
              <div className="space-y-4 mt-4">
                {result.simplified.map((line, i) => (
                  <div key={i} className="border-l-2 border-pink-400 pl-4">
                    <p className="text-gray-800 text-lg font-medium">{line}</p>
                    <p className="text-sm text-pink-400 mt-1">{result.pinyin[i]}</p>
                    <p className="text-sm text-gray-400 mt-1 italic">{result.english[i] || ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  )
}
