import { NextRequest, NextResponse } from 'next/server'
import { pinyin } from 'pinyin-pro'

async function searchLrcLib(query: string) {
  try {
    const res = await fetch('https://lrclib.net/api/search?q=' + encodeURIComponent(query))
    const data = await res.json()
    if (!data || data.length === 0) return null
    const track = data[0]
    return { lyrics: track.plainLyrics || '', title: track.trackName || '', artist: track.artistName || '' }
  } catch { return null }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  const manual = request.nextUrl.searchParams.get('manual')
  if (!query) return NextResponse.json({ error: 'No query' }, { status: 400 })

  let lines: string[] = []
  let title = ''
  let artist = ''

  if (manual === 'true') {
    lines = query.split('\n').filter((l: string) => l.trim() !== '')
    title = 'Manual Entry'
    artist = ''
  } else {
    const result = await searchLrcLib(query)
    if (!result || !result.lyrics) {
      return NextResponse.json({ error: 'Song not found. Try including the artist name, or add lyrics manually.' }, { status: 404 })
    }
    lines = result.lyrics.split('\n').filter((l: string) => l.trim() !== '')
    title = result.title
    artist = result.artist
  }

  if (lines.length === 0) {
    return NextResponse.json({ error: 'No lyrics found.' }, { status: 404 })
  }

  const pinyinLines = lines.map((line: string) =>
    pinyin(line, { toneType: 'symbol', separator: ' ' })
  )

  // Batch translate all lines at once - much faster
  let englishLines: string[] = lines.map(() => '')
  try {
    const combined = lines.slice(0, 40).join(' | ')
    const res = await fetch(
      'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(combined) + '&langpair=zh|en'
    )
    const data = await res.json()
    const translated = data.responseData?.translatedText || ''
    const parts = translated.split(' | ')
    englishLines = lines.map((_: string, i: number) => parts[i]?.trim() || '')
  } catch {
    englishLines = lines.map(() => '')
  }

  return NextResponse.json({ title, artist, simplified: lines, pinyin: pinyinLines, english: englishLines })
}
