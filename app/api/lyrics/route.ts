import { NextRequest, NextResponse } from 'next/server'
import { pinyin } from 'pinyin-pro'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function searchNetEase(query: string): Promise<{lyrics: string, title: string, artist: string} | null> {
  try {
    const searchRes = await fetch("https://music.163.com/api/search/get?s=" + encodeURIComponent(query) + "&type=1&limit=5", {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://music.163.com" }
    })
    const searchData = await searchRes.json()
    const songs = searchData?.result?.songs
    if (!songs || songs.length === 0) return null
    const song = songs[0]
    const id = song.id
    const title = song.name
    const artist = song.artists?.[0]?.name || ""
    const lyricRes = await fetch("https://music.163.com/api/song/lyric?id=" + id + "&lv=1&kv=1&tv=-1", {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://music.163.com" }
    })
    const lyricData = await lyricRes.json()
    const raw = lyricData?.lrc?.lyric || ""
    const lyrics = raw.split("\n")
      .map((line: string) => line.replace(/\[\d+:\d+\.\d+\]/g, "").trim())
      .filter((line: string) => line.length > 0)
      .join("\n")
    return { lyrics, title, artist }
  } catch {
    return null
  }
}

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
    const netease = await searchNetEase(query)
    if (netease && netease.lyrics) {
      lines = netease.lyrics.split("\n").filter((l: string) => l.trim() !== "")
      title = netease.title
      artist = netease.artist
    } else {
      const lrclib = await searchLrcLib(query)
      if (lrclib && lrclib.lyrics) {
        lines = lrclib.lyrics.split("\n").filter((l: string) => l.trim() !== "")
        title = lrclib.title
        artist = lrclib.artist
      }
    }
  }

  if (lines.length === 0) {
    return NextResponse.json({ error: "Song not found. Try including the artist name, or add lyrics manually." }, { status: 404 })
  }

  const pinyinLines = lines.map((line: string) =>
    pinyin(line, { toneType: "symbol", separator: " " })
  )

  const englishLines: string[] = []
  for (const line of lines.slice(0, 40)) {
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

  return NextResponse.json({ title, artist, simplified: lines, pinyin: pinyinLines, english: englishLines })
}
