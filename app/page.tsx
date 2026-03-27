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

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    const res = await fetch(`/api/lyrics?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    if (res.ok) setResult(data)
    else setError(data.error || 'Something went wrong')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-stone-950 text-white p-6 max-w-2xl mx-auto pb-20">
      <h1 className="text-2xl font-bold mb-1 text-rose-400">Lyric Translator</h1>
      <p className="text-stone-500 mb-6 text-sm">Simplified Chinese · Pinyin · English</p>
      <div className="flex gap-2 mb-8">
        <input
          className="flex-1 bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-rose-400"
          placeholder="e.g. 还在流浪 or moon represents my heart"
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
      {error && <p className="text-red-400 mb-4">{error}</p>}
      {result && (
        <div>
          <p className="text-white font-semibold text-lg">{result.title}</p>
          <p className="text-stone-400 text-sm mb-6">{result.artist}</p>
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
