import { NextRequest, NextResponse } from 'next/server'
import { pinyin } from 'pinyin-pro'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  if (!query) return NextResponse.json({ error: 'No query' }, { status: 400 })

  let lyrics = ''
  let title = ''
  let artist = ''

  const lrcRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`)
  const lrcData = await lrcRes.json()

  if (lrcData && lrcData.length > 0) {
    const track = lrcData[0]
    lyrics = track.plainLyrics || ''
    title = track.trackName || ''
    artist = track.artistName || ''
  }

  if (!lyrics) {
    return NextResponse.json({ error: 'Song not found. Try including the artist name, or search in Chinese characters.' }, { status: 404 })
  }

  const lines = lyrics.split('\n').filter((l: string) => l.trim() !== '')

  const pinyinLines = lines.map((line: string) =>
    pinyin(line, { toneType: 'symbol', separator: ' ' })
  )

  const englishLines: string[] = []
  for (const line of lines.slice(0, 40)) {
    if (!line.trim()) { englishLines.push(''); continue }
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(line)}&langpair=zh|en`)
      const data = await res.json()
      englishLines.push(data.responseData?.translatedText || '')
    } catch {
      englishLines.push('')
    }
    await sleep(200)
  }

  return NextResponse.json({ title, artist, simplified: lines, pinyin: pinyinLines, english: englishLines })
}
