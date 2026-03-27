import { NextRequest, NextResponse } from 'next/server'
import { pinyin } from 'pinyin-pro'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function tradToSimplified(text: string): string {
  const map: Record<string, string> = {
    '還':'还','這':'这','們':'们','個':'个','來':'来','時':'时','為':'为','國':'国','說':'说','對':'对',
    '會':'会','學':'学','現':'现','發':'发','開':'开','問':'问','關':'关','長':'长','電':'电','動':'动',
    '點':'点','實':'实','當':'当','從':'从','給':'给','後':'后','裡':'里','過':'过','樣':'样','頭':'头',
    '親':'亲','愛':'爱','妳':'你','妳':'你','嗎':'吗','啊':'啊','著':'着','麼':'么','讓':'让','覺':'觉',
    '變':'变','兒':'儿','見':'见','聽':'听','話':'话','記':'记','讀':'读','離':'离','邊':'边','雖':'虽',
    '歌':'歌','語':'语','風':'风','飛':'飞','萬':'万','歲':'岁','號':'号','車':'车','書':'书','門':'门',
    '間':'间','錢':'钱','隻':'只','場':'场','臉':'脸','藥':'药','樹':'树','橋':'桥','燈':'灯','鐘':'钟',
    '壞':'坏','擺':'摆','舊':'旧','賣':'卖','帶':'带','買':'买','跡':'迹','曾':'曾','懷':'怀','鄉':'乡',
    '錯':'错','牽':'牵','巷':'巷','教':'教','畫':'画','霓':'霓','虹':'虹','閃':'闪','爍':'烁','靠':'靠',
    '窗':'窗','招':'招','牌':'牌','泡':'泡','夜':'夜','背':'背','包':'包','異':'异','決':'决','定':'定',
    '封':'封','信':'信','約':'约','隨':'随','身':'身','照':'照','片','片','微':'微','笑':'笑','模':'模',
  }
  return text.split('').map(c => map[c] || c).join('')
}

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
  const simplifiedLines = lines.map((line: string) => tradToSimplified(line))
  const pinyinLines = simplifiedLines.map((line: string) =>
    pinyin(line, { toneType: 'symbol', separator: ' ' })
  )

  const englishLines: string[] = []
  for (const line of lines.slice(0, 40)) {
    if (!line.trim()) { englishLines.push(''); continue }
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(line)}&langpair=zh|en`
      )
      const data = await res.json()
      englishLines.push(data.responseData?.translatedText || '')
    } catch {
      englishLines.push('')
    }
    await sleep(200)
  }

  return NextResponse.json({ title, artist, simplified: simplifiedLines, pinyin: pinyinLines, english: englishLines })
}
// fresh build Fri Mar 27 10:18:38 WIB 2026
