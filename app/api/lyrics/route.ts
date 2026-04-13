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

async function translateLine(line: string): Promise<string> {
  if (!line.trim()) return ''
  try {
    const res = await fetch(
      'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(line.slice(0, 200)) + '&langpair=zh|en'
    )
    const data = await res.json()
    const text = data.responseData?.translatedText || ''
    if (text.toUpperCase().includes('QUERY LENGTH') || text.toUpperCase().includes('LIMIT EXCEEDED') || text.toUpperCase().includes('MYMEMORY')) return ''
    return text
  } catch { return '' }
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
    title = '手动添加'
    artist = ''
  } else {
    const result = await searchLrcLib(query)
    if (!result || !result.lyrics) {
      return NextResponse.json({ error: '未找到歌曲，请尝试添加歌手名称或手动添加歌词' }, { status: 404 })
    }
    lines = result.lyrics.split('\n').filter((l: string) => l.trim() !== '')
    title = result.title
    artist = result.artist
  }

  if (lines.length === 0) {
    return NextResponse.json({ error: '未找到歌词' }, { status: 404 })
  }

  const pinyinLines = lines.map((line: string) =>
    pinyin(line, { toneType: 'symbol', separator: ' ' })
  )

  // Translate in parallel batches of 4
  const batchSize = 4
  const englishLines: string[] = new Array(lines.length).fill('')
  for (let i = 0; i < lines.length; i += batchSize) {
    const batch = lines.slice(i, i + batchSize)
    const results = await Promise.all(batch.map(translateLine))
    results.forEach((r, j) => { englishLines[i + j] = r })
  }

  return NextResponse.json({ title, artist, simplified: lines, pinyin: pinyinLines, english: englishLines })
}
