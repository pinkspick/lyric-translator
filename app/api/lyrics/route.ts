import { NextRequest, NextResponse } from 'next/server'
import { pinyin, convertToPinyin } from 'pinyin-pro'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function searchLrcLib(query: string): Promise<{lyrics: string, title: string, artist: string} | null> {
  try {
    const res = await fetch("https://lrclib.net/api/search?q=" + encodeURIComponent(query))
    const data = await res.json()
    if (!data || data.length === 0) return null
    const track = data[0]
    return { lyrics: track.plainLyrics || "", title: track.trackName || "", artist: track.artistName || "" }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")
  const manual = request.nextUrl.searchParams.get("manual")
  if (!query) return NextResponse.json({ error: "No query" }, { status: 400 })

  let lines: string[] = []
  let title = ""
  let artist = ""

  if (manual === "true") {
    lines = query.split("\n").filter((l: string) => l.trim() !== "")
    title = "Manual Entry"
    artist = ""
  } else {
    const lrclib = await searchLrcLib(query)
    if (lrclib && lrclib.lyrics) {
      lines = lrclib.lyrics.split("\n").filter((l: string) => l.trim() !== "")
      title = lrclib.title
      artist = lrclib.artist
    }
  }

  if (lines.length === 0) {
    return NextResponse.json({ error: "Song not found. Try including the artist name, or add lyrics manually." }, { status: 404 })
  }

  // Convert each line to Simplified Chinese via MyMemory zh-TW to zh-CN per line
  const simplifiedLines: string[] = []
  for (const line of lines) {
    if (!line.trim()) { simplifiedLines.push(line); continue }
    try {
      const res = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(line) + "&langpair=zh-TW|zh-CN")
      const data = await res.json()
      simplifiedLines.push(data.responseData?.translatedText || line)
    } catch {
      simplifiedLines.push(line)
    }
    await sleep(100)
  }

  const pinyinLines = simplifiedLines.map((line: string) =>
    pinyin(line, { toneType: "symbol", separator: " " })
  )

  const englishLines: string[] = []
  for (const line of simplifiedLines.slice(0, 40)) {
    if (!line.trim()) { englishLines.push(""); continue }
    try {
      const res = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(line) + "&langpair=zh|en")
      const data = await res.json()
      englishLines.push(data.responseData?.translatedText || "")
    } catch {
      englishLines.push("")
    }
    await sleep(200)
  }

  return NextResponse.json({ title, artist, simplified: simplifiedLines, pinyin: pinyinLines, english: englishLines })
}
