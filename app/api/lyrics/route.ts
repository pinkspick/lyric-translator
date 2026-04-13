import { NextRequest, NextResponse } from 'next/server'
import { pinyin } from 'pinyin-pro'

// Common Traditional to Simplified character map
const tradToSimp: Record<string, string> = {
  '還':'还','這':'这','們':'们','個':'个','來':'来','時':'时','為':'为','國':'国','說':'说','對':'对',
  '會':'会','學':'学','現':'现','發':'发','開':'开','問':'问','關':'关','長':'长','電':'电','動':'动',
  '點':'点','實':'实','當':'当','從':'从','給':'给','後':'后','裡':'里','過':'过','樣':'样','頭':'头',
  '親':'亲','愛':'爱','嗎':'吗','著':'着','麼':'么','讓':'让','覺':'觉','變':'变','兒':'儿','見':'见',
  '聽':'听','話':'话','記':'记','讀':'读','離':'离','邊':'边','雖':'虽','語':'语','風':'风','飛':'飞',
  '萬':'万','歲':'岁','號':'号','車':'车','書':'书','門':'门','間':'间','錢':'钱','場':'场','臉':'脸',
  '藥':'药','樹':'树','橋':'桥','燈':'灯','鐘':'钟','壞':'坏','舊':'旧','帶':'带','買':'买','懷':'怀',
  '鄉':'乡','錯':'错','牽':'牵','畫':'画','霓':'霓','閃':'闪','決':'决','約':'约','隨':'随','換':'换',
  '難':'难','護':'护','讓':'让','願':'愿','總':'总','媽':'妈','爸':'爸','哥':'哥','姐':'姐','妹':'妹',
  '彼':'彼','此':'此','愁':'愁','夢':'梦','淚':'泪','傷':'伤','痛':'痛','情':'情','心':'心','愛':'爱',
  '歌':'歌','聲':'声','曲':'曲','樂':'乐','謝':'谢','請':'请','歡':'欢','喜':'喜','傳':'传','遠':'远',
  '近':'近','深':'深','淺':'浅','輕':'轻','重':'重','快':'快','慢':'慢','高':'高','低':'低','大':'大',
  '強':'强','弱':'弱','清':'清','濁':'浊','明':'明','暗':'暗','亮':'亮','暖':'暖','冷':'冷','熱':'热',
  '溫':'温','涼':'凉','甜':'甜','苦':'苦','酸':'酸','辣':'辣','鹹':'咸','淡':'淡','香':'香','臭':'臭',
  '美':'美','醜':'丑','好':'好','壞':'坏','真':'真','假':'假','新':'新','舊':'旧','多':'多','少':'少',
  '長':'长','短':'短','寬':'宽','窄':'窄','厚':'厚','薄':'薄','輕':'轻','飄':'飘','隨':'随','风':'风',
  '雨':'雨','雪':'雪','花':'花','草':'草','木':'木','石':'石','山':'山','水':'水','海':'海','天':'天',
  '地':'地','日':'日','月':'月','星':'星','雲':'云','霧':'雾','虹':'虹','霞':'霞','晴':'晴','陰':'阴',
  '燦':'灿','爛':'烂','璀':'璀','璨':'璨','絢':'绚','麗':'丽','華':'华','貴':'贵','富':'富','貧':'贫',
  '瘦':'瘦','胖':'胖','壯':'壮','老':'老','幼':'幼','青':'青','白':'白','黑':'黑','紅':'红','綠':'绿',
  '藍':'蓝','紫':'紫','黃':'黄','橙':'橙','粉':'粉','灰':'灰','棕':'棕','金':'金','銀':'银','銅':'铜',
  '鐵':'铁','鋼':'钢','玉':'玉','珠':'珠','寶':'宝','鑽':'钻','珍':'珍','翠':'翠','碧':'碧','瑩':'莹',
  '妳':'你','您':'您','他':'他','她':'她','它':'它','我':'我','我':'我','你':'你','妳':'你','他':'他',
  '緣':'缘','份':'份','牽':'牵','掛':'挂','念':'念','思':'思','憶':'忆','想':'想','知':'知','道':'道',
  '了':'了','嗯':'嗯','喔':'哦','哦':'哦','哈':'哈','嘻':'嘻','哇':'哇','啊':'啊','呀':'呀','唉':'唉',
  '嘿':'嘿','喂':'喂','哎':'哎','嗨':'嗨','喲':'哟','囉':'罗','嘍':'喽','啦':'啦','呢':'呢','吧':'吧',
  '嗎':'吗','嗚':'呜','哼':'哼','嗯':'嗯','唔':'嗯','吶':'呐','吼':'吼','喊':'喊','叫':'叫','唱':'唱',
  '跳':'跳','走':'走','跑':'跑','飛':'飞','落':'落','升':'升','降':'降','進':'进','退':'退','左':'左',
  '右':'右','前':'前','後':'后','上':'上','下':'下','裡':'里','外':'外','中':'中','間':'间','旁':'旁',
  '側':'侧','邊':'边','角':'角','端':'端','頂':'顶','底':'底','面':'面','背':'背','內':'内','層':'层',
}

function convertToSimplified(text: string): string {
  return text.split('').map(c => tradToSimp[c] || c).join('')
}

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
    if (text.toUpperCase().includes('QUERY LENGTH') || text.toUpperCase().includes('LIMIT') || text.toUpperCase().includes('MYMEMORY')) return ''
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
    lines = query.split('\n').filter((l: string) => l.trim() !== '').map(convertToSimplified)
    title = '手动添加'
    artist = ''
  } else {
    const result = await searchLrcLib(query)
    if (!result || !result.lyrics) {
      return NextResponse.json({ error: '未找到歌曲，请尝试添加歌手名称或手动添加歌词' }, { status: 404 })
    }
    // Convert instantly with local map - no API call needed
    lines = result.lyrics.split('\n')
      .filter((l: string) => l.trim() !== '')
      .map(convertToSimplified)
    title = convertToSimplified(result.title)
    artist = result.artist
  }

  if (lines.length === 0) {
    return NextResponse.json({ error: '未找到歌词' }, { status: 404 })
  }

  const pinyinLines = lines.map((line: string) =>
    pinyin(line, { toneType: 'symbol', separator: ' ' })
  )

  // Translate in parallel batches of 6 - fast
  const batchSize = 6
  const englishLines: string[] = new Array(lines.length).fill('')
  const batches = []
  for (let i = 0; i < lines.length; i += batchSize) {
    batches.push(lines.slice(i, i + batchSize).map((line, j) => 
      translateLine(line).then(result => { englishLines[i + j] = result })
    ))
  }
  await Promise.all(batches.flat())

  return NextResponse.json({ title, artist, simplified: lines, pinyin: pinyinLines, english: englishLines })
}
