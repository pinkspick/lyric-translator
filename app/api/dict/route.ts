import { NextRequest, NextResponse } from 'next/server'

// Uses MDBG CC-CEDICT API (free, no key needed)
export async function GET(request: NextRequest) {
  const word = request.nextUrl.searchParams.get('w')
  if (!word) return NextResponse.json({ definition: '' })

  try {
    const res = await fetch(
      'https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=' + encodeURIComponent(word),
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const html = await res.text()

    // Extract definition from MDBG HTML
    const match = html.match(/class="defs"[^>]*>([^<]+)</)
    if (match) {
      return NextResponse.json({ definition: match[1].trim() })
    }
    return NextResponse.json({ definition: '' })
  } catch {
    return NextResponse.json({ definition: '' })
  }
}
