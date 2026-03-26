import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  if (!query) return NextResponse.json({ error: 'No query' }, { status: 400 })

  // 1. Fetch lyrics from LRCLIB
  const lrcRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`)
  const lrcData = await lrcRes.json()

  if (!lrcData || lrcData.length === 0) {
    return NextResponse.json({ error: 'No lyrics found' }, { status: 404 })
  }

  const track = lrcData[0]
  const lyrics = track.plainLyrics || ''
  const title = track.trackName || ''
  const artist = track.artistName || ''

  // 2. Translate to English via MyMemory
  const translateRes = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(lyrics.slice(0, 500))}&langpair=zh|en`
  )
  const translateData = await translateRes.json()
  const english = translateData.responseData?.translatedText || ''

  return NextResponse.json({
    title,
    artist,
    traditional: lyrics,
    simplified: lyrics,
    pinyin: '',
    english,
  })
}find app/api -type f