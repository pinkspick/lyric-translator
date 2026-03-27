'use client'
import { useState } from 'react'

type LyricResult = {
  title: string
  artist: string
  simplified: string[]
  pinyin: string[]
  english: string[]
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

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setCached(false)
    setShowManual(false)

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
    } else {
      setError(data.error || 'Song not found.')
      setShowManual(true)
    }
    setLoading(false)
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
      setShowManual(false)
      setManualLyrics('')
    } else {
      setError('Could not process lyrics. Try again.')
    }
    setManualLoading(false)
  }

  return (
    <main className="min-h-screen bg-stone-950 text-white p-6 max-w-2xl mx-auto pb-20">
      <h1 className="text-2xl font-bold mb-1 text-rose-400">Lyric Translator</h1>
      <p className="text-stone-500 mb-6 text-sm">Simplified Chinese · Pinyin · English</p>

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-rose-400"
          placeholder="e.g. 玉兰花 Ryan B or 还在流浪"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
        />
        <button
          onClick={search}
          className="bg-rose-500 hover:bg-rose-400 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {loading && (
        <div className="text-center text-stone-400 mt-20">
          <p className="text-4xl mb-4">🎵</p>
          <p>Fetching lyrics...</p>
          <p className="text-xs mt-2 text-stone-600">First time takes ~20s. Saved after this.</p>
        </div>
      )}

      {error && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-4">
          <p className="text-red-400 mb-1">{error}</p>
          <p className="text-stone-500 text-sm">Could not find this song automatically.</p>
        </div>
      )}

      {showManual && (
        <div className="bg-stone-900 border border-rose-500 rounded-xl p-5 mb-6">
          <p className="text-white font-semibold mb-1">Add lyrics manually</p>
          <p className="text-stone-400 text-sm mb-4">Paste the Chinese lyrics below. App will generate pinyin + English and save it.</p>
          <textarea
            className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-rose-400 h-48 resize-none"
            placeholder="Paste lyrics here, one line per line..."
            value={manualLyrics}
            onChange={e => setManualLyrics(e.target.value)}
          />
          <button
            onClick={submitManual}
            disabled={manualLoading || !manualLyrics.trim()}
            className="mt-3 w-full bg-rose-500 hover:bg-rose-400 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {manualLoading ? 'Processing...' : 'Generate & Save'}
          </button>
        </div>
      )}

      {result && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white font-semibold text-lg">{result.title}</p>
              <p className="text-stone-400 text-sm">{result.artist}</p>
            </div>
            {cached && (
              <span className="text-xs bg-stone-800 text-rose-400 px-3 py-1 rounded-full">⚡ Cached</span>
            )}
          </div>
          <div className="space-y-5">
            {result.simplified.map((line, i) => (
              <div key={i} className="border-l-2 border-rose-500 pl-4">
                <p className="text-lg text-white font-medium">{line}</p>
                <p className="text-sm text-rose-300 mt-1">{result.pinyin[i]}</p>
                <p className="text-sm text-stone-400 mt-1 italic">{result.english[i] || ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
