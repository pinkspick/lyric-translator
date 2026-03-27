import { NextRequest, NextResponse } from 'next/server'
import { pinyin } from 'pinyin-pro'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function toSimplified(text: string): Promise<string> {
  try {
    const res = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=zh-TW|zh-CN')
    const data = await res.json()
    return data.responseData?.translatedText || text
  } catch {
    return text
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  const manual = request.nextUrl.searchParams.get('manual')
  if (!query) return NextResponse.json({ error: 'No query' }, { status: 400 })

  let lines: string[] = []
  let title = ''
  let artist = ''

  if (manual === 'true') {
    const rawLines = query.split('\n').filter((l: string) => l.trim() !== '')
    const simplified: string[] = []
    for (const line of rawLines) {
      const s = await toSimplified(line)
      simplified.push(s)
      await sleep(100)
    }
    lines = simplified
    title = 'Manual Entry'
    artist = ''
  } else {
    const lrcRes = await fetch('https://lrclib.net/api/search?q=' + encodeURIComponent(query))
    const lrcData = await lrcRes.json()

    if (!lrcData || lrcData.length === 0) {
      return NextResponse.json({ error: 'Song not found. Try including the artist name, or search in Chinese characters.' }, { status: 404 })
    }

    const track = lrcData[0]
    const lyrics = track.plainLyrics || ''
    title = track.trackName || ''
    artist = track.artistName || ''
    lines = lyrics.split('\n').filter((l: string) => l.trim() !== '')
  }

  if (lines.length === 0) {
    return NextResponse.json({ error: 'No lyrics content found.' }, { status: 404 })
  }

  const pinyinLines = lines.map((line: string) =>
    pinyin(line, { toneType: 'symbol', separator: ' ' })
  )

  const englishLines: string[] = []
  for (const line of lines.slice(0, 40)) {
    if (!line.trim()) { englishLines.push(''); continue }
    try {
      const res = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(line) + '&langpair=zh|en')
      const data = await res.json()
      englishLines.push(data.responseData?.translatedText || '')
    } catch {
      englishLines.push('')
    }
    await sleep(200)
  }

  return NextResponse.json({ title, artist, simplified: lines, pinyin: pinyinLines, english: englishLines })
}
